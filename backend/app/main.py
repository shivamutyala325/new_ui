from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.services import get_gemini_response
import os

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve Static Files (CSS/JS) ---
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# --- Routes ---

# 1. Serve the HTML Interface at root URL
@app.get("/")
async def read_root():
    return FileResponse('app/static/index.html')

class Message(BaseModel):
    role: str 
    content: str

class ChatRequest(BaseModel):
    history: List[Message]
    message: str

# 2. The Chat API
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