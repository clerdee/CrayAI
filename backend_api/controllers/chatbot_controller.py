from flask import Blueprint, request, jsonify
from config.db import mongo
from bson.objectid import ObjectId
from datetime import datetime
from services.ai_engine import find_best_match 
from better_profanity import profanity

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

        # 🚨 1. SAFETY CHECK
        if profanity.contains_profanity(user_query):
            mongo.db[LOGS_COLLECTION].insert_one({
                "query": user_query,
                "status": "Flagged",
                "reason": "Offensive Content",
                "timestamp": datetime.utcnow()
            })
            return jsonify({
                "response": "I cannot answer that. Please be respectful.",
                "topic": "System",
                "confidence": "Low",
                "is_flagged": True
            }), 200

        # 🔍 2. AI MATCHING
        cursor = mongo.db[COLLECTION].find({"status": "Approved"})
        approved_data = list(cursor)

        match = find_best_match(user_query, approved_data)

        # ❌ 3. FAILED QUERY
        if not match:
            mongo.db[LOGS_COLLECTION].insert_one({
                "query": user_query,
                "status": "Failed",
                "reason": "Low Confidence / Unknown",
                "timestamp": datetime.utcnow()
            })
            return jsonify({
                "response": "I'm sorry, I don't have information on that yet.",
                "topic": "System",
                "confidence": "Low"
            }), 200

        # ✅ 4. SUCCESS QUERY
        match_id_str = str(match['_id']) 

        mongo.db[LOGS_COLLECTION].insert_one({
            "query": user_query,
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
        print(f"🔥 AI Error: {e}") 
        return jsonify({"error": str(e)}), 500

# =========================================================
# 6. GET STATS (Admin Dashboard)
# =========================================================
@chatbot_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        total_logs = mongo.db[LOGS_COLLECTION].count_documents({})
        success_logs = mongo.db[LOGS_COLLECTION].count_documents({"status": "Success"})
        failed_logs = mongo.db[LOGS_COLLECTION].count_documents({"status": "Failed"})
        flagged_logs = mongo.db[LOGS_COLLECTION].count_documents({"status": "Flagged"})

        accuracy = 0
        if total_logs > 0:
            accuracy = round((success_logs / total_logs) * 100)

        return jsonify({
            "total_interactions": total_logs,
            "accuracy": accuracy,
            "failed_count": failed_logs,
            "flagged_count": flagged_logs
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