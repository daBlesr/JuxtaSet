from master.constants import *
from itertools import combinations
from collections import Counter
import copy


class Color(object):
    def __init__(self, col=None):
        if not col:
            col = 'aggreset'
        query = ("SELECT * FROM colors WHERE name = %s", (col,))
        self.color = db.query(query).fetchone()
        db.db.commit()

    @staticmethod
    def all():
        query = ("SELECT * FROM colors ORDER BY pos ASC", ())
        res = db.query(query).fetchall()
        db.db.commit()
        return res


def get_from_filter(f, key):
    for i in f:
        if i[0] == key:
            return i[1]
    return None


class Elements(object):
    table = 'records'

    def __init__(self, filters, records_cache_id=None):
        self.filters = filters
        self.antibiogramObject = None
        self.categoriesObj = Item(without=get_from_filter(self.filters, 'items_filtered'),
                                   classifications=get_from_filter(self.filters, 'classifications'))
        self.categories = self.categoriesObj.as_columns()
        self.list_of_categories = self.categoriesObj.list()
        self.classifications = get_from_filter(self.filters, 'classifications')
        if self.classifications:
            self.dict_of_classifications = self.categoriesObj.classificaties()
        self.records_cache_id = records_cache_id
        self.exact_resistance_pattern = None
        self.query = ''
        self.patient_properties = None
        self.set_patient_properties()

    @staticmethod
    def is_resistant(ant):
        return db.dataset+"_records_imputed." + ant + config['db_postfix'] + " = 1 "

    @staticmethod
    def is_not_resistant(ant):
        return db.dataset+"_records_imputed." + ant + config['db_postfix'] + " = 0 "

    @staticmethod
    def is_imputed():
        return db.dataset+'_records_imputed.imputed LIKE %s '

    @staticmethod
    def is_not_imputed():
        return db.dataset + '_records_imputed.imputed LIKE "[]" '

    @staticmethod
    def is_missing(ant):
        return db.dataset+"_records_imputed." + ant + config['db_postfix'] + " is NULL "

    def create_query(self, limit=None, offset=0, orderBy=None):
        # NOG VERANDEREN OM SQL INJECTION TE VOORKOMEN
        arguments = []
        q = "SELECT " + self.categories + ", id, " + ds.db_str + " FROM "+db.dataset+"_records join "+db.dataset+"_records_imputed on id = record_id WHERE "

        if self.records_cache_id:
            records = Cache.get_where_id(self.records_cache_id)
            q += " id IN (" + ', '.join(str(x) for x in records["result"]) + ') and '

        if self.exact_resistance_pattern:
            for ant in self.exact_resistance_pattern['resistant']:
                q += self.is_resistant(ant) + " and "
            for ant in self.exact_resistance_pattern['measured_not_resistant']:
                q += self.is_not_resistant(ant) + " and "
            w = []
            if self.exact_resistance_pattern['imputed'] is not None:
                if self.exact_resistance_pattern['imputed']:
                    w = self.exact_resistance_pattern['imputed']
                    for ant in self.exact_resistance_pattern['imputed']:
                        q += self.is_imputed() + " and "
                        arguments.append('%"' + ant + '"%')
                else:
                    q += self.is_not_imputed()  + " and "

            for ant in self.list_of_categories:
                # rest van de category die niet gemeten waren mogen dan ook geen waarde hebben
                if ant not in self.exact_resistance_pattern['measured_not_resistant'] \
                        and ant not in self.exact_resistance_pattern['resistant']\
                        and ant not in w:
                    q += self.is_missing(ant) + " and "
        else:
            pattern_contains = get_from_filter(self.filters, 'pattern_contains')
            if len(pattern_contains):
                if self.classifications:
                    for classif in pattern_contains:
                        ants = self.dict_of_classifications[classif]
                        q += " ( "
                        for i, ant in enumerate(ants):
                            q += self.is_resistant(ant)
                            if i < len(ants) - 1:
                                q += " OR "
                        q += " ) AND "
                else:
                    for f in self.filters:
                        if f[0] == "pattern_contains":
                            if len(f) < 3 or f[2] == "AND":
                                for g in f[1]:
                                    q += self.is_resistant(g) + " and "
                            else:
                                q += " ( "
                                for idx, x in enumerate(f[1]):
                                    q += self.is_resistant(x) + " "
                                    if idx < len(f[1]) - 1:
                                        q += " OR "
                                q += " ) AND "

        for f in self.filters:
            if f[0] in ds.attrbs and f[1] != "all":
                if len(f) < 3 or f[2] == "AND":
                    if isinstance(f[1], str):
                        q += ds.from_chart_to_query(f[0], f[1]) + " AND "
                    else:
                        for x in f[1]:
                            q += ds.from_chart_to_query(f[0], x) + " AND "
                else:
                    if isinstance(f[1], str):
                        q += ds.from_chart_to_query(f[0], f[1]) + " AND "
                    else:
                        q += " ( "
                        for idx, x in enumerate(f[1]):
                            q += ds.from_chart_to_query(f[0], x)
                            if idx < len(f[1]) - 1:
                                q += " OR "
                        q += " ) AND "
        q += " 1=1 "
        if orderBy:
            q += " order by " + orderBy[0] + " " + orderBy[1]
        if limit:
            q += " LIMIT " + str(limit)
        if offset:
            q += " OFFSET " + str(offset)
        self.query = (q, tuple(arguments))
        return self.query

    def set_patient_properties(self):
        self.patient_properties = {
            "filters": self.filters,
            "records_cache_id": self.records_cache_id,
            "exact_resistance_pattern": self.exact_resistance_pattern,
        }

    @classmethod
    def from_patient_properties(cls, x):
        return cls(x["filters"],
                   x["records_cache_id"])

    def where_exact_resistant_pattern(self, resistant, measured_not_resistant, imputed=None):
        self.exact_resistance_pattern = {'resistant': resistant,
                                         'measured_not_resistant': measured_not_resistant,
                                         'imputed': imputed}
        self.set_patient_properties()
        return self

    def delete_exact_resistant_pattern(self):
        self.exact_resistance_pattern = None
        self.set_patient_properties()
        return self

    def antibiogram(self, antibiogram=None, nesting=6):
        self.antibiogramObject = ItemSet(self)

        if antibiogram == 'relative':
            return self.antibiogramObject.get_relative_occurrences(int(nesting))

        elif antibiogram == 'exact':
            return self.antibiogramObject.antibiogram

        elif antibiogram == 'mining':
            return self.antibiogramObject.get_antibiolist()

        elif antibiogram == 'panels':
            return self.antibiogramObject.get_panels()

    def statistics(self, records=None):
        caching = False
        if not records:
            caching = True
            cache_result = Cache.get_where_query(self.patient_properties, 'statistics')
            if cache_result:
                return cache_result['result']

            records = db.query(self.create_query()).fetchall()

        statistics = {}
        total_no_records = len(records)

        for attr in ds.classifications:
            z = {attr_value: 0 for attr_value in ds.classifications[attr]}
            y = Counter([ds.from_query_to_chart(attr, str(r[attr])) for r in records if r[attr] != ''])
            z.update(y)
            if attr in ds.sorted_attrbs:
                items = Counter(z).items()
                itemsc = [(int(a[0].split("-")[0]), a) for a in items]
                itemssorted = sorted(itemsc)
                statistics[attr] = [i[1] for i in itemssorted]
            else:
                statistics[attr] = Counter(z).most_common()

        self.antibiogram('exact')
        antibiolist = self.antibiogramObject.get_antibiolist()

        category_dist = {x: 0 for x in self.categoriesObj.list()}

        for patient in antibiolist:
            for category in patient:
                category_dist[category] += 1

        statistics["elements"] = records[0:30]
        statistics["pattern_contains"] = sorted(category_dist.items(), key=lambda x: x[1], reverse=True)
        statistics["total_records"] = total_no_records
        if caching: Cache.create(self.patient_properties, 'statistics', statistics)
        return statistics

    def before_imputation(self):
        cache_result = Cache.get_where_query(self.patient_properties, 'before-imputation')
        if cache_result:
            return cache_result['result']

        # given the filters defined on the view,
        # collect all the patient records
        records = db.query(self.create_query()).fetchall()

        # we only need the id's from those records since we want to match these id's
        # to the ids in the imputed records table
        record_ids = [str(record['id']) for record in records]

        # collect the imputed records
        results = db.query(("SELECT imputed from "+db.dataset+"_records_imputed where record_id in ("+(",".join(record_ids))+")",())).fetchall()

        categories_set = frozenset(self.list_of_categories)

        # since we now have the imputed records, we need to find all the categories that were imputed
        # these are stored in the 'imputed' column
        # However, since we may only be interested in a number of categories on the view, we have to take the intersection
        # between these two sets of categories.
        # Hence we create a list of sets of categories of which we know they are imputed for each record
        imputation_sets = [frozenset(json.loads(record['imputed'])) & categories_set for record in results]

        # we sort and count the occurences of each imputation set.
        # all these resistance patterns in this list are one resistance pattern after imputation.
        countered = Counter(imputation_sets).most_common()
        result = list(map(lambda x: [list(x[0]), x[1]], countered))

        Cache.create(self.patient_properties, 'before-imputation', result)
        return result

    def sparkline(self, parent_sparkline = None):
        cache_result = Cache.get_where_query(self.patient_properties, 'sparklines')
        if cache_result:
            return cache_result['result']

        records = db.query(self.create_query()).fetchall()
        total_records = len(records)
        temps = ds.temporal()
        for record in records:
            if record[ds.temporal_attribute[0].lower()] != '':
                temps[ds.to_temp(record)] += 1
        if parent_sparkline:
            def convert_expected(x):
                if x < 0:
                    return 0
                return x
            expected = {p: convert_expected(parent_sparkline[p] * total_records) for p in parent_sparkline}
            countered = [(temp, (float(temps[temp]) - expected[temp]) / max([expected[temp], temps[temp]]))
                         if max([expected[temp], temps[temp]]) > 0 else (temp, 0) for temp in temps]
        else:
            countered = [(temp, float(temps[temp]) / total_records) for temp in temps]
        def convert_range(x):
            if x < -1:
                return -1
            if x > 1:
                return 1
            return x
        countered = [(temp[0], convert_range(temp[1])) for temp in countered]
        countered_sorted = sorted(countered, key=lambda x: x[0])

        Cache.create(self.patient_properties, 'sparklines', countered_sorted)
        return countered_sorted

    def elements(self,offset, orderBy):
        records = db.query(self.create_query(100, offset, orderBy)).fetchall()
        return records

    def set_degree(self):
        cache_result = Cache.get_where_query(self.patient_properties, 'statistics')
        if cache_result:
            return cache_result['result']

        records = db.query(self.create_query()).fetchall()

        set_degree = {}
        total_no_records = len(records)

        antb = self.antibiogram('exact')
        # for pattern in antb['antibiogram']:


        Cache.create(self.patient_properties, 'statistics', set_degree)
        return set_degree


