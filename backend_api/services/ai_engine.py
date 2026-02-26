import numpy as np

model = None

def get_model():
    """Loads the model only when needed to save RAM at startup."""
    global model
    if model is None:
        print("⏳ Loading AI Model... (First run only)")
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ AI Model Loaded!")
    return model

def find_best_match(user_query, db_records):
    """
    Finds the best matching Q&A pair from the database.
    """
    from sentence_transformers import util
    
    # 1. Load the model now (if not already loaded)
    ai_model = get_model()

    # 2. Prepare the data
    stored_questions = [item['query'] for item in db_records]
    
    if not stored_questions:
        return None

    # 3. Convert text to numbers (Embeddings)
    db_embeddings = ai_model.encode(stored_questions, convert_to_tensor=True)
    user_embedding = ai_model.encode(user_query, convert_to_tensor=True)
    
    # 4. Compare
    scores = util.cos_sim(user_embedding, db_embeddings)[0]
    
    # 5. Find the winner
    best_score_index = np.argmax(scores.cpu().numpy())
    best_score = scores[best_score_index].item()
    
    print(f"🧠 Local AI Match Score: {best_score:.2f} for query: '{user_query}'")
    
    # 6. Threshold Check
    if best_score < 0.85:
        print("⚠️ Match too low, falling back to Gemini...")
        return None 
    
    return db_records[best_score_index]