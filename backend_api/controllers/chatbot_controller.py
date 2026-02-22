from flask import Blueprint, request, jsonify
from config.db import mongo
from bson.objectid import ObjectId
from datetime import datetime
from services.ai_engine import find_best_match 
from better_profanity import profanity
import os
from google import genai
from dotenv import load_dotenv

# Load environment variables and initialize Gemini
load_dotenv()
gemini_client = genai.Client()

chatbot_bp = Blueprint('chatbot_bp', __name__)

# COLLECTION NAMES
COLLECTION = 'chatbot_knowledge'
LOGS_COLLECTION = 'chatbot_logs'

# =========================================================
# 1. READ (GET) - Fetch all Q&A pairs
# =========================================================
@chatbot_bp.route('/', methods=['GET'], strict_slashes=False)
def get_qa_pairs():
    try:
        cursor = mongo.db[COLLECTION].find().sort('_id', -1)
        results = []
        for doc in cursor:
            results.append({
                '_id': str(doc['_id']),
                'query': doc.get('query'),
                'response': doc.get('response'),
                'topic': doc.get('topic'),
                'status': doc.get('status'),
                'created_at': doc.get('created_at')
            })
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 2. CREATE (POST) - Add a new pair
# =========================================================
@chatbot_bp.route('/', methods=['POST'], strict_slashes=False)
def add_qa_pair():
    try:
        data = request.json
        if not data.get('query') or not data.get('response'):
            return jsonify({"error": "Query and Response are required"}), 400

        new_entry = {
            "query": data['query'],
            "response": data['response'],
            "topic": data.get('topic', 'General'),
            "status": data.get('status', 'Approved'),
            "created_at": datetime.utcnow()
        }

        result = mongo.db[COLLECTION].insert_one(new_entry)
        new_entry['_id'] = str(result.inserted_id)
        
        return jsonify(new_entry), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 3. UPDATE (PUT) - Edit an existing pair
# =========================================================
@chatbot_bp.route('/<id>', methods=['PUT'])
def update_qa_pair(id):
    try:
        data = request.json
        update_fields = {
            "query": data['query'],
            "response": data['response'],
            "topic": data['topic'],
            "status": data['status'],
            "updated_at": datetime.utcnow()
        }
        mongo.db[COLLECTION].update_one(
            {'_id': ObjectId(id)},
            {'$set': update_fields}
        )
        update_fields['_id'] = id
        return jsonify(update_fields), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 4. DELETE (DELETE) - Remove a pair
