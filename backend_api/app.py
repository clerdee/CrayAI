from flask import Flask, request, jsonify
from flask_cors import CORS
from config.db import mongo
import os

# 1. Force load .env and override any cached VS Code terminal variables
from dotenv import load_dotenv
load_dotenv(override=True)

# Import Controllers
from controllers.chatbot_controller import chatbot_bp
from controllers.measurement_controller import process_measurement

app = Flask(__name__)

# 2. Enable CORS (Allow React Frontend to talk to Python Backend)
CORS(app)

# 3. Database Config
raw_uri = os.environ.get("MONGO_URI")

# If the URI is missing a database name, PyMongo makes mongo.db = None and crashes.
if raw_uri and raw_uri.endswith(".net/?appName=CrayAI"):
    raw_uri = raw_uri.replace(".net/?", ".net/test?")

app.config["MONGO_URI"] = raw_uri

# 4. Initialize DB
mongo.init_app(app)

# 5. Register Blueprints (Routes)
app.register_blueprint(chatbot_bp, url_prefix='/api/training/chatbot')

@app.route('/api/measure', methods=['POST'])
def measure_object():
    if 'photo' not in request.files:
        return jsonify({"error": "No photo uploaded"}), 400
    
    file = request.files['photo']
    
    try:
        result = process_measurement(file)
        return jsonify(result)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return "CrayAI API (Chatbot + Vision) is Running 🦞"

if __name__ == '__main__':
    # port = int(os.environ.get("PYTHON_PORT", 5001)) Use Railway's port or default to 5001
    # app.run(host='0.0.0.0', debug=True, port=port)
    port = int(os.environ.get("PORT", 7860))
    app.run(host='0.0.0.0', port=port)
    