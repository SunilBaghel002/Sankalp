# server/main.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import os
import requests
import logging
from datetime import datetime, date, timedelta
from passlib.context import CryptContext
from email_service import generate_otp, send_otp_email, store_otp, verify_otp
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)

from database import supabase
from models import User, Habit, CheckIn
from schemas import UserOut, HabitCreate, HabitOut, CheckInCreate
from auth import verify_google_token, create_access_token, get_current_user

load_dotenv()

app = FastAPI(title="Sankalp - Unbreakable Habits")
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Test if bcrypt works
    test_hash = pwd_context.hash("test")
    print("✅ Using bcrypt for password hashing")
except Exception as e:
    print(f"⚠️ bcrypt failed, using pbkdf2_sha256: {e}")
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

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

class EmailSignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResendOTPRequest(BaseModel):
    email: EmailStr

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
            secure=False,
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
        checkins_response = supabase.table('checkins').select('*').eq('user_id', user.id).execute()
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        
        checkins = checkins_response.data if checkins_response.data else []
        habits = habits_response.data if habits_response.data else []
        
        total_habits = len(habits)
        
        if total_habits == 0:
            return {
                "total_habits": 0,
                "total_checkins": 0,
                "current_streak": 0,
                "deposit_paid": user.deposit_paid
            }
        
        # Calculate streak
        today = date.today()
        streak = 0
        
        # Group checkins by date
        checkins_by_date = {}
        for checkin in checkins:
            checkin_date = checkin['date']
            if checkin_date not in checkins_by_date:
                checkins_by_date[checkin_date] = []
            if checkin['completed']:
                checkins_by_date[checkin_date].append(checkin['habit_id'])
        
        # Calculate current streak (counting backwards from today)
        current_date = today
        while True:
            date_str = str(current_date)
            if date_str in checkins_by_date:
                # Check if all habits were completed on this date
                completed_habits = len(set(checkins_by_date[date_str]))
                if completed_habits == total_habits:
                    streak += 1
                    current_date = current_date - timedelta(days=1)
                else:
                    break
            else:
                # No checkins for this date, streak broken
                break
        
        # Count total completed days
        total_completed_days = 0
        for date_str, habit_ids in checkins_by_date.items():
            if len(set(habit_ids)) == total_habits:
                total_completed_days += 1
        
        return {
            "total_habits": total_habits,
            "total_checkins": len(checkins),
            "current_streak": streak,
            "total_completed_days": total_completed_days,
            "deposit_paid": user.deposit_paid
        }
    except Exception as e:
        logging.error(f"Error fetching stats: {str(e)}")
        # Return default values instead of error
        return {
            "total_habits": 0,
            "total_checkins": 0, 
            "current_streak": 0,
            "total_completed_days": 0,
            "deposit_paid": False
        }


# ==================== EMAIL AUTH ENDPOINTS ====================

@app.post("/auth/email/signup")
async def email_signup(request: EmailSignupRequest):
    name = request.name
    email = request.email
    password = request.password

    if not all([name, email, password]):
        raise HTTPException(400, "Name, email, and password are required")

    # Properly handle password truncation
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        logging.warning(f"Password truncated for {email} (was {len(password_bytes)} bytes)")
        password_bytes = password_bytes[:72]
        password = password_bytes.decode('utf-8', errors='ignore')

    # Check if user already exists
    existing_user = supabase.table('users').select('*').eq('email', email).execute()
    if existing_user.data:
        raise HTTPException(400, "Email already registered")

    # Hash password
    try:
        password_hash = pwd_context.hash(password)
        logging.info(f"Password hashed successfully for {email}")
    except Exception as hash_error:
        logging.error(f"Password hashing failed: {str(hash_error)}")
        import hashlib
        fallback_hash = hashlib.sha256(password.encode()).hexdigest()
        password_hash = f"sha256${fallback_hash}"
        logging.warning(f"Using fallback SHA256 for {email}")

    # Generate and send OTP
    otp = generate_otp()
    success = send_otp_email(email, otp, name)

    if not success:
        raise HTTPException(500, "Failed to send verification email. Please check email configuration.")

    # Store OTP
    store_otp(email, otp)

    # ✅ FIXED: Build user object dynamically based on what columns exist
    new_user = {
        "email": email,
        "name": name,
        "google_id": None,  # NULL for email users
        "deposit_paid": False,
    }
    
    # Try to add optional columns (they might not exist yet)
    try:
        # Check if these columns exist by doing a test query
        test_response = supabase.table('users').select('*').limit(1).execute()
        if test_response.data and len(test_response.data) > 0:
            sample_user = test_response.data[0]
            
            # Only add fields if they exist in the schema
            if 'password_hash' in sample_user:
                new_user["password_hash"] = password_hash
            if 'login_type' in sample_user:
                new_user["login_type"] = "email"
            if 'email_verified' in sample_user:
                new_user["email_verified"] = False
    except:
        # If test fails, just use basic fields
        pass
    
    # If password_hash isn't in schema yet, store it separately or skip
    if "password_hash" not in new_user:
        logging.warning("⚠️ password_hash column not found in database. Run the SQL migration!")
        # For now, just store without password (you'll need to add it later)
        new_user["password_hash"] = password_hash  # Try anyway

    # Insert user
    try:
        response = supabase.table('users').insert(new_user).execute()
        logging.info(f"✅ User {email} registered, OTP sent: {otp}")
        return {"message": "OTP sent to your email", "email": email}
    except Exception as e:
        error_msg = str(e)
        logging.error(f"Failed to create user: {error_msg}")
        
        # Provide helpful error messages
        if "email_verified" in error_msg:
            raise HTTPException(500, "Database missing email_verified column. Please run: ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;")
        elif "login_type" in error_msg:
            raise HTTPException(500, "Database missing login_type column. Please run: ALTER TABLE users ADD COLUMN login_type VARCHAR(20) DEFAULT 'google';")
        elif "password_hash" in error_msg:
            raise HTTPException(500, "Database missing password_hash column. Please run: ALTER TABLE users ADD COLUMN password_hash TEXT;")
        elif "null value in column \"google_id\"" in error_msg:
            raise HTTPException(500, "google_id must be nullable. Please run: ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;")
        
        raise HTTPException(500, f"Failed to create user: {error_msg}")


