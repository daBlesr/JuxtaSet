# GLOBAL IMPORTS

from flask import Flask, request, g
import datetime
import json
import os.path

ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = ROOT + "/uploads/"
ALLOWED_EXTENSIONS = {'txt', 'csv'}

# configs

config = {
    'environment': 'debug',
    'db_postfix': '_category',
}

if os.path.isfile(os.path.dirname(os.path.realpath(__file__)) + '/../.env'):
    with open(os.path.dirname(os.path.realpath(__file__)) + '/../.env','r') as f:
        for x in f.readlines():
            y = x.split('=')
            config[y[0]] = y[1].strip()
        del x, y
        
if config['environment'] == 'debug':
    import pdb
    debug = pdb.set_trace

# APP IMPORTS

from master.controllers.db import *
from master.controllers.dataset import DataSet

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = DB()
ds = DataSet()


@app.url_defaults
def add_dataset(endpoint, values):
    if 'dataset' in values or not g.dataset:
        return
    if app.url_map.is_endpoint_expecting(endpoint, 'dataset'):
        values['dataset'] = g.dataset


@app.url_value_preprocessor
def pull_dataset(endpoint, values):
    g.dataset = None
    if values:
        g.dataset = values.pop('dataset', None)
        if g.dataset:
            db.set_dataset(g.dataset)
            ds.load(db, g.dataset, request.remote_addr)

