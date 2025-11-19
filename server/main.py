# server/main.py

import os
import requests
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel
from fastapi import Request
import logging
logging.basicConfig(level=logging.INFO)

from database import create_db_and_tables, get_session
from models import User, Habit
from schemas import UserOut, HabitCreate, HabitOut
from auth import verify_google_token, create_access_token, get_current_user

app = FastAPI(title="Sankalp - Unbreakable Habits")

# Environment
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY")

# ✅ FIXED CORS - Added more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",  # Added this
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # Added this
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# ✅ ADD THIS: Pydantic model for request body
class GoogleCallbackRequest(BaseModel):
    code: str

# ✅ FIXED: Google OAuth callback endpoint
@app.post("/auth/google/callback")
async def google_callback(
    request_body: GoogleCallbackRequest,  # ✅ Changed from data: dict
    session: Session = Depends(get_session)
):
    code = request_body.code
    if not code:
        raise HTTPException(400, "No code provided")

    logging.info(f"Received Google auth code: {code[:20]}...")

    try:
        # Exchange code for tokens
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": "http://localhost:5173/auth/callback",
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        logging.info(f"Google token response: {token_resp.status_code}")

        if token_resp.status_code != 200:
            logging.error(f"Google error: {token_resp.text}")
            raise HTTPException(400, f"Google token exchange failed: {token_resp.text}")

        token_data = token_resp.json()
        id_token = token_data.get("id_token")
        
        if not id_token:
            raise HTTPException(400, "No id_token received from Google")

        # Verify the ID token
        payload = verify_google_token(id_token)
        logging.info(f"Verified user: {payload.get('email')}")

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
            logging.info(f"Created new user: {user.email}")
        else:
            logging.info(f"Found existing user: {user.email}")

        # Create JWT token
        access_token = create_access_token({"sub": user.email})
        logging.info(f"Generated JWT token for {user.email}")

        # ✅ FIXED: Changed true to True (Python boolean)
        response = JSONResponse({"success": True, "user": {"email": user.email, "name": user.name}})
        
        # Set cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            path="/",
            max_age=30 * 24 * 60 * 60,  # 30 days
        )
        
        logging.info(f"Cookie set for user: {user.email}")
        return response

    except requests.RequestException as e:
        logging.error(f"Request error: {str(e)}")
        raise HTTPException(500, f"Failed to communicate with Google: {str(e)}")
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        raise HTTPException(500, f"Authentication failed: {str(e)}")


@app.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user

@app.post("/deposit-paid")
async def mark_deposit_paid(
    user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
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
async def get_habits(
    user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    habits = session.exec(select(Habit).where(Habit.user_id == user.id)).all()
    return habits