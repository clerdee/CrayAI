from flask_pymongo import PyMongo
from flask import current_app, g

mongo = PyMongo()

def get_db():
    if 'db' not in g:
        g.db = mongo.db
    return g.db