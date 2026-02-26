from sentence_transformers import SentenceTransformer, util
import numpy as np

# --- LAZY LOADING SETUP ---
model = None

def get_model():
    """Loads the model only when needed to save RAM at startup."""
    global model
    if model is None:
        print("⏳ Loading AI Model... (First run only)")
        # 'all-MiniLM-L6-v2' is fast and accurate for chatbots
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ AI Model Loaded!")
    return model

def find_best_match(user_query, db_records):
    """
    1. user_query: The question asked by the user (e.g., "My crayfish is sick")
    2. db_records: All your 'Approved' Q&A pairs from MongoDB
    """
    
    # 1. Load the model now (if not already loaded)
    ai_model = get_model()

    # 2. Prepare the data
    # We only need the 'questions' to compare against
    stored_questions = [item['query'] for item in db_records]
    
    if not stored_questions:
        return None

    # 3. Convert text to numbers (Embeddings)
    # Convert database questions to vectors
    db_embeddings = ai_model.encode(stored_questions, convert_to_tensor=True)
    
    # Convert user query to vector
    user_embedding = ai_model.encode(user_query, convert_to_tensor=True)
    
    # 4. Math Magic (Cosine Similarity)
    # Compare user query vector vs. all database vectors
    scores = util.cos_sim(user_embedding, db_embeddings)[0]
    
    # 5. Find the winner
    # Get the index of the highest score
    best_score_index = np.argmax(scores.cpu().numpy())
    best_score = scores[best_score_index].item()
    
    # Print the score in the terminal so you can monitor how confident the AI is
    print(f"🧠 Local AI Match Score: {best_score:.2f} for query: '{user_query}'")
    
    # 6. Threshold Check (Confidence Score)
    # If it's not at least an 85% match, fallback to Gemini!
    if best_score < 0.85:
        print("⚠️ Match too low, falling back to Gemini...")
        return None  # "I don't know"
    
    # Return the full matching record
    return db_records[best_score_index]