import os
import requests
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel

from database import create_db_and_tables, get_session
from models import User, Habit
from schemas import UserOut, HabitCreate, HabitOut
from auth import verify_google_token, create_access_token, get_current_user

app = FastAPI(title="Sankalp - Unbreakable Habits")

# Environment
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY")

# CORS
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

# ────────────────────────────────
# Google OAuth2 Authorization Code Flow
# ────────────────────────────────
# class CodeRequest(BaseModel):
#     code: str

@app.post("/auth/google/callback")
async def google_callback(data: dict, session: Session = Depends(get_session)):
    code = data.get("code")
    if not code:
        raise HTTPException(400, "No code")

    # Add this: prevent reuse
    if hasattr(request.state, "code_used"):
        return JSONResponse({"message": "Already processed"})

    token_resp = requests.post("https://oauth2.googleapis.com/token", data={
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://localhost:5173/auth/callback",
        "grant_type": "authorization_code",
    })

    if token_resp.status_code != 200:
        print("Google error:", token_resp.json())
        raise HTTPException(400, "Invalid grant")

    # Mark as used (simple way)
    request.state.code_used = True

    id_token = token_resp.json().get("id_token")
    payload = verify_google_token(id_token)

    # Find or create user
    user = session.exec(select(User).where(User.google_id == payload["sub"])).first()
    if not user:
        user = User(
            email=payload["email"],
            name=payload.get("name", "User"),
            google_id=payload["sub"],
        )
        session.add(user)
        session.commit()
        session.refresh(user)

    # Create JWT and set cookie
    access_token = create_access_token({"sub": payload["email"]})

    response = JSONResponse({"success": true})
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=30 * 24 * 60 * 60,
    )
    return response


@app.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user

@app.post("/deposit-paid")
async def mark_deposit_paid(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    user.deposit_paid = True
    session.add(user)
    session.commit()
    return {"message": "₹500 commitment locked in!"}

@app.post("/habits")
async def create_habits(
    habits: List[HabitCreate],
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    for h in habits:
        habit = Habit(**h.dict(), user_id=user.id)
        session.add(habit)
    session.commit()
    return {"message": "Habits saved!"}

@app.get("/habits", response_model=List[HabitOut])
async def get_habits(user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    habits = session.exec(select(Habit).where(Habit.user_id == user.id)).all()
    return habits