# =========================================================
@chatbot_bp.route('/<id>', methods=['DELETE'])
def delete_qa_pair(id):
    try:
        result = mongo.db[COLLECTION].delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Item not found"}), 404
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# =========================================================
# 5. ASK (AI SEARCH) - The "Chat" Endpoint
# =========================================================
@chatbot_bp.route('/ask', methods=['POST'])
def ask_chatbot():
    try:
        user_query = request.json.get('question')
        if not user_query:
            return jsonify({"error": "No question provided"}), 400

        # 🚨 1. SAFETY CHECK (Profanity)
        if profanity.contains_profanity(user_query):
            response_text = "I cannot answer that. Please be respectful."
            mongo.db[LOGS_COLLECTION].insert_one({
                "query": user_query,
                "response": response_text,
                "status": "Flagged",
                "reason": "Offensive Content",
                "timestamp": datetime.utcnow()
            })
            return jsonify({
                "response": response_text,
                "topic": "System",
                "confidence": "Low",
                "is_flagged": True
            }), 200

        # 🔍 2. AI MATCHING
        cursor = mongo.db[COLLECTION].find({"status": "Approved"})
        approved_data = list(cursor)

        # 🚨 NEW FIX: Only attempt local search if there is actually data!
        match = None
        if len(approved_data) > 0:
            try:
                match = find_best_match(user_query, approved_data)
            except Exception as e:
                print(f"Local AI Match Error: {e}")
                match = None

        # ❌ 3. FAILED LOCAL QUERY -> FALLBACK TO GEMINI
        if not match:
            print("Local DB missed or empty. Asking Gemini...")
            try:
                # Ask Gemini 2.5 Flash
                gemini_response = gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"You are CrayAI, an expert assistant for Australian Red Claw crayfish. Answer this question concisely: {user_query}"
                )
                
                # Log the Gemini interaction
                mongo.db[LOGS_COLLECTION].insert_one({
                    "query": user_query,
                    "response": gemini_response.text,
                    "status": "Success (Gemini)",
                    "reason": "Answered via Gemini API",
                    "timestamp": datetime.utcnow()
                })

                return jsonify({
                    "response": gemini_response.text,
                    "topic": "Gemini AI",
                    "confidence": "High"
                }), 200

            except Exception as gemini_err:
                print(f"Gemini Error: {gemini_err}")
                
                # Log the failed interaction if Gemini also fails
                fail_response = "I'm sorry, my local database doesn't know this, and I couldn't reach my cloud brain right now."
                mongo.db[LOGS_COLLECTION].insert_one({
                    "query": user_query,
                    "response": fail_response,
                    "status": "Failed",
                    "reason": f"Local DB Miss & Gemini Error: {str(gemini_err)}",
                    "timestamp": datetime.utcnow()
                })
                
                return jsonify({
                    "response": fail_response,
                    "topic": "System",
                    "confidence": "Low"
                }), 200

        # ✅ 4. SUCCESS QUERY (Local Match)
        match_id_str = str(match['_id']) 

        mongo.db[LOGS_COLLECTION].insert_one({
            "query": user_query,
            "response": match['response'],
            "status": "Success",
            "match_id": match_id_str, 
            "timestamp": datetime.utcnow()
        })

        return jsonify({
            "response": match['response'],
            "topic": match.get('topic'),
            "confidence": "High"
        }), 200

    except Exception as e:
        print(f"🔥 Critical AI Error: {e}") 
        return jsonify({"error": "Internal Server Error"}), 500

# =========================================================
# 6. GET STATS (Admin Dashboard)
# =========================================================
@chatbot_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        total_logs = mongo.db[LOGS_COLLECTION].count_documents({})
        success_logs = mongo.db[LOGS_COLLECTION].count_documents({"status": "Success"})
        success_gemini_logs = mongo.db[LOGS_COLLECTION].count_documents({"status": "Success (Gemini)"})
        failed_logs = mongo.db[LOGS_COLLECTION].count_documents({"status": "Failed"})
        flagged_logs = mongo.db[LOGS_COLLECTION].count_documents({"status": "Flagged"})

        # Combine both local success and Gemini success for accuracy calculation
        total_success = success_logs + success_gemini_logs
        
        accuracy = 0
        if total_logs > 0:
            accuracy = round((total_success / total_logs) * 100)

        return jsonify({
            "total_interactions": total_logs,
            "accuracy": accuracy,
            "failed_count": failed_logs,
            "flagged_count": flagged_logs,
            "gemini_fallback_count": success_gemini_logs # Added this to track how often Gemini is used
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 7. GET LOGS (Admin Logs)
# =========================================================
@chatbot_bp.route('/logs', methods=['GET'])
def get_logs():
    try:
        filter_status = request.args.get('status')
        query = {}
        if filter_status:
            query['status'] = filter_status
            
        logs = list(mongo.db[LOGS_COLLECTION].find(query).sort('timestamp', -1).limit(100))
        
        for log in logs:
            log['_id'] = str(log['_id'])
            
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================================================
# 8. DELETE LOG
# =========================================================
@chatbot_bp.route('/logs/<id>', methods=['DELETE'])
def delete_log(id):
    try:
        mongo.db[LOGS_COLLECTION].delete_one({'_id': ObjectId(id)})
        return jsonify({"message": "Log deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500