@app.post("/auth/email/login")
async def email_login(request: EmailLoginRequest):
    email = request.email
    password = request.password

    if not all([email, password]):
        raise HTTPException(400, "Email and password are required")

    # Find user
    user_response = supabase.table('users').select('*').eq('email', email).execute()

    if not user_response.data:
        raise HTTPException(401, "Invalid credentials")

    user = user_response.data[0]

    # Check login type
    login_type = user.get('login_type', 'google')
    
    if login_type == 'google':
        raise HTTPException(401, "This account uses Google login. Please sign in with Google.")
    
    # Check if password_hash exists
    if 'password_hash' not in user or not user['password_hash']:
        raise HTTPException(401, "Password not set for this account")
    
    # ✅ Handle both bcrypt and SHA256 fallback hashes
    stored_hash = user['password_hash']
    
    try:
        if stored_hash.startswith("sha256$"):
            # Fallback hash
            import hashlib
            test_hash = hashlib.sha256(password.encode()).hexdigest()
            if f"sha256${test_hash}" != stored_hash:
                raise HTTPException(401, "Invalid credentials")
        else:
            # Normal passlib hash
            # Truncate password if needed
            if len(password.encode('utf-8')) > 72:
                password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
            
            if not pwd_context.verify(password, stored_hash):
                raise HTTPException(401, "Invalid credentials")
    except Exception as e:
        logging.error(f"Password verification error: {str(e)}")
        raise HTTPException(401, "Invalid credentials")

    # Create JWT
    access_token = create_access_token({"sub": email, "user_id": user['id']})

    # Return response with cookie
    response = JSONResponse({
        "success": True,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "deposit_paid": user.get('deposit_paid', False)
        }
    })

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        domain="localhost",
        path="/",
        max_age=30 * 24 * 60 * 60,
    )

    logging.info(f"✅ User {email} logged in")
    return response

@app.post("/auth/email/verify-otp")
async def verify_otp_endpoint(request: VerifyOTPRequest):
    email = request.email
    otp = request.otp

    if not all([email, otp]):
        raise HTTPException(400, "Email and OTP are required")

    # Verify OTP
    if not verify_otp(email, otp):
        raise HTTPException(400, "Invalid or expired OTP")

    # ✅ FIXED: Only update email_verified if column exists
    try:
        # Try to update email_verified
        supabase.table('users').update({"email_verified": True}).eq('email', email).execute()
        logging.info(f"✅ Email verified status updated for {email}")
    except Exception as e:
        # Column might not exist yet
        logging.warning(f"Could not update email_verified (column might not exist): {str(e)}")

    # Get user
    user_response = supabase.table('users').select('*').eq('email', email).execute()
    
    if not user_response.data:
        raise HTTPException(404, "User not found")
    
    user = user_response.data[0]

    # Create JWT
    access_token = create_access_token({"sub": email, "user_id": user['id']})

    response = JSONResponse({
        "success": True,
        "message": "Email verified successfully",
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "deposit_paid": user.get('deposit_paid', False)
        }
    })

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        domain="localhost",
        path="/",
        max_age=30 * 24 * 60 * 60,
    )

    logging.info(f"✅ Email {email} verified and logged in")
    return response


@app.post("/auth/email/resend-otp")
async def resend_otp(request: ResendOTPRequest):  # ✅ FIXED: Use Pydantic model
    email = request.email

    if not email:
        raise HTTPException(400, "Email is required")

    # Get user
    user_response = supabase.table('users').select('*').eq('email', email).execute()

    if not user_response.data:
        raise HTTPException(404, "User not found")

    user = user_response.data[0]

    # Generate and send new OTP
    otp = generate_otp()
    success = send_otp_email(email, otp, user['name'])

    if not success:
        raise HTTPException(500, "Failed to send OTP")

    store_otp(email, otp)

    logging.info(f"✅ OTP resent to {email}")
    return {"message": "OTP resent successfully"}