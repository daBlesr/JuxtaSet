from master.constants import *
import psycopg2
import psycopg2.extras

class DB(object):
    
    def __init__(self):
        self.db = None
        self.establish_connection()
        self.dataset = None

    def establish_connection(self):
        self.db = psycopg2.connect(host="localhost",
                                   user=config['db_username'],
                                   password=config['db_password'],
                                   dbname=config['db_table'])
        self.db.autocommit = True

    def query(self, q):
        try:
            cur = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(q[0], q[1])
        except psycopg2.OperationalError as e:
            self.establish_connection()
            cur = self.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(q[0], q[1])
        except psycopg2.ProgrammingError as e:
            print(e)
        return cur

    @staticmethod
    def create_chunk(data, setsize):
        for i in range(0, len(data), setsize):
            yield data[i: i + setsize]

    def insert(self, q):
        if len(q[1]) > 1:
            x = 1
            for subset in self.create_chunk(q[1], 10000):
                self.insert_records((q[0], subset))
                print("inserted chunk ", x)
                x += 1
        else:
            try:
                cur = self.db.cursor()
                cur.execute(q[0], q[1][0])
                self.db.commit()
            except psycopg2.OperationalError as e:
                print('error', e)
                self.establish_connection()
                cur = self.db.cursor()
                cur.execute(q[0], q[1][0])
                self.db.commit()
            try:
                lastinsert = cur.fetchone()
                return lastinsert[0]
            except psycopg2.ProgrammingError as e:
                print(e)

    def insert_records(self, q):
        try:
            cur = self.db.cursor()
            cur.executemany(q[0], q[1])
            self.db.commit()
            return cur.lastrowid
        except psycopg2.OperationalError as e:
            self.establish_connection()
            cur = self.db.cursor()
            cur.executemany(q[0], q[1])
            self.db.commit()
            return cur.lastrowid
        except Exception as e:
            print(e)

    def delete(self, q):
        try:
            cur = self.db.cursor()
            cur.execute(q)
            self.db.commit()
        except psycopg2.OperationalError:
            self.establish_connection()
            cur = self.db.cursor()
            cur.execute(q)
            self.db.commit()

    def update(self, q):
        try:
            cur = self.db.cursor()
            cur.execute(q)
            self.db.commit()
        except psycopg2.OperationalError:
            print("FAILED")

    def set_dataset(self, ds):
        self.dataset = ds