class Cache(object):
    table = 'cache'
    caching = True

    @classmethod
    def get_where_query(cls, props, description=''):
        query = (
            " SELECT * FROM "+db.dataset+"_cache join "+db.dataset+"_cache_properties on properties_id = "+
                db.dataset+"_cache_properties.id " +
            " WHERE "+db.dataset+"_cache_properties.properties = %s AND "+db.dataset+"_cache.description = %s ORDER BY "+db.dataset+"_cache.id DESC",
            (json.dumps(props), description)
        )
        res = db.query(query).fetchone()
        if res:
            res["result"] = json.loads(res["result"])
        return res

    @classmethod
    def get_where_id(cls, idx):
        query = (
            "SELECT * FROM "+db.dataset+"_cache join "+db.dataset+"_cache_properties on properties_id = "+db.dataset+"_cache_properties.id " +
            " WHERE "+db.dataset+"_cache_properties.id = %s ",
            (idx,)
        )
        res = db.query(query).fetchone()
        if res:
            res["result"] = json.loads(res["result"])
        return res

    @classmethod
    def create(cls, properties, description, data, query=''):
        if cls.caching:
            query = (
                " SELECT * FROM "+db.dataset+"_cache_properties WHERE properties = %s",
                (json.dumps(properties),)
            )
            properties_id = db.query(query).fetchone()
            if not properties_id:
                insert_query_to_cache = ("INSERT INTO "+db.dataset+"_cache_properties (properties) VALUES (%s) returning id", [(json.dumps(properties),)])
                properties_id = db.insert(insert_query_to_cache)
            else:
                properties_id = properties_id['id']

            insert_query_to_cache = (
            "INSERT INTO "+db.dataset+"_cache (date, query, description, properties_id, result) VALUES (%s, %s, %s, %s, %s) returning id", [
                (datetime.datetime.now().strftime("%Y-%m-%d"), json.dumps(query), description, int(properties_id), json.dumps(data))
            ])
            insert_id = db.insert(insert_query_to_cache)
            return insert_id

    @staticmethod
    def data_from_resistance_pattern(cache_id, pattern_index, chart_type='cartographic'):
        cache = Cache.get_where_id(cache_id)
        pattern = cache["result"]["antibiogram"][pattern_index - 1]
        patients = Elements.from_patient_properties(json.loads(cache["properties"])) \
            .where_exact_resistant_pattern(resistant=pattern[1], measured_not_resistant=pattern[2])

        if chart_type == 'cartographic':
            return patients.cartography()
        if chart_type == 'statistics':
            return patients.statistics()
        if chart_type == 'imputation':
            return patients.before_imputation()

    @staticmethod
    def data_for_specific_key_value(cache_id, key_values):
        cache = Cache.get_where_id(cache_id)

        # dit zijn alle patienten voor die resistentie patronen
        patients = Elements(key_values)
        description = "specific_filter"
        cache_result = Cache.get_where_query(key_values, description)
        if cache_result:
            cache_result['result']['cache_id'] = cache_result['id']
            return cache_result['result']
        # we moeten uitzoeken welke patienten die specifieke combi hebben voor key en value
        antibiogram = cache["result"]["antibiogram"]

        query = patients.create_query()
        records = db.query(query).fetchall()

        set_antibiogram = [[set(x[1]), set(x[2])] for x in antibiogram]
        list_of_indices = []
        for record in records:
            pattern = ItemSet.compute_pattern(record, patients.list_of_categories)
            set_resistant_to_categories = set(pattern["resistant"])
            set_measured_not_resistant = set(pattern["not_resistant"])
            for idx, row in enumerate(set_antibiogram):
                if row[0] == set_resistant_to_categories and row[1] == set_measured_not_resistant:
                    list_of_indices.append(idx)
                    break

        counter = Counter(list_of_indices).most_common()
        result = {'counter': counter, 'statistics': patients.statistics(records)}
        cache_id2 = Cache.create(key_values, description, result)
        result['cache_id'] = cache_id2
        return result

    @staticmethod
    def data_for_resistance_patterns(patients, patterns, met='before-imputation', objecttype=None, info=None):
        patient_properties = patients.patient_properties
        description = met + '-' + objecttype + '-' + ",".join(patterns)
        cache_result = Cache.get_where_query(patient_properties, description)

        patient_properties = copy.deepcopy(patient_properties)
        if cache_result:
            return cache_result['result']
        result = {}

        if objecttype == 'ExactPatterns':
            antibiogram = patients.antibiogram('exact')
        elif objecttype == "ImputationBox":
            antibiogram = patients.antibiogram('exact')
            exact_pattern = antibiogram["antibiogram"][int(info) - 1]
            patients.where_exact_resistant_pattern(resistant=exact_pattern[1], measured_not_resistant=exact_pattern[2])
            imputed = patients.before_imputation()
            antibiogram = {"antibiogram": [(exact_pattern[1], list(set(exact_pattern[2]) - set(i[0])), i[0]) for i in imputed]}
        else:
            antibiogram = patients.antibiogram('relative')

        if met != "before-imputation":
            sparkline = {i[0]: float(i[1]) for i in patients.sparkline()}
        original_pattern_contains = get_from_filter(patients.filters, 'pattern_contains')
        for pattern_index in patterns:
            copied_patient = copy.deepcopy(patients)
            if int(pattern_index) - 1 > len(antibiogram["antibiogram"]) - 1:
                pass
            pattern = antibiogram["antibiogram"][int(pattern_index) - 1]
            if objecttype == 'ExactPatterns':
                copied_patient.where_exact_resistant_pattern(resistant=pattern[1], measured_not_resistant=pattern[2])
            elif objecttype == "ImputationBox":
                # Hier ervoor zorgen dat voor imputationbox de juiste query wordt gegenereerd
                copied_patient.where_exact_resistant_pattern(resistant=pattern[0], measured_not_resistant=pattern[1], imputed=pattern[2])
            else:
                copied_patient.delete_exact_resistant_pattern()
                new_pattern_contains = original_pattern_contains[:]
                for i in pattern[1]:
                    if i not in original_pattern_contains:
                        new_pattern_contains.append(i)
                for fidx, f in enumerate(copied_patient.filters):
                    if f[0] == "pattern_contains":
                        copied_patient.filters[fidx] = ("pattern_contains", new_pattern_contains)
                copied_patient.set_patient_properties()

            if met == 'before-imputation':
                result[int(pattern_index)] = copied_patient.before_imputation()
            else:
                result[int(pattern_index)] = copied_patient.sparkline(sparkline)
        to_be_returned = [(i, result[i]) for i in result]
        Cache.create(patient_properties, description, to_be_returned)
        return to_be_returned


