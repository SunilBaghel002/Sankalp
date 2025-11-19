import os
import requests
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from pydantic import BaseModel

from database import create_db_and_tables, get_session
from models import User, Habit
from schemas import UserOut, HabitCreate, HabitOut
from auth import verify_google_token, create_access_token, get_current_user

app = FastAPI(title="Sankalp Backend")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# ONLY ONE MODEL — THIS FIXES THE 400 ERROR
class CodeRequest(BaseModel):
    code: str

@app.post("/auth/google/callback")
async def google_callback(request: CodeRequest, session: Session = Depends(get_session)):
    code = request.code

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": "http://localhost:5173/auth/callback",
            "grant_type": "authorization_code",
        },
    )

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get token from Google")

    tokens = token_response.json()
    id_token = tokens.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="No id_token from Google")

    payload = verify_google_token(id_token)

    user = session.exec(select(User).where(User.google_id == payload["sub"])).first()
    if not user:
        user = User(
            email=payload["email"],
            name=payload.get("name", payload["email"].split("@")[0]),
            google_id=payload["sub"],
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    access_token = create_access_token({"sub": user.email})

    response = JSONResponse({"success": True})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,
        secure=False,
        samesite="lax",
        path="/",
    )
    return response

# Keep your other routes exactly the same
@app.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return user

@app.post("/deposit-paid")
async def mark_deposit_paid(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    user.deposit_paid = True
    session.add(user)
    session.commit()
    return {"message": "Deposit paid!"}

# ... rest of your routes