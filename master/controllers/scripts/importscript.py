import math
import traceback

import numpy as np
from master.controllers.objects import *
import os
import csv
from sklearn.preprocessing import Imputer


def from_bins(low, high, bins):
    lala = []
    step = float(high - low + 1)/bins
    under_step = int(math.ceil(step))
    if under_step < 1:
        under_step = 1
    x = low
    while x <= high:
        lala.append((x, x + under_step - 1))
        x += under_step
    return lala


def impute_data(name, ipaddress):
    db.set_dataset(name)
    ds.load(db, name, ipaddress)
    db.delete("DELETE FROM " + name + "_records_imputed")

    # compute the percentage of measured data for each category
    # this is necessary to be able to prevent hardly ever measured categories from being imputed.
    mean_measured_per_category = counts_per_category(name)

    # alleen voor kolommen pakken met categorya erin waar er minsten 80% gemeten is voor dat categoryum
    filtered_categories = [category for category in mean_measured_per_category
                                          if mean_measured_per_category[category] >= 0]

    categories_obj = Item(without=Item(without=filtered_categories).list())

    # retrieve raw data from database which will be imputed for only the categories selected
    records = db.query(("SELECT " + categories_obj.as_columns('records_missing') + ", " + name + "_records.id FROM " +
                        name + "_records JOIN " + name + "_records_missing on " + name + "_records.id = " + name + "_records_missing.record_id "
                        ,())).fetchall()

    categories_list = categories_obj.list()
    categories_set = frozenset(categories_list)

    matrix = []
    for record in records:

        # measured - but not resistant patterns are marked with a 0, but this is already given in the array by default
        row = [0] * len(categories_list)

        # compute the resistance patterns for the record with the given categories
        patterns = ItemSet.compute_pattern(record, categories_list, raw=True)

        # mark resistant categories with a 1
        for i in patterns['resistant']:
            row[categories_list.index(i)] = 1

        # resistance patterns are left which where not measured, these cells have to be imputed and are given with
        # a NaN value
        subtract = categories_set - (frozenset(patterns['resistant']) | frozenset(patterns['not_resistant']))
        record['imputed'] = []
        for i in subtract:
            row[categories_list.index(i)] = np.NaN
            record['imputed'].append(i)

        # the resistance pattern is added to the matrix
        matrix.append(row)

    # softImpute algorithm is performed on the matrix
    try:
        imputed_records = Imputer().fit_transform(np.asarray(matrix))
        imputed_records[imputed_records > 1] = 1
        imputed_records[imputed_records < 0] = 0
        # imputed_records = SoftImpute(min_value=0, max_value=1, verbose=False).complete(np.asarray(matrix))
    except ValueError as e:
        if str(e) == "Input matrix is not missing any values":
            imputed_records = np.asarray(matrix)
        else:
            print(str(e))
            traceback.print_exc()
            raise Exception(e)

    # since we now have performed imputation on the matrix, we need to store this matrix in the database
    # with each separate row in the matrix is stored as a single record

    # for the query we need "insert into (%s, %s, %s, ..)"
    joined_s = ", ".join(["%s"] * len(categories_list))

    # the query to insert imputed data into the database
    query = "INSERT INTO "+ name + "_records_imputed (" + categories_obj.as_columns('') + ",record_id, imputed) VALUES (" + joined_s + ",%s, %s)"

    rows_to_insert = []

    for rowid, row in enumerate(imputed_records):
        # the imputation algorithm results in values between 0 and 1
        # these values have to be rounded to 0 and 1
        for cellid, cell in enumerate(row):
            imputed_records[rowid, cellid] = int(round(imputed_records[rowid, cellid]))

        # we now have to store the record into the database
        inserts = tuple(list(map(int, row)) + [records[rowid]['id'], json.dumps(records[rowid]["imputed"])])
        rows_to_insert.append(inserts)

    # since the dataset is quite large, it will be stored in chunks automatically
    db.insert((query, rows_to_insert))


