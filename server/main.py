# server/main.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import os
import requests
import logging
from datetime import datetime, date

logging.basicConfig(level=logging.INFO)

from database import supabase
from models import User, Habit, CheckIn
from schemas import UserOut, HabitCreate, HabitOut, CheckInCreate
from auth import verify_google_token, create_access_token, get_current_user

app = FastAPI(title="Sankalp - Unbreakable Habits")

# Environment
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

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

class GoogleCallbackRequest(BaseModel):
    code: str

used_codes = set()

@app.post("/auth/google/callback")
async def google_callback(request_body: GoogleCallbackRequest):
    code = request_body.code
    
    if not code:
        raise HTTPException(400, "No code provided")

    if code in used_codes:
        logging.warning(f"Code already used: {code[:20]}...")
        raise HTTPException(400, "Authorization code already used")
    
    used_codes.add(code)
    
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
                "redirect_uri": "http://localhost:5173/auth/callback",
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if token_resp.status_code != 200:
            error_detail = token_resp.json()
            logging.error(f"Google error: {error_detail}")
            
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

        # Find or create user in Supabase
        response = supabase.table('users').select('*').eq('google_id', payload["sub"]).execute()
        
        if response.data and len(response.data) > 0:
            user = User.from_supabase(response.data[0])
            logging.info(f"Existing user logged in: {user.email}")
        else:
            # Create new user
            new_user = {
                "email": payload["email"],
                "name": payload.get("name", "User"),
                "google_id": payload["sub"],
                "deposit_paid": False
            }
            response = supabase.table('users').insert(new_user).execute()
            user = User.from_supabase(response.data[0])
            logging.info(f"Created new user: {user.email}")

        # Create JWT
        access_token = create_access_token({"sub": user.email, "user_id": user.id})

        # Return response with cookie
        response = JSONResponse({
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "deposit_paid": user.deposit_paid
            }
        })
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # True in production
            samesite="lax",
            domain="localhost",
            path="/",
            max_age=30 * 24 * 60 * 60,
        )
        
        logging.info(f"✅ Login successful for {user.email}")
        return response

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        raise HTTPException(500, f"Authentication failed: {str(e)}")


@app.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    # Fetch latest user data from Supabase
    response = supabase.table('users').select('*').eq('id', user.id).single().execute()
    if response.data:
        return UserOut(**response.data)
    raise HTTPException(404, "User not found")


@app.post("/deposit-paid")
async def mark_deposit_paid(user: User = Depends(get_current_user)):
    try:
        response = supabase.table('users').update({
            "deposit_paid": True
        }).eq('id', user.id).execute()
        
        logging.info(f"✅ Deposit marked as paid for user {user.email}")
        return {"message": "₹500 commitment locked in!"}
    except Exception as e:
        logging.error(f"Error marking deposit: {str(e)}")
        raise HTTPException(500, "Failed to update deposit status")


@app.post("/habits")
async def create_habits(
    habits: List[HabitCreate],
    user: User = Depends(get_current_user)
):
    try:
        # Delete existing habits for the user (if any)
        supabase.table('habits').delete().eq('user_id', user.id).execute()
        
        # Insert new habits
        habits_data = [
            {
                "user_id": user.id,
                "name": h.name,
                "why": h.why,
                "time": h.time
            }
            for h in habits
        ]
        
        response = supabase.table('habits').insert(habits_data).execute()
        logging.info(f"✅ Created {len(habits)} habits for user {user.email}")
        
        return {"message": "Habits saved!", "habits": response.data}
    except Exception as e:
        logging.error(f"Error creating habits: {str(e)}")
        raise HTTPException(500, "Failed to save habits")


@app.get("/habits", response_model=List[HabitOut])
async def get_habits(user: User = Depends(get_current_user)):
    try:
        response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        
        if response.data:
            return [HabitOut(**habit) for habit in response.data]
        return []
    except Exception as e:
        logging.error(f"Error fetching habits: {str(e)}")
        raise HTTPException(500, "Failed to fetch habits")


@app.post("/checkins")
async def create_checkin(
    checkin: CheckInCreate,
    user: User = Depends(get_current_user)
):
    try:
        # Check if checkin already exists
        existing = supabase.table('checkins').select('*').eq(
            'user_id', user.id
        ).eq(
            'habit_id', checkin.habit_id
        ).eq(
            'date', checkin.date
        ).execute()
        
        if existing.data:
            # Update existing checkin
            response = supabase.table('checkins').update({
                "completed": checkin.completed
            }).eq('id', existing.data[0]['id']).execute()
        else:
            # Create new checkin
            response = supabase.table('checkins').insert({
                "user_id": user.id,
                "habit_id": checkin.habit_id,
                "date": checkin.date,
                "completed": checkin.completed
            }).execute()
        
        return {"message": "Check-in saved!", "data": response.data}
    except Exception as e:
        logging.error(f"Error saving checkin: {str(e)}")
        raise HTTPException(500, "Failed to save check-in")


@app.get("/checkins/{date}")
async def get_checkins(date: str, user: User = Depends(get_current_user)):
    try:
        response = supabase.table('checkins').select('*').eq(
            'user_id', user.id
        ).eq('date', date).execute()
        
        return response.data if response.data else []
    except Exception as e:
        logging.error(f"Error fetching checkins: {str(e)}")
        raise HTTPException(500, "Failed to fetch check-ins")


@app.get("/stats")
async def get_user_stats(user: User = Depends(get_current_user)):
    try:
        # Get all checkins for the user
        checkins = supabase.table('checkins').select('*').eq('user_id', user.id).execute()
        habits = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        
        total_habits = len(habits.data) if habits.data else 0
        total_checkins = len(checkins.data) if checkins.data else 0
        
        # Calculate streak
        if checkins.data:
            dates = set([c['date'] for c in checkins.data])
            today = date.today()
            streak = 0
            current_date = today
            
            while str(current_date) in dates:
                streak += 1
                current_date = current_date - timedelta(days=1)
        else:
            streak = 0
        
        return {
            "total_habits": total_habits,
            "total_checkins": total_checkins,
            "current_streak": streak,
            "deposit_paid": user.deposit_paid
        }
    except Exception as e:
        logging.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(500, "Failed to fetch stats")