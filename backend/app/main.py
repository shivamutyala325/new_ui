from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.services import get_gemini_response

app = FastAPI()

# --- CORS: Allow Frontend to Connect ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class Message(BaseModel):
    role: str 
    content: str

class ChatRequest(BaseModel):
    history: List[Message]
    message: str

@app.get("/")
def read_root():
    return {"status": "Backend is running"}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    try:
        response_text = get_gemini_response(
            [msg.dict() for msg in request.history], 
            request.message
        )
        return {"response": response_text}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))