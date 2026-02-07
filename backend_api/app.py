from flask import Flask
from flask_cors import CORS
from config.db import mongo
import os

# Import Controllers
from controllers.chatbot_controller import chatbot_bp

app = Flask(__name__)

# 1. Enable CORS (Allow React Frontend to talk to Python Backend)
CORS(app)

# 2. Database Config (Replace with your actual Connection String)                                      
app.config["MONGO_URI"] ="mongodb+srv://clerdeecruz_db_user:0cL6e3Daa2ZsYypT@crayai.hc7kwql.mongodb.net/crayai_db?appName=CrayAI"

# 3. Initialize DB
mongo.init_app(app)

# 4. Register Blueprints (Routes)
app.register_blueprint(chatbot_bp, url_prefix='/api/training/chatbot')

@app.route('/')
def home():
    return "CrayAI API is Running 🦞"

if __name__ == '__main__':
    app.run(debug=True, port=5001)