import json


class DataSet():

    def __init__(self):
        self.name = ""
        self.dataset = None
        self.attrbs = {}
        self.db_str = ""
        self.sorted_attrbs = []
        self.classifications = {}
        self.ipaddress = ""

    def load(self, db, name, ipaddress):
        self.name = name
        self.ipaddress = ipaddress
        self.dataset = db.query(("SELECT * FROM datasets WHERE name=%s and (ipaddress= %s or ipaddress='')", (name, ipaddress))).fetchone()
        if not self.dataset:
            print('LOADING DATASET', ipaddress, name)
            raise Exception("cannot access this dataset.")
        self.attrbs = json.loads(self.dataset['attributes'])
        self.sorted_attrbs = json.loads(self.dataset['sort'])
        non_info_str = " "
        if len(json.loads(self.dataset['non_info_attrbs'])):
            non_info_str = ", " + ", ".join(json.loads(self.dataset['non_info_attrbs']))
        self.db_str = ", ".join(self.attrbs.keys()) + non_info_str
        self.classifications = {}
        for a in self.attrbs:
            if self.attrbs[a] != "exact":
                self.classifications[a] = []
                for x in self.attrbs[a]:
                    if str(x[0]) == str(x[1]):
                        self.classifications[a].append(str(x[0]))
                    else:
                        self.classifications[a].append(str(x[0]) + "-" + str(x[1]))
        self.temporal_attribute = json.loads(self.dataset['temp_attr'])


    def from_query_to_chart(self, attr, value):
        p = self.attrbs[attr]
        if p == 'exact':
            return value
        else:
            for i in p:
                if i[0] == i[1] and i[0] == int(round(float(value))):
                    return str(i[0])
                if i[0] <= float(value) <= i[1]:
                    return str(i[0])+"-"+str(i[1])
                if i[0] <= int(round(float(value))) <= i[1]:
                    return str(i[0])+"-"+str(i[1])

    def from_chart_to_query(self, attr, value):
        p = self.attrbs[attr]
        if p == 'exact':
            return attr + " = " + value
        else:
            if "-" in value:
                f = value.split("-")
                for i in p:
                    if f[0] == str(i[0]) and f[1] == str(i[1]):
                        return "( " + attr + " >= " + str(i[0]) + " AND " + attr + " <= " + str(i[1]) + ")"
            else:
                for i in p:
                    if str(value) == str(i[0]):
                        return attr + " = " + str(i[0])

    def temporal(self):
        return {str(a): 0 for a in self.temporal_attribute[1]}

    def to_temp(self, record):
        return str(record[self.temporal_attribute[0].lower()])

    def all(self, db):
        print("ALL: ", self.ipaddress)
        databases = db.query(("SELECT name from datasets where ipaddress = %s or ipaddress = '' ", (self.ipaddress,))).fetchall()
        return [[a['name'], (self.name == a['name'])] for a in databases]