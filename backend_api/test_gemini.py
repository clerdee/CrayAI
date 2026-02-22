import os
from google import genai
from dotenv import load_dotenv

# 1. Load the environment variables from your .env file
load_dotenv()

# 2. Initialize the client 
# (The new SDK automatically looks for the GEMINI_API_KEY environment variable!)
client = genai.Client()

# 3. Test it out!
print("Sending request to Gemini...")
prompt = "Give me a one-sentence fun fact about Australian Red Claw crayfish."

# 4. Use the new syntax to generate content
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt
)

print("\nResponse from Gemini:")
print(response.text)