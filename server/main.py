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
from schemas import (
    UserOut, HabitCreate, HabitOut, CheckInCreate,
    DailyThoughtCreate, DailyThoughtOut,
    SleepRecordCreate, SleepRecordOut,
    MonthlyAnalysisRequest, AnalysisResponse, HabitCompletionData
)

from google_calendar import (
    get_calendar_auth_url,
    exchange_code_for_tokens,
    get_calendar_service,
    create_habit_reminder,
    delete_habit_reminder,
    get_upcoming_reminders
)

from datetime import datetime, date, timedelta
import calendar

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
    
class CalendarCallbackRequest(BaseModel):
    code: str

class CreateCalendarEventRequest(BaseModel):
    habit_id: int
    start_date: Optional[str] = None

used_codes = set()

COOKIE_CONFIG = {
    "key": "access_token",
    "httponly": True,
    "secure": False,  # Set to True in production with HTTPS
    "samesite": "lax",
    "domain": None,  # ✅ CHANGED: Don't set domain for localhost
    "path": "/",
    "max_age": 30 * 24 * 60 * 60,  # 30 days
}

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
            **COOKIE_CONFIG,
            value=access_token
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
                "total_completed_days": 0,
                "longest_streak": 0,
                "deposit_paid": user.deposit_paid
            }
        
        # Group checkins by date (ensure consistent string format)
        checkins_by_date = {}
        for checkin in checkins:
            # Ensure date is in string format YYYY-MM-DD
            checkin_date = checkin['date']
            if isinstance(checkin_date, str):
                date_str = checkin_date
            else:
                # Convert date object to string
                date_str = str(checkin_date)
            
            if date_str not in checkins_by_date:
                checkins_by_date[date_str] = []
            if checkin['completed']:
                checkins_by_date[date_str].append(checkin['habit_id'])
        
        # Get all unique dates and sort them
        all_dates = sorted(checkins_by_date.keys())
        
        # Calculate longest streak by scanning all dates
        longest_streak = 0
        current_streak_count = 0
        
        # Convert string dates to date objects for proper iteration
        if all_dates:
            start_date = datetime.strptime(all_dates[0], '%Y-%m-%d').date()
            end_date = datetime.strptime(all_dates[-1], '%Y-%m-%d').date()
            
            # Iterate through all dates from start to end
            current_check_date = start_date
            while current_check_date <= end_date:
                date_str = current_check_date.strftime('%Y-%m-%d')
                
                if date_str in checkins_by_date:
                    completed_habits = len(set(checkins_by_date[date_str]))
                    if completed_habits == total_habits:
                        current_streak_count += 1
                        longest_streak = max(longest_streak, current_streak_count)
                    else:
                        current_streak_count = 0
                else:
                    current_streak_count = 0
                
                current_check_date += timedelta(days=1)
        
        # Calculate current streak (counting backwards from today)
        today = date.today()
        current_streak = 0
        current_date = today
        
        # Go backwards from today
        while True:
            date_str = current_date.strftime('%Y-%m-%d')
            
            if date_str in checkins_by_date:
                # Check if all habits were completed on this date
                completed_habits = len(set(checkins_by_date[date_str]))
                if completed_habits == total_habits:
                    current_streak += 1
                    current_date = current_date - timedelta(days=1)
                else:
                    # Partial completion breaks the streak
                    break
            else:
                # No checkins for this date
                # If we haven't started counting yet (streak is 0), go back one more day
                # This handles the case where user hasn't checked in today yet
                if current_streak == 0:
                    current_date = current_date - timedelta(days=1)
                    # Don't go back more than 2 days when looking for streak start
                    if (today - current_date).days > 1:
                        break
                else:
                    # Streak is broken
                    break
        
        # Count total completed days (days with 100% habit completion)
        total_completed_days = 0
        for date_str, habit_ids in checkins_by_date.items():
            if len(set(habit_ids)) == total_habits:
                total_completed_days += 1
        
        logging.info(f"Stats for user {user.email}: streak={current_streak}, longest={longest_streak}, completed={total_completed_days}")
        
        return {
            "total_habits": total_habits,
            "total_checkins": len(checkins),
            "current_streak": current_streak,
            "total_completed_days": total_completed_days,
            "longest_streak": longest_streak,
            "deposit_paid": user.deposit_paid
        }
    except Exception as e:
        logging.error(f"Error fetching stats: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return default values instead of error
        return {
            "total_habits": 0,
            "total_checkins": 0, 
            "current_streak": 0,
            "total_completed_days": 0,
            "longest_streak": 0,
            "deposit_paid": False
        }
        
@app.get("/insights")
async def get_insights(user: User = Depends(get_current_user)):
    try:
        # Get all user data
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        checkins_response = supabase.table('checkins').select('*').eq('user_id', user.id).execute()
        thoughts_response = supabase.table('daily_thoughts').select('*').eq('user_id', user.id).execute()
        sleep_response = supabase.table('sleep_records').select('*').eq('user_id', user.id).execute()
        
        habits = habits_response.data if habits_response.data else []
        checkins = checkins_response.data if checkins_response.data else []
        thoughts = thoughts_response.data if thoughts_response.data else []
        sleep_records = sleep_response.data if sleep_response.data else []
        
        total_habits = len(habits)
        
        # Calculate habit completion rate per habit
        habit_stats = {}
        for habit in habits:
            habit_checkins = [c for c in checkins if c['habit_id'] == habit['id'] and c['completed']]
            habit_stats[habit['id']] = {
                "name": habit['name'],
                "completed_count": len(habit_checkins),
                "completion_rate": 0
            }
        
        # Calculate completion rates
        if checkins:
            unique_dates = set(c['date'] for c in checkins)
            for habit_id in habit_stats:
                habit_stats[habit_id]['completion_rate'] = round(
                    (habit_stats[habit_id]['completed_count'] / len(unique_dates)) * 100, 1
                ) if unique_dates else 0
        
        # Calculate average sleep
        avg_sleep = 0
        if sleep_records:
            total_sleep = sum(r.get('sleep_hours', 0) for r in sleep_records)
            avg_sleep = round(total_sleep / len(sleep_records), 1)
        
        # Calculate streak
        today = date.today()
        current_streak = 0
        checkins_by_date = {}
        
        for checkin in checkins:
            date_str = checkin['date']
            if date_str not in checkins_by_date:
                checkins_by_date[date_str] = []
            if checkin['completed']:
                checkins_by_date[date_str].append(checkin['habit_id'])
        
        current_date = today
        while True:
            date_str = current_date.strftime('%Y-%m-%d')
            if date_str in checkins_by_date:
                completed_habits = len(set(checkins_by_date[date_str]))
                if completed_habits == total_habits and total_habits > 0:
                    current_streak += 1
                    current_date = current_date - timedelta(days=1)
                else:
                    break
            else:
                if current_streak == 0:
                    current_date = current_date - timedelta(days=1)
                    if (today - current_date).days > 1:
                        break
                else:
                    break
        
        # Count total completed days
        total_completed_days = 0
        for date_str, habit_ids in checkins_by_date.items():
            if len(set(habit_ids)) == total_habits and total_habits > 0:
                total_completed_days += 1
        
        # Weekly data for charts
        weekly_data = []
        for i in range(6, -1, -1):
            check_date = today - timedelta(days=i)
            date_str = check_date.strftime('%Y-%m-%d')
            day_name = check_date.strftime('%a')
            
            completed = len(set(checkins_by_date.get(date_str, [])))
            weekly_data.append({
                "day": day_name,
                "date": date_str,
                "completed": completed,
                "total": total_habits,
                "percentage": round((completed / total_habits) * 100, 1) if total_habits > 0 else 0
            })
        
        # Sleep data for last 7 days
        weekly_sleep = []
        for i in range(6, -1, -1):
            check_date = today - timedelta(days=i)
            date_str = check_date.strftime('%Y-%m-%d')
            day_name = check_date.strftime('%a')
            
            sleep_record = next((r for r in sleep_records if r['date'] == date_str), None)
            weekly_sleep.append({
                "day": day_name,
                "date": date_str,
                "hours": sleep_record.get('sleep_hours', 0) if sleep_record else 0
            })
        
        return {
            "current_streak": current_streak,
            "total_completed_days": total_completed_days,
            "total_habits": total_habits,
            "habit_stats": list(habit_stats.values()),
            "total_thoughts": len(thoughts),
            "total_sleep_records": len(sleep_records),
            "average_sleep": avg_sleep,
            "weekly_data": weekly_data,
            "weekly_sleep": weekly_sleep,
            "deposit_paid": user.deposit_paid
        }
    except Exception as e:
        logging.error(f"Error fetching insights: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to fetch insights: {str(e)}")


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

@app.post("/daily-thought")
async def create_or_update_daily_thought(
    thought_data: DailyThoughtCreate,
    user: User = Depends(get_current_user)
):
    try:
        # Check if thought already exists for this date
        existing = supabase.table('daily_thoughts').select('*').eq(
            'user_id', user.id
        ).eq('date', thought_data.date).execute()
        
        if existing.data:
            # Update existing thought
            response = supabase.table('daily_thoughts').update({
                "thought": thought_data.thought,
                "updated_at": datetime.utcnow().isoformat()
            }).eq('id', existing.data[0]['id']).execute()
            logging.info(f"✅ Updated daily thought for {user.email} on {thought_data.date}")
        else:
            # Create new thought
            response = supabase.table('daily_thoughts').insert({
                "user_id": user.id,
                "date": thought_data.date,
                "thought": thought_data.thought,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            logging.info(f"✅ Created daily thought for {user.email} on {thought_data.date}")
        
        return {"message": "Thought saved!", "data": response.data}
    except Exception as e:
        logging.error(f"Error saving daily thought: {str(e)}")
        raise HTTPException(500, f"Failed to save thought: {str(e)}")


@app.get("/daily-thought/{date}")
async def get_daily_thought(date: str, user: User = Depends(get_current_user)):
    try:
        response = supabase.table('daily_thoughts').select('*').eq(
            'user_id', user.id
        ).eq('date', date).execute()
        
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        logging.error(f"Error fetching daily thought: {str(e)}")
        raise HTTPException(500, "Failed to fetch thought")


@app.get("/daily-thoughts")
async def get_all_daily_thoughts(user: User = Depends(get_current_user)):
    try:
        response = supabase.table('daily_thoughts').select('*').eq(
            'user_id', user.id
        ).order('date', desc=True).execute()
        
        return response.data if response.data else []
    except Exception as e:
        logging.error(f"Error fetching daily thoughts: {str(e)}")
        raise HTTPException(500, "Failed to fetch thoughts")


# ==================== SLEEP RECORD ENDPOINTS ====================

def calculate_sleep_hours(sleep_time: str, wake_time: str) -> float:
    """Calculate sleep duration in hours"""
    try:
        sleep_dt = datetime.strptime(sleep_time, "%H:%M")
        wake_dt = datetime.strptime(wake_time, "%H:%M")
        
        # If wake time is earlier than sleep time, assume next day
        if wake_dt < sleep_dt:
            wake_dt += timedelta(days=1)
        
        duration = wake_dt - sleep_dt
        hours = duration.total_seconds() / 3600
        return round(hours, 2)
    except Exception as e:
        logging.error(f"Error calculating sleep hours: {str(e)}")
        return 0.0


@app.post("/sleep-record")
async def create_or_update_sleep_record(
    sleep_data: SleepRecordCreate,
    user: User = Depends(get_current_user)
):
    try:
        sleep_hours = calculate_sleep_hours(sleep_data.sleep_time, sleep_data.wake_time)
        
        # Check if record already exists for this date
        existing = supabase.table('sleep_records').select('*').eq(
            'user_id', user.id
        ).eq('date', sleep_data.date).execute()
        
        if existing.data:
            # Update existing record
            response = supabase.table('sleep_records').update({
                "sleep_time": sleep_data.sleep_time,
                "wake_time": sleep_data.wake_time,
                "sleep_hours": sleep_hours,
                "updated_at": datetime.utcnow().isoformat()
            }).eq('id', existing.data[0]['id']).execute()
            logging.info(f"✅ Updated sleep record for {user.email} on {sleep_data.date}")
        else:
            # Create new record
            response = supabase.table('sleep_records').insert({
                "user_id": user.id,
                "date": sleep_data.date,
                "sleep_time": sleep_data.sleep_time,
                "wake_time": sleep_data.wake_time,
                "sleep_hours": sleep_hours,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            logging.info(f"✅ Created sleep record for {user.email} on {sleep_data.date}")
        
        return {"message": "Sleep record saved!", "data": response.data, "sleep_hours": sleep_hours}
    except Exception as e:
        logging.error(f"Error saving sleep record: {str(e)}")
        raise HTTPException(500, f"Failed to save sleep record: {str(e)}")


@app.get("/sleep-record/{date}")
async def get_sleep_record(date: str, user: User = Depends(get_current_user)):
    try:
        response = supabase.table('sleep_records').select('*').eq(
            'user_id', user.id
        ).eq('date', date).execute()
        
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        logging.error(f"Error fetching sleep record: {str(e)}")
        raise HTTPException(500, "Failed to fetch sleep record")


@app.get("/sleep-records")
async def get_all_sleep_records(user: User = Depends(get_current_user)):
    try:
        response = supabase.table('sleep_records').select('*').eq(
            'user_id', user.id
        ).order('date', desc=True).execute()
        
        return response.data if response.data else []
    except Exception as e:
        logging.error(f"Error fetching sleep records: {str(e)}")
        raise HTTPException(500, "Failed to fetch sleep records")


# ==================== ANALYSIS ENDPOINT ====================

@app.get("/analysis/monthly")
async def get_monthly_analysis(
    year: int,
    month: int,
    user: User = Depends(get_current_user)
):
    try:
        # Get the first and last day of the month
        first_day = date(year, month, 1)
        last_day = date(year, month, calendar.monthrange(year, month)[1])
        
        first_day_str = first_day.strftime('%Y-%m-%d')
        last_day_str = last_day.strftime('%Y-%m-%d')
        
        # Fetch thoughts for the month
        thoughts_response = supabase.table('daily_thoughts').select('*').eq(
            'user_id', user.id
        ).gte('date', first_day_str).lte('date', last_day_str).order('date').execute()
        
        # Fetch sleep records for the month
        sleep_response = supabase.table('sleep_records').select('*').eq(
            'user_id', user.id
        ).gte('date', first_day_str).lte('date', last_day_str).order('date').execute()
        
        # Fetch habits
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        habits = habits_response.data if habits_response.data else []
        
        # Fetch checkins for the month
        checkins_response = supabase.table('checkins').select('*').eq(
            'user_id', user.id
        ).gte('date', first_day_str).lte('date', last_day_str).execute()
        
        checkins = checkins_response.data if checkins_response.data else []
        
        # Group checkins by date
        checkins_by_date = {}
        for checkin in checkins:
            date_str = checkin['date']
            if date_str not in checkins_by_date:
                checkins_by_date[date_str] = {}
            checkins_by_date[date_str][checkin['habit_id']] = checkin['completed']
        
        # Build habit completions array for each day of the month
        habit_completions = []
        total_habits = len(habits)
        
        current_date = first_day
        while current_date <= last_day:
            date_str = current_date.strftime('%Y-%m-%d')
            day_checkins = checkins_by_date.get(date_str, {})
            
            completed_count = sum(1 for v in day_checkins.values() if v)
            all_completed = completed_count == total_habits and total_habits > 0
            
            habit_completions.append({
                "date": date_str,
                "habits": day_checkins,
                "all_completed": all_completed,
                "completed_count": completed_count,
                "total_habits": total_habits
            })
            
            current_date += timedelta(days=1)
        
        return {
            "thoughts": thoughts_response.data if thoughts_response.data else [],
            "sleep_records": sleep_response.data if sleep_response.data else [],
            "habit_completions": habit_completions,
            "habits": habits,
            "month": month,
            "year": year,
            "days_in_month": calendar.monthrange(year, month)[1]
        }
    except Exception as e:
        logging.error(f"Error fetching monthly analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to fetch analysis: {str(e)}")
    
@app.get("/calendar/auth-url")
async def get_calendar_authorization_url(user: User = Depends(get_current_user)):
    """Get Google Calendar authorization URL"""
    try:
        auth_url = get_calendar_auth_url(state=str(user.id))
        return {"auth_url": auth_url}
    except Exception as e:
        logging.error(f"Error getting calendar auth URL: {str(e)}")
        raise HTTPException(500, f"Failed to get authorization URL: {str(e)}")


@app.post("/calendar/callback")
async def calendar_oauth_callback(
    request: CalendarCallbackRequest,
    user: User = Depends(get_current_user)
):
    """Handle Google Calendar OAuth callback"""
    try:
        tokens = exchange_code_for_tokens(request.code)
        
        # Store tokens in database
        supabase.table('users').update({
            "calendar_tokens": tokens
        }).eq('id', user.id).execute()
        
        logging.info(f"✅ Calendar connected for user {user.email}")
        return {"success": True, "message": "Calendar connected successfully!"}
    except Exception as e:
        logging.error(f"Error in calendar callback: {str(e)}")
        raise HTTPException(500, f"Failed to connect calendar: {str(e)}")


@app.post("/calendar/sync-habits")
async def sync_habits_to_calendar(user: User = Depends(get_current_user)):
    """Sync all user habits to Google Calendar"""
    try:
        # Get user's calendar tokens
        user_data = supabase.table('users').select('calendar_tokens').eq('id', user.id).single().execute()
        
        if not user_data.data or not user_data.data.get('calendar_tokens'):
            raise HTTPException(400, "Calendar not connected. Please connect your Google Calendar first.")
        
        tokens = user_data.data['calendar_tokens']
        service = get_calendar_service(tokens)
        
        # Get user's habits
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        habits = habits_response.data if habits_response.data else []
        
        results = []
        for habit in habits:
            result = create_habit_reminder(
                service=service,
                habit_name=habit['name'],
                habit_time=habit['time'],
                habit_why=habit['why']
            )
            
            if result['success']:
                # Store event ID in database
                supabase.table('habits').update({
                    "calendar_event_id": result['event_id']
                }).eq('id', habit['id']).execute()
            
            results.append({
                "habit": habit['name'],
                **result
            })
        
        return {
            "success": True,
            "message": f"Synced {len(habits)} habits to calendar",
            "results": results
        }
    except Exception as e:
        logging.error(f"Error syncing habits to calendar: {str(e)}")
        raise HTTPException(500, f"Failed to sync habits: {str(e)}")


@app.get("/calendar/status")
async def get_calendar_status(user: User = Depends(get_current_user)):
    """Check if calendar is connected"""
    try:
        user_data = supabase.table('users').select('calendar_tokens').eq('id', user.id).single().execute()
        
        is_connected = bool(user_data.data and user_data.data.get('calendar_tokens'))
        
        return {
            "connected": is_connected,
            "message": "Calendar is connected" if is_connected else "Calendar not connected"
        }
    except Exception as e:
        logging.error(f"Error checking calendar status: {str(e)}")
        return {"connected": False, "message": "Error checking status"}


@app.get("/calendar/upcoming")
async def get_upcoming_calendar_events(user: User = Depends(get_current_user)):
    """Get upcoming habit reminders from calendar"""
    try:
        user_data = supabase.table('users').select('calendar_tokens').eq('id', user.id).single().execute()
        
        if not user_data.data or not user_data.data.get('calendar_tokens'):
            return {"events": [], "message": "Calendar not connected"}
        
        tokens = user_data.data['calendar_tokens']
        service = get_calendar_service(tokens)
        
        events = get_upcoming_reminders(service)
        
        return {"events": events}
    except Exception as e:
        logging.error(f"Error fetching upcoming events: {str(e)}")
        return {"events": [], "error": str(e)}


@app.delete("/calendar/disconnect")
async def disconnect_calendar(user: User = Depends(get_current_user)):
    """Disconnect Google Calendar"""
    try:
        supabase.table('users').update({
            "calendar_tokens": None
        }).eq('id', user.id).execute()
        
        # Also clear event IDs from habits
        supabase.table('habits').update({
            "calendar_event_id": None
        }).eq('user_id', user.id).execute()
        
        return {"success": True, "message": "Calendar disconnected"}
    except Exception as e:
        logging.error(f"Error disconnecting calendar: {str(e)}")
        raise HTTPException(500, f"Failed to disconnect: {str(e)}")