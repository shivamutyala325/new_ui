from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app.services import get_gemini_response

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development only)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
# --- Data Models (Validation) ---
# This ensures the frontend sends data in the correct format
class Message(BaseModel):
    role: str  # 'user' or 'model'
    content: str

class ChatRequest(BaseModel):
    history: List[Message] # Previous conversation
    message: str           # New question

# --- Routes ---

@app.get("/")
def read_root():
    return {"status": "Backend is running"}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    try:
        # Pass data to our service logic
        # request.history is automatically converted to a list of dicts
        response_text = get_gemini_response(
            [msg.dict() for msg in request.history], 
            request.message
        )
        
        return {"response": response_text}
    
    except Exception as e:
        # If something goes wrong, send a proper error to frontend
        raise HTTPException(status_code=500, detail=str(e))