def counts_per_category(dbname):
    categories_obj = Item(without=['a'])
    categories_list = categories_obj.list()
    categories_set = frozenset(categories_list)
    counts = {antb: {'resistant': 0, 'not-resistant': 0, 'unknown': 0} for antb in categories_list}
    total_records = 0
    a = categories_obj.as_columns('records_missing')
    records = db.query(("SELECT " + categories_obj.as_columns('records_missing') + ","+ dbname + "_records.id FROM " +
                        dbname + "_records JOIN " + dbname + "_records_missing on " + dbname + "_records.id = " + dbname + "_records_missing.record_id "
                        , ())).fetchall()
    total_records += len(records)
    for record in records:
        patterns = ItemSet.compute_pattern(record, categories_list, raw=True)
        for i in patterns['resistant']:
            counts[i]['resistant'] += 1
        for i in patterns['not_resistant']:
            counts[i]['not-resistant'] += 1
        subtract = categories_set - (frozenset(patterns['resistant']) | frozenset(patterns['not_resistant']))
        for i in subtract:
            counts[i]['unknown'] += 1

    total_missing = 0
    means = {}
    for category in counts:
        means[category] = []
        base = counts[category]
        total_missing += base["unknown"]
        measured_percentage = float(base['resistant'] + base['not-resistant']) / float(base['resistant'] + base['not-resistant'] + base['unknown'])
        means[category].append(measured_percentage)
        means[category] = np.mean(means[category])

    # we want to know the means of the measured percentages from the data after 2012 for each category
    # and return these
    return means


