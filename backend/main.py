import os
import json
import uuid
from datetime import datetime, timedelta
from http.client import responses

import uvicorn
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="webhooks.email API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
MODEL = "google/gemma-4-26b-a4b-it:free"

users_db = {}
api_keys_db = {}

class SignupRequest(BaseModel):
    email: str

class SignupResponse(BaseModel):
    user_id: str
    api_key: str
    message: str

class ChatRequest(BaseModel):
    prompt: str
    user_id: str | None = None

class ChatResponse(BaseModel):
    html: str
    css: str
    js: str

@app.post("/api/signup", response_model=SignupResponse)
async def signup(req: SignupRequest):
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Valid email required")
    user_id = uuid.uuid4().hex[:12]
    api_key = "wek_" + uuid.uuid4().hex[:24]
    users_db[user_id] = {"email": req.email, "created": datetime.utcnow().isoformat()}
    api_keys_db[api_key] = user_id
    return SignupResponse(
        user_id=user_id,
        api_key=api_key,
        message="Welcome to webhooks.email! Use your API key in x-api-key header."
    )

async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key and x_api_key in api_keys_db:
        return api_keys_db[x_api_key]
    return None

SYSTEM_PROMPT = """You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Be creative."""

@app.post("/api/generate", response_model=ChatResponse)
async def generate(req: ChatRequest, user_id: str | None = Depends(verify_api_key)):
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://webhooks.email",
                "X-Title": "webhooks.email",
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": req.prompt},
                ],
                "extra_body": {"reasoning": {"enabled": True}},
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"OpenRouter error: {resp.text}")
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            match = __import__("re").search(r"\{[\s\S]*\}", content)
            if match:
                parsed = json.loads(match.group(0))
            else:
                raise HTTPException(status_code=502, detail="Model returned invalid JSON")
    return ChatResponse(**parsed)

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": MODEL}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
