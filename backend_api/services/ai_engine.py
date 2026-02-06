from sentence_transformers import SentenceTransformer, util
import numpy as np

# Load a lightweight, high-speed model (runs offline!)
# 'all-MiniLM-L6-v2' is fast and accurate for chatbots
print("⏳ Loading AI Model... (This happens only once)")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ AI Model Loaded!")

def find_best_match(user_query, db_records):
    """
    1. user_query: The question asked by the user (e.g., "My crayfish is sick")
    2. db_records: All your 'Approved' Q&A pairs from MongoDB
    """
    
    # 1. Prepare the data
    # We only need the 'questions' to compare against
    stored_questions = [item['query'] for item in db_records]
    
    # 2. Convert text to numbers (Embeddings)
    # Convert database questions to vectors
    db_embeddings = model.encode(stored_questions, convert_to_tensor=True)
    
    # Convert user query to vector
    user_embedding = model.encode(user_query, convert_to_tensor=True)
    
    # 3. Math Magic (Cosine Similarity)
    # Compare user query vector vs. all database vectors
    scores = util.cos_sim(user_embedding, db_embeddings)[0]
    
    # 4. Find the winner
    # Get the index of the highest score
    best_score_index = np.argmax(scores.cpu().numpy())
    best_score = scores[best_score_index].item()
    
    # 5. Threshold Check (Confidence Score)
    # If similarity is too low (< 0.5), it means the bot is confused.
    if best_score < 0.5:
        return None  # "I don't know"
    
    # Return the full matching record
    return db_records[best_score_index]