def import_dataset_to_db(jsonContents, file_path, ipaddress):
    name = "".join(x for x in jsonContents['title'].replace(" ", "-") if x.isalnum())
    print(name)
    s = db.query(("SELECT * FROM datasets WHERE name = %s", (name,))).fetchone()
    if s:
        raise Exception("sorry, choose another name")

    if not name:
        raise ValueError("name must contain at least 4 characters")

    if name == "Movies" or name == "Les Miserables":
        ipaddress = ""

    _, file_ext = os.path.splitext(file_path)
    if file_ext != '.csv' and file_ext != ".txt":
        raise Exception("Wrong file extension " + file_ext)

    try:
        with open(file_path, 'r') as f:
            csvreader = csv.reader(f, delimiter=';', quotechar='"')
            attributes = []
            attrbs_obj = {}
            temporal = False
            temp_attr = [None, []]
            sorted_attr = []
            categories = []
            non_info_attrbs = []
            category_idx_offset = 0
            set_category_offset = False
            # get header data
            for row in csvreader:
                for idx, i in enumerate(row):
                    if "_temp" in i:
                        temporal = True
                        temp_attr[0] = i
                    if "_temp" in i or "_attr" in i:
                        attributes.append(i.lower())

                    if "_category" in i:
                        if not set_category_offset:
                            category_idx_offset = idx
                            set_category_offset = True
                        categories.append(i.lower())
                break
            for idx, attr in enumerate(attributes):
                if "_temp" in attr:
                    print(attr, " is the temporal attribute. Do realize this attribute cannot be numeric!")
                    print("the timeline will be sorted STRING-wise. Hence if numbers, provide leading zeros in CSV file.")
                    print("Namely a list of values ['2', '12'] will be sorted as ['12', '2']. Instead use ['02', '12'].")
                    print("Dates should be printed in american format, since this is perfect for sorting. YYYY-MM-DD. Or YYYY-MM.")
                    numericalAttr = False
                    visualize = True
                else:
                    if attr not in jsonContents:
                        raise Exception("you forgot to include the attribute " + attr)
                    visualizeAttr = jsonContents[attr]["visualize"]
                    numericalAttr = jsonContents[attr]["numerical"]

                if visualizeAttr:
                    f.seek(0)
                    next(csvreader)
                    l = []
                    for row in csvreader:
                        if row[idx] is not None and row[idx] != '':
                            if numericalAttr:
                                l.append(int(round(float(row[idx]))))
                            else:
                                l.append(row[idx])
                    lset = set(l)

                    if "_temp" in attr:
                        temp_attr[1] = list(lset)

                    if numericalAttr:
                        print("lset contains the unique values: ", list(lset))
                        print("with max ", max(lset), "and min", min(lset))
                        print("in how many bins does this data need to be binned?")
                        if "bins" not in jsonContents[attr]:
                            raise Exception("you forgot to include the number of bins for the attribute " + attr)
                        bins = jsonContents[attr]["bins"]
                        binned = from_bins(min(lset), max(lset), int(bins))
                        print("the result is ", binned)
                        attrbs_obj[attr] = binned
                        sorted_attr.append(attr)
                    else:
                        attrbs_obj[attr] = "exact"
                else:
                    non_info_attrbs.append(attr)

            insert_tuple = (name, int(temporal), json.dumps(attrbs_obj), json.dumps(non_info_attrbs),
                            json.dumps(sorted_attr), json.dumps(temp_attr), ipaddress)
            db.insert(("INSERT INTO datasets (name, temporal, attributes, non_info_attrbs, sort, temp_attr, ipaddress) "
                       "VALUES (%s, %s, %s, %s, %s, %s, %s)", [insert_tuple]))

            db.query(("""CREATE TABLE IF NOT EXISTS """ + name + """_cache (
                  id serial primary key,
                  date date NOT NULL,
                  query text NOT NULL,
                  description varchar(255) NOT NULL,
                  result text NOT NULL,
                  properties_id integer NOT NULL
            )""", ()))

            db.query(("""CREATE TABLE IF NOT EXISTS """ + name + """_cache_properties (
                    id serial primary key,
                    properties text NOT NULL
            )""", ()))

            attributes_sql = ", ".join([attr.lower() + " varchar(256) NOT NULL " for attr in attributes])
            db.query(("""CREATE TABLE IF NOT EXISTS """ + name + """_records (
                id serial primary key, """ + attributes_sql + """
            )""", ()))

            db.query(("""CREATE TABLE IF NOT EXISTS """ + name + """_records_missing (record_id integer  NOT NULL primary key,""" +
                      ", ".join([category.lower() + " smallint default NULL" for category in categories]) + """ 
                            )""", ()))

            db.query(("""CREATE TABLE IF NOT EXISTS """ + name + """_records_imputed (
                        record_id integer  NOT NULL primary key,
                        imputed text,""" +
                        ", ".join([category.lower() + " smallint default NULL" for category in categories]) + """ 
                    )""", ()))

            db.query(("""CREATE TABLE IF NOT EXISTS """ + name + """_sets (
                  id serial primary key,
                  category varchar(255) NOT NULL,
                  visible smallint NOT NULL DEFAULT '0',
                  classificatie varchar(255) NOT NULL,
                  description varchar(255) NOT NULL
             )""", ()))

            category_counts = {cat: 0 for cat in categories}
            f.seek(0)
            next(csvreader)
            for row in csvreader:
                for idx, category in enumerate(categories):
                    if row[idx + category_idx_offset] == '1':
                        category_counts[category] += 1
            print(Counter(category_counts).most_common())
            most_common = Counter(category_counts).most_common()[:15]
            most_common = [a[0] for a in most_common]
            for category in categories:
                cat = category.replace("_category", "")
                print("category: ", cat)
                visible = int(category in most_common)
                classification = ""
                description = cat
                db.insert((" INSERT INTO " + name + "_sets (category, visible, classificatie, description) VALUES (%s, %s, %s, %s)", [
                    (cat, visible, classification, description)
                ]))

            insert_tuples = []
            insert_missing_data = []
            f.seek(0)
            next(csvreader)
            for rowidx, row in enumerate(csvreader):
                g = []
                for idx, attr in enumerate(attributes):
                    g.append(row[idx])
                insert_tuples.append(g)
                h = [rowidx + 1]
                for idx, cat in enumerate(categories):
                    r = row[idx + category_idx_offset]
                    if r == '':
                        r = None
                    h.append(r)
                insert_missing_data.append(h)
            attributes_s_sql = ",".join(["%s"]*len(attributes))
            attributes_sql = ", ".join(attributes)
            categories_s_sql = ",".join(["%s"] * len(categories))
            categories_sql = ", ".join(categories)
            print(len(insert_missing_data), len(insert_tuples))
            db.insert(("INSERT INTO " + name + "_records ("+attributes_sql+") VALUES ("+attributes_s_sql+")",
                       insert_tuples))
            db.insert(("INSERT INTO " + name + "_records_missing (record_id, " + categories_sql + ") VALUES (%s," + categories_s_sql + ")",
                       insert_missing_data))

            print("everything has been inserted")
            print("imputing.......")
            impute_data(name, ipaddress)
            print("completed.")
    except Exception as e:
        print(e)
        traceback.print_exc()
        db.query(("DROP TABLE IF EXISTS " + name + "_cache", ()))
        db.query(("DROP TABLE IF EXISTS " + name + "_cache_properties", ()))
        db.query(("DROP TABLE IF EXISTS " + name + "_records", ()))
        db.query(("DROP TABLE IF EXISTS " + name + "_records_imputed", ()))
        db.query(("DROP TABLE IF EXISTS " + name + "_records_missing", ()))
        db.query(("DROP TABLE IF EXISTS " + name + "_sets", ()))
        db.query(("DELETE FROM datasets WHERE name = %s and ipaddress = %s",(name, ipaddress)))

        raise Exception("Something went wrong.")

    return name


if __name__ == "__main__":
    path = ROOT + "/datasets/"
    with open(path + "mis.json", "r") as f:
        import_dataset_to_db(json.loads(f.read()), path + "mis.csv", "127.0.0.1")
