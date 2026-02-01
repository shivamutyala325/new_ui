import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No API Key found. Please set GEMINI_API_KEY in .env file")

genai.configure(api_key=api_key)
# NEW (Try this)
model = genai.GenerativeModel("gemini-2.5-flash")

def get_gemini_response(history_list, new_message: str):
    """
    history_list: List of dicts [{'role': 'user', 'parts': ['text']}, ...]
    new_message: String
    """
    
    # 1. Prepare the chat history for Gemini
    # The SDK expects the history to be converted to Content objects if using start_chat
    # However, for simple stateless requests, we can just start the chat with the history list directly
    # provided it matches the [{'role': '...', 'parts': ['...']}] format.
    
    formatted_history = []
    
    for msg in history_list:
        # Validate roles to ensure they match Gemini requirements
        role = "user" if msg["role"] == "user" else "model"
        formatted_history.append({
            "role": role,
            "parts": [msg["content"]]
        })

    # 2. Initialize chat with history
    chat = model.start_chat(history=formatted_history)

    # 3. Send new message
    response = chat.send_message(new_message)

    return response.text