class Item(object):
    def __init__(self, without=None, classifications=False):
        self.without = without
        self.classifications = classifications

        if self.classifications:
            query = ("SELECT * FROM "+db.dataset+"_sets WHERE classificatie != '' ", ())
        else:
            if self.without is None:
                # als er niet is gespecificeerd welk categorya weg gelaten moeten worden, dan moeten alleen de default
                # visible gebruikt worden
                query = ("SELECT * FROM "+db.dataset+"_sets WHERE visible = 1 ", ())
            elif len(self.without) > 0:
                # er zijn bepaalde categorya weggelaten
                without_s = "(" + ",".join(["%s"]*len(self.without)) + ")"
                query = ("SELECT * FROM "+db.dataset+"_sets WHERE category NOT IN " + without_s, (*self.without,))
            else:
                query = ("SELECT * FROM "+db.dataset+"_sets", ())
        self.categories = db.query(query).fetchall()

    @staticmethod
    def all(classifications=False):
        if classifications:
            query = ("SELECT DISTINCT classificatie FROM "+db.dataset+"_sets WHERE classificatie != ''", ())
            return [{'category': i['classificatie']} for i in db.query(query).fetchall()]
        query = ("SELECT * FROM "+db.dataset+"_sets ", ())
        return db.query(query).fetchall()

    def list(self):
        if self.classifications:
            return self.classificaties().keys()
        return [i["category"] for i in self.categories]

    def as_columns(self, table='records_imputed'):
        if table:
            return db.dataset + "_" + table + "." + (config['db_postfix'] + ", "+db.dataset + "_"+table+".").join([i["category"] for i in self.categories]) + config['db_postfix']
        return (config['db_postfix'] + ", ").join([i["category"] for i in self.categories]) + config['db_postfix']

    def classificaties(self):
        x = {}
        for i in self.categories:
            if i['classificatie'] in x:
                x[i['classificatie']].append(i['category'])
            else:
                x[i['classificatie']] = [i['category']]
        return x

    def list_complement(self):
        return list(set([i['category'] for i in Item.all()]) - set(self.list()))

    def intersect_record(self, record):
        return set(self.list()) & set([i.replace(config['db_postfix'], '') for i in record.keys()])


