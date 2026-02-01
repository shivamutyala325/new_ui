import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No API Key found. Please set GEMINI_API_KEY in .env file")

genai.configure(api_key=api_key)

# Use the model version that worked for you (e.g., gemini-1.5-flash or gemini-2.0-flash)
model = genai.GenerativeModel("gemini-2.5-flash") 

def get_gemini_response(history_list, new_message: str):
    formatted_history = []
    
    for msg in history_list:
        role = "user" if msg["role"] == "user" else "model"
        formatted_history.append({
            "role": role,
            "parts": [msg["content"]]
        })

    chat = model.start_chat(history=formatted_history)
    response = chat.send_message(new_message)
    
    return response.text