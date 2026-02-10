from flask import Flask, request, jsonify
from flask_cors import CORS
from config.db import mongo
import os

# Import Controllers
from controllers.chatbot_controller import chatbot_bp
from controllers.measurement_controller import process_measurement

app = Flask(__name__)

# 1. Enable CORS (Allow React Frontend to talk to Python Backend)
CORS(app)

# 2. Database Config (Replace with your actual Connection String)                                      
app.config["MONGO_URI"] ="mongodb+srv://clerdeecruz_db_user:0cL6e3Daa2ZsYypT@crayai.hc7kwql.mongodb.net/crayai_db?appName=CrayAI"

# 3. Initialize DB
mongo.init_app(app)

# 4. Register Blueprints (Routes)
app.register_blueprint(chatbot_bp, url_prefix='/api/training/chatbot')

@app.route('/api/measure', methods=['POST'])
def measure_object():
    if 'photo' not in request.files:
        return jsonify({"error": "No photo uploaded"}), 400
    
    file = request.files['photo']
    
    try:
        # Pass the photo to the Vision Brain
        result = process_measurement(file)
        return jsonify(result)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return "CrayAI API (Chatbot + Vision) is Running 🦞"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)