class ItemSet(object):
    def __init__(self, patients):
        self.antibiogram = {'antibiogram': [], 'no_records': 0}
        self.relative_occurrences = {'antibiogram': [], 'no_records': 0}
        self.patients = patients
        self.antibiolist = []
        self.combined_antibiogram = []
        self.panels = []
        self.effectiveness = {'antibiogram': [], 'no_records': 0}
        self.get_antibiogram()

    @staticmethod
    def sort_and_clean_antibiogram(antibiogram):
        if len(antibiogram) and 'measured_not_resistant' in antibiogram[0]:
            unsorted_dist = [[i['c'] * 100, list(i['categories']), list(i['measured_not_resistant']), i['absolute']] for i
                                         in antibiogram]
            dist = sorted(unsorted_dist, key=lambda x: x[0], reverse=True)
            antibiogram = [("{0:.5f}".format(i[0]), i[1], i[2], i[3]) for i in dist]
        else:
            unsorted_dist = [[i['c'] * 100, list(i['categories']), i['absolute']] for i in antibiogram]
            dist = sorted(unsorted_dist, key=lambda x: x[0], reverse=True)
            antibiogram = [("{0:.5f}".format(i[0]), i[1], i[2]) for i in dist]
        return antibiogram


    @staticmethod
    def compute_pattern(record, antbs, raw=False):
        resistant_to_categories = []
        measured_not_resistant = []
        for category in antbs:
            column_value = record[category.lower() + config['db_postfix']]
            if column_value == 1:
                resistant_to_categories.append(category)
            elif column_value == 0:
                measured_not_resistant.append(category)
        return {'resistant': resistant_to_categories, 'not_resistant': measured_not_resistant}


    # this runs the query from cache or calculates if no cache exists
    def get_antibiogram(self):
        cached_result = Cache.get_where_query(self.patients.patient_properties, 'antibiogram')

        if cached_result:
            self.antibiogram = cached_result['result']
            cache_id = cached_result["id"]
        else:
            result = db.query(self.patients.create_query()).fetchall()

            # Cache.create(self.patients.patient_properties, 'record_ids', [i["id"] for i in result])

            antibiogram = list()
            no_records = len(result)

            for i, record in enumerate(result):
                resistant_to_categories = []
                measured_not_resistant = []
                for column_name, value in record.items():
                    category = column_name.replace(config['db_postfix'], '')
                    if category in self.patients.categories.lower():
                        if value == 1:
                            resistant_to_categories.append(category)
                        elif value == 0:
                            measured_not_resistant.append(category)

                if self.patients.classifications:
                    set_of_categories = set([])
                    set_measured_not_resistant = set([])
                    antibiolist_part = []

                    for classif, antbs in self.patients.dict_of_classifications.items():
                        if len(set(antbs) & set(resistant_to_categories)):
                            # van de categorya die bij deze classificatie horen, is er tenminste 1 resistent
                            set_of_categories.add(classif)
                            antibiolist_part.append(classif)
                        elif len(set(antbs) & set(measured_not_resistant)):
                            # alle categorya die bij deze classificatie horen zijn niet resistent,
                            # maar er is er tenminste 1 gemeten (en niet resistent)
                            set_measured_not_resistant.add(classif)
                    self.antibiolist.append(antibiolist_part)
                else:
                    set_of_categories = set(resistant_to_categories)
                    set_measured_not_resistant = set(measured_not_resistant)
                    self.antibiolist.append(resistant_to_categories)

                if len(antibiogram) >= 1:
                    found = False
                    for iterator, biogram in enumerate(antibiogram):
                        if biogram['categories'] == set_of_categories and \
                                        biogram['measured_not_resistant'] == set_measured_not_resistant:
                            antibiogram[iterator]['c'] += 1.0 / no_records
                            antibiogram[iterator]['absolute'] += 1
                            found = True
                            break
                    if not found:
                        antibiogram.append({
                            'categories': set_of_categories,
                            'c': 1.0 / no_records,
                            'measured_not_resistant': set_measured_not_resistant,
                            'absolute': 1,
                        })
                else:
                    antibiogram.append({
                        'categories': set_of_categories,
                        'c': 1.0 / no_records,
                        'measured_not_resistant': set_measured_not_resistant,
                        'absolute': 1
                    })

            antibiogram = self.sort_and_clean_antibiogram(antibiogram)
            self.antibiogram = {'antibiogram': antibiogram, 'no_records': no_records}

            cache_id = Cache.create(self.patients.patient_properties, 'antibiogram', self.antibiogram)
            Cache.create(self.patients.patient_properties, 'antibiolist', self.antibiolist)

        self.antibiogram['cache_id'] = cache_id
        return self.antibiogram

    def get_antibiolist(self):
        cached_result = Cache.get_where_query(self.patients.patient_properties, 'antibiolist')

        if cached_result:
            self.antibiolist = cached_result['result']
        else:
            self.get_antibiogram()
        return self.antibiolist

    def get_relative_occurrences(self, nesting_level=2):
        cached_result = Cache.get_where_query(self.patients.patient_properties,
                                              'relative_occurrences_' + str(nesting_level))

        if cached_result:
            self.relative_occurrences = cached_result['result']
        else:
            set_antibiogram = [set(d[1]) for d in self.antibiogram['antibiogram']]
            resistant = set(get_from_filter(self.patients.filters, 'pattern_contains'))
            antibiogram = []
            antbs = set(self.patients.list_of_categories) - resistant

            for nesting in range(1, nesting_level + 1):
                for x in combinations(antbs, nesting):
                    antibiogram.append({'categories': set(x) | resistant, 'c': 0, 'absolute': 0})

            for dist_idx, dist in enumerate(self.antibiogram['antibiogram']):
                prevalence = float(dist[0])
                pattern = set_antibiogram[dist_idx]
                for x in antibiogram:
                    if x['categories'] <= pattern:
                        x['c'] += prevalence / 100
                        x['absolute'] += dist[3]
            antibiogram.append({'categories': resistant, 'c': 1, 'absolute': self.antibiogram['no_records']})
            antibiogram = [a for a in antibiogram if a['absolute']]
            antibiogram = self.sort_and_clean_antibiogram(antibiogram)
            self.relative_occurrences = {'antibiogram': antibiogram, 'no_records': self.antibiogram['no_records']}
            Cache.create(self.patients.patient_properties,
                     'relative_occurrences_' + str(nesting_level), self.relative_occurrences)
        return self.relative_occurrences
