# server/main.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
from pydantic import BaseModel
import os
import requests
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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# ✅ Request model
class GoogleCallbackRequest(BaseModel):
    code: str

# ✅ Store used codes to prevent reuse (in production use Redis)
used_codes = set()

@app.post("/auth/google/callback")
async def google_callback(
    request_body: GoogleCallbackRequest,
    session: Session = Depends(get_session)
):
    code = request_body.code
    
    if not code:
        raise HTTPException(400, "No code provided")

    # ✅ Prevent code reuse
    if code in used_codes:
        logging.warning(f"Code already used: {code[:20]}...")
        raise HTTPException(400, "Authorization code already used")
    
    used_codes.add(code)
    
    # ✅ Clean up old codes (keep last 100)
    if len(used_codes) > 100:
        used_codes.pop()

    logging.info(f"Received auth code: {code[:20]}...")

    try:
        # Exchange code for tokens
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": "http://localhost:5173/auth/callback",  # ✅ Make sure this matches Google Console
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        logging.info(f"Google response status: {token_resp.status_code}")

        if token_resp.status_code != 200:
            error_detail = token_resp.json()
            logging.error(f"Google error: {error_detail}")
            
            # ✅ Better error message
            if error_detail.get("error") == "invalid_grant":
                raise HTTPException(400, "Authorization code expired or already used. Please sign in again.")
            
            raise HTTPException(400, f"Google authentication failed: {error_detail.get('error_description', 'Unknown error')}")

        token_data = token_resp.json()
        id_token = token_data.get("id_token")
        
        if not id_token:
            raise HTTPException(400, "No id_token received from Google")

        # Verify the ID token
        payload = verify_google_token(id_token)
        logging.info(f"Authenticated user: {payload.get('email')}")

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
            logging.info(f"Existing user logged in: {user.email}")

        # Create JWT
        access_token = create_access_token({"sub": user.email})

        # Return response with cookie
        response = JSONResponse({
            "success": True,
            "user": {
                "email": user.email,
                "name": user.name,
                "id": user.id
            }
        })
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set True in production
            samesite="lax",
            path="/",
            max_age=30 * 24 * 60 * 60,
        )
        
        logging.info(f"✅ Login successful for {user.email}")
        return response

    except HTTPException:
        raise
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