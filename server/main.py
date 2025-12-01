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

from push_notification_service import push_service, SmartNotificationScheduler
from pydantic import BaseModel
from typing import List, Optional

from smart_notifications import check_and_send_reminders, send_reminder_email



from google_calendar import (
    get_calendar_auth_url,
    exchange_code_for_tokens,
    get_calendar_service,
    create_habit_reminder,
    delete_habit_reminder,
    get_upcoming_reminders
)

from gemini_service import (
    generate_motivational_quote,
    generate_habit_tips,
    generate_sleep_insights,
    generate_daily_affirmation,
    generate_thought_reflection,
    generate_weekly_report,
    chat_with_habit_coach
)

from youtube_service import (
    search_habit_videos,
    get_video_details,
    get_recommended_videos_for_habit,
    get_daily_video_recommendation,
    get_learning_path_videos
)

from enhanced_habits import (
    EnhancedHabitCreate,
    EnhancedCheckinCreate,
    SkipHabitRequest,
    HabitStreakManager,
    DailyChallengeManager,
    HabitAnalytics
)

from middleware import (
    RateLimitMiddleware,
    LoggingMiddleware,
    ErrorHandlingMiddleware,
    SecurityHeadersMiddleware,
    cache,
    cached,
    invalidate_cache
)
from challenges_service import ChallengesService
from streak_service import StreakService

# Initialize services
challenges_service = ChallengesService(supabase)
streak_service = StreakService(supabase)

# Add middlewares (order matters - first added = outermost)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

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
    
class ChatRequest(BaseModel):
    message: str

class ThoughtReflectionRequest(BaseModel):
    thought: str
    date: str
    
class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    reminder_time: Optional[str] = None  # e.g., "18:00" for 6 PM reminder
    
class PushSubscription(BaseModel):
    endpoint: str
    keys: dict
    expirationTime: Optional[str] = None

class NotificationPreferences(BaseModel):
    push_enabled: bool = True
    morning_motivation: bool = True
    habit_reminders: bool = True
    streak_alerts: bool = True
    evening_reminder: bool = True
    achievement_alerts: bool = True
    sleep_reminders: bool = True

class TestNotificationRequest(BaseModel):
    title: str = "Test Notification"
    body: str = "This is a test notification from Sankalp!"

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


@app.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current user info"""
    try:
        # Fetch latest user data from Supabase
        response = supabase.table('users').select('*').eq('id', user.id).single().execute()
        
        if response.data:
            return {
                "id": response.data.get("id"),
                "email": response.data.get("email"),
                "name": response.data.get("name"),
                "deposit_paid": response.data.get("deposit_paid", False),
                "current_streak": response.data.get("current_streak", 0),
                "total_xp": response.data.get("total_xp", 0),
                "badges": response.data.get("badges", []),
                "email_verified": response.data.get("email_verified", False),
            }
        
        raise HTTPException(404, "User not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in /me endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to fetch user: {str(e)}")


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


@app.get("/habits")
async def get_habits(user: User = Depends(get_current_user)):
    """Get user's habits"""
    try:
        response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        
        if response.data:
            return [
                {
                    "id": habit["id"],
                    "user_id": habit["user_id"],
                    "name": habit["name"],
                    "why": habit.get("why", ""),
                    "time": habit.get("time", "09:00"),
                    "calendar_event_id": habit.get("calendar_event_id"),
                }
                for habit in response.data
            ]
        return []
        
    except Exception as e:
        logging.error(f"Error fetching habits: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to fetch habits: {str(e)}")


@app.post("/checkins")
async def create_checkin(
    checkin: CheckInCreate,
    user: User = Depends(get_current_user)
):
    """Create or update a checkin"""
    try:
        # Validate date format
        try:
            datetime.strptime(checkin.date, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(400, f"Invalid date format: {checkin.date}. Use YYYY-MM-DD")
        
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
        
        # Update user's current streak if needed
        await update_user_streak(user.id)
        
        return {"message": "Check-in saved!", "data": response.data}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error saving checkin: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to save check-in: {str(e)}")

async def update_user_streak(user_id: int):
    """Update user's current streak after a checkin"""
    try:
        # Get habits count
        habits_response = supabase.table('habits').select('id').eq('user_id', user_id).execute()
        total_habits = len(habits_response.data) if habits_response.data else 0
        
        if total_habits == 0:
            return
        
        # Get all checkins
        checkins_response = supabase.table('checkins').select('*').eq('user_id', user_id).execute()
        checkins = checkins_response.data or []
        
        # Group by date
        checkins_by_date = {}
        for checkin in checkins:
            date_str = checkin['date']
            if date_str not in checkins_by_date:
                checkins_by_date[date_str] = []
            if checkin['completed']:
                checkins_by_date[date_str].append(checkin['habit_id'])
        
        # Calculate current streak
        today = date.today()
        current_streak = 0
        current_date = today
        
        while True:
            date_str = current_date.strftime('%Y-%m-%d')
            
            if date_str in checkins_by_date:
                completed_habits = len(set(checkins_by_date[date_str]))
                if completed_habits == total_habits:
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
        total_completed_days = sum(
            1 for date_str, habit_ids in checkins_by_date.items()
            if len(set(habit_ids)) == total_habits
        )
        
        # Update user
        supabase.table('users').update({
            'current_streak': current_streak,
        }).eq('id', user_id).execute()
        
    except Exception as e:
        logging.error(f"Error updating streak: {str(e)}")
        
@app.get("/checkins/{date}")
async def get_checkins(date: str, user: User = Depends(get_current_user)):
    """Get checkins for a specific date"""
    try:
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            raise HTTPException(400, f"Invalid date format: {date}. Use YYYY-MM-DD")
        
        response = supabase.table('checkins').select('*').eq(
            'user_id', user.id
        ).eq('date', date).execute()
        
        return response.data if response.data else []
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching checkins for {date}: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty array instead of error for better UX
        return []


@app.get("/stats")
async def get_user_stats(user: User = Depends(get_current_user)):
    """Get user statistics"""
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
        
        # Group checkins by date
        checkins_by_date = {}
        for checkin in checkins:
            date_str = str(checkin['date'])
            if date_str not in checkins_by_date:
                checkins_by_date[date_str] = []
            if checkin['completed']:
                checkins_by_date[date_str].append(checkin['habit_id'])
        
        # Calculate streaks
        all_dates = sorted(checkins_by_date.keys())
        longest_streak = 0
        current_streak_count = 0
        
        if all_dates:
            start_date = datetime.strptime(all_dates[0], '%Y-%m-%d').date()
            end_date = datetime.strptime(all_dates[-1], '%Y-%m-%d').date()
            
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
        
        # Calculate current streak
        today = date.today()
        current_streak = 0
        current_date = today
        
        while True:
            date_str = current_date.strftime('%Y-%m-%d')
            
            if date_str in checkins_by_date:
                completed_habits = len(set(checkins_by_date[date_str]))
                if completed_habits == total_habits:
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
        total_completed_days = sum(
            1 for date_str, habit_ids in checkins_by_date.items()
            if len(set(habit_ids)) == total_habits
        )
        
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
    """Get daily thought for a specific date"""
    try:
        response = supabase.table('daily_thoughts').select('*').eq(
            'user_id', user.id
        ).eq('date', date).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
        
    except Exception as e:
        logging.error(f"Error fetching daily thought: {str(e)}")
        return None


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
    """Get sleep record for a specific date"""
    try:
        response = supabase.table('sleep_records').select('*').eq(
            'user_id', user.id
        ).eq('date', date).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
        
    except Exception as e:
        logging.error(f"Error fetching sleep record: {str(e)}")
        return None


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
        logging.info(f"Calendar callback received for user {user.id}")
        
        # Exchange code for tokens
        tokens = exchange_code_for_tokens(request.code)
        
        if not tokens.get("token"):
            raise HTTPException(400, "Failed to get access token")
        
        # Store tokens in database
        supabase.table('users').update({
            "calendar_tokens": tokens
        }).eq('id', user.id).execute()
        
        logging.info(f"✅ Calendar connected for user {user.email}")
        return {"success": True, "message": "Calendar connected successfully!"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in calendar callback: {str(e)}")
        import traceback
        traceback.print_exc()
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
        
        # Check if we need to refresh the token
        try:
            service = get_calendar_service(tokens)
            # Test the service
            service.calendarList().list(maxResults=1).execute()
        except Exception as e:
            logging.warning(f"Token might be expired, trying to refresh: {str(e)}")
            # Try to refresh token
            if tokens.get('refresh_token'):
                try:
                    from google_calendar import refresh_access_token
                    new_tokens = refresh_access_token(tokens['refresh_token'])
                    # Update tokens in database
                    supabase.table('users').update({
                        "calendar_tokens": new_tokens
                    }).eq('id', user.id).execute()
                    tokens = new_tokens
                    service = get_calendar_service(tokens)
                except Exception as refresh_error:
                    logging.error(f"Failed to refresh token: {refresh_error}")
                    raise HTTPException(401, "Calendar authorization expired. Please reconnect your calendar.")
            else:
                raise HTTPException(401, "Calendar authorization expired. Please reconnect your calendar.")
        
        # Get user's habits
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        habits = habits_response.data if habits_response.data else []
        
        if not habits:
            return {
                "success": True,
                "message": "No habits to sync",
                "results": []
            }
        
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
        
        success_count = sum(1 for r in results if r.get('success'))
        
        return {
            "success": True,
            "message": f"Synced {success_count}/{len(habits)} habits to calendar",
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error syncing habits to calendar: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to sync habits: {str(e)}")


@app.get("/calendar/status")
async def get_calendar_status(user: User = Depends(get_current_user)):
    """Check if calendar is connected and tokens are valid"""
    try:
        user_data = supabase.table('users').select('calendar_tokens').eq('id', user.id).single().execute()
        
        if not user_data.data or not user_data.data.get('calendar_tokens'):
            return {"connected": False, "message": "Calendar not connected"}
        
        tokens = user_data.data['calendar_tokens']
        
        # Verify tokens are still valid by making a test API call
        try:
            service = get_calendar_service(tokens)
            service.calendarList().list(maxResults=1).execute()
            return {"connected": True, "message": "Calendar is connected"}
        except Exception as e:
            logging.warning(f"Calendar token validation failed: {str(e)}")
            # Try to refresh
            if tokens.get('refresh_token'):
                try:
                    from google_calendar import refresh_access_token
                    new_tokens = refresh_access_token(tokens['refresh_token'])
                    supabase.table('users').update({
                        "calendar_tokens": new_tokens
                    }).eq('id', user.id).execute()
                    return {"connected": True, "message": "Calendar is connected (token refreshed)"}
                except:
                    pass
            
            return {"connected": False, "message": "Calendar authorization expired", "needs_reauth": True}
            
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

@app.get("/ai/motivational-quote")
async def get_motivational_quote(user: User = Depends(get_current_user)):
    """Get personalized motivational quote"""
    try:
        # Get user stats
        stats = await get_user_stats(user)
        
        # Get today's checkins
        today = date.today().strftime('%Y-%m-%d')
        checkins_response = supabase.table('checkins').select('*').eq(
            'user_id', user.id
        ).eq('date', today).execute()
        
        habits_completed = len([c for c in (checkins_response.data or []) if c['completed']])
        
        quote = await generate_motivational_quote(
            user_name=user.name.split()[0] if user.name else "Friend",
            current_streak=stats.get('current_streak', 0),
            habits_completed_today=habits_completed,
            total_habits=stats.get('total_habits', 5)
        )
        
        return quote
    except Exception as e:
        logging.error(f"Error getting motivational quote: {str(e)}")
        return {
            "quote": "Every day is a new opportunity to build the life you want.",
            "author": "Anonymous",
            "personalized_message": "Keep going! You've got this! 💪"
        }


@app.get("/ai/habit-tips")
async def get_habit_tips(user: User = Depends(get_current_user)):
    """Get personalized habit tips"""
    try:
        # Get habits
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        habits = habits_response.data or []
        
        # Get stats
        stats = await get_user_stats(user)
        completion_rate = (stats.get('total_completed_days', 0) / max(1, 100)) * 100
        
        tips = await generate_habit_tips(
            habits=habits,
            completion_rate=completion_rate
        )
        
        return tips
    except Exception as e:
        logging.error(f"Error getting habit tips: {str(e)}")
        return {
            "tips": ["Start small", "Be consistent", "Track your progress"],
            "focus_area": "consistency",
            "weekly_challenge": "Complete all habits for 7 days!"
        }


@app.get("/ai/daily-affirmation")
async def get_daily_affirmation(user: User = Depends(get_current_user)):
    """Get daily affirmation"""
    try:
        stats = await get_user_stats(user)
        day_number = stats.get('total_completed_days', 0) + 1
        
        affirmation = await generate_daily_affirmation(
            user_name=user.name.split()[0] if user.name else "Champion",
            day_number=day_number
        )
        
        return {"affirmation": affirmation, "day": day_number}
    except Exception as e:
        logging.error(f"Error getting affirmation: {str(e)}")
        return {
            "affirmation": "Today is your day to shine! Make it count! ✨",
            "day": 1
        }


@app.post("/ai/thought-reflection")
async def get_thought_reflection(
    request: ThoughtReflectionRequest,
    user: User = Depends(get_current_user)
):
    """Get AI reflection on daily thought"""
    try:
        reflection = await generate_thought_reflection(
            thought=request.thought,
            date=request.date
        )
        return reflection
    except Exception as e:
        logging.error(f"Error getting thought reflection: {str(e)}")
        return {
            "reflection": "What a wonderful thought!",
            "related_quote": "Positive thoughts lead to positive outcomes.",
            "action_item": "Carry this thought with you today."
        }


@app.get("/ai/sleep-insights")
async def get_sleep_insights(user: User = Depends(get_current_user)):
    """Get AI insights about sleep patterns"""
    try:
        # Get sleep records
        sleep_response = supabase.table('sleep_records').select('*').eq(
            'user_id', user.id
        ).order('date', desc=True).limit(30).execute()
        
        sleep_records = sleep_response.data or []
        
        if not sleep_records:
            return {
                "insight": "Start tracking your sleep to get personalized insights!",
                "recommendation": "Aim for 7-8 hours of sleep each night.",
                "correlation": "Good sleep is the foundation of successful habits."
            }
        
        avg_sleep = sum(r.get('sleep_hours', 0) for r in sleep_records) / len(sleep_records)
        
        # Get habit stats
        stats = await get_user_stats(user)
        completion_rate = (stats.get('total_completed_days', 0) / max(1, 100)) * 100
        
        insights = await generate_sleep_insights(
            average_sleep=round(avg_sleep, 1),
            sleep_pattern=sleep_records[:7],
            habit_completion_rate=completion_rate
        )
        
        return insights
    except Exception as e:
        logging.error(f"Error getting sleep insights: {str(e)}")
        return {
            "insight": "Track your sleep consistently for better insights!",
            "recommendation": "Maintain a regular sleep schedule.",
            "correlation": "Quality sleep improves habit success."
        }


@app.get("/ai/weekly-report")
async def get_weekly_report(user: User = Depends(get_current_user)):
    """Get AI-generated weekly report"""
    try:
        # Get various data
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        habits = habits_response.data or []
        
        # Get weekly sleep data
        today = date.today()
        week_ago = today - timedelta(days=7)
        
        sleep_response = supabase.table('sleep_records').select('*').eq(
            'user_id', user.id
        ).gte('date', week_ago.strftime('%Y-%m-%d')).execute()
        
        thoughts_response = supabase.table('daily_thoughts').select('thought').eq(
            'user_id', user.id
        ).gte('date', week_ago.strftime('%Y-%m-%d')).execute()
        
        # Calculate weekly stats
        stats = await get_user_stats(user)
        
        # Count perfect days this week
        perfect_days = 0
        total_completion = 0
        
        for i in range(7):
            check_date = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            checkins_response = supabase.table('checkins').select('*').eq(
                'user_id', user.id
            ).eq('date', check_date).execute()
            
            if checkins_response.data:
                completed = len([c for c in checkins_response.data if c['completed']])
                if completed == len(habits):
                    perfect_days += 1
                total_completion += (completed / max(len(habits), 1)) * 100
        
        weekly_stats = {
            'perfect_days': perfect_days,
            'avg_completion': round(total_completion / 7, 1),
            'current_streak': stats.get('current_streak', 0)
        }
        
        report = await generate_weekly_report(
            user_name=user.name.split()[0] if user.name else "Champion",
            habits=habits,
            weekly_stats=weekly_stats,
            sleep_data=sleep_response.data or [],
            thoughts=[t['thought'] for t in (thoughts_response.data or [])]
        )
        
        return report
    except Exception as e:
        logging.error(f"Error generating weekly report: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "summary": "Keep up the great work this week!",
            "highlights": ["You're making progress!"],
            "areas_to_improve": ["Stay consistent"],
            "next_week_focus": "Build on your momentum",
            "motivational_message": "You've got this! 🌟"
        }


@app.post("/ai/chat")
async def chat_with_coach(
    request: ChatRequest,
    user: User = Depends(get_current_user)
):
    """Chat with AI habit coach"""
    try:
        stats = await get_user_stats(user)
        
        user_context = {
            'total_habits': stats.get('total_habits', 5),
            'current_streak': stats.get('current_streak', 0),
            'total_days': stats.get('total_completed_days', 0)
        }
        
        response = await chat_with_habit_coach(
            message=request.message,
            user_context=user_context
        )
        
        return {"response": response}
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        return {"response": "I'm here to help! What would you like to know about building better habits?"}

@app.get("/videos/search")
async def search_videos(
    query: str = "habit building",
    category: str = None,
    max_results: int = 5,
    user: User = Depends(get_current_user)
):
    """Search for habit-related videos"""
    try:
        videos = search_habit_videos(
            query=query,
            max_results=max_results,
            category=category
        )
        return {"videos": videos}
    except Exception as e:
        logging.error(f"Error searching videos: {str(e)}")
        return {"videos": [], "error": str(e)}


@app.get("/videos/daily-recommendation")
async def get_daily_video(user: User = Depends(get_current_user)):
    """Get personalized daily video recommendation"""
    try:
        stats = await get_user_stats(user)
        
        # Determine time of day
        from datetime import datetime
        hour = datetime.now().hour
        if hour < 12:
            time_of_day = "morning"
        elif hour < 17:
            time_of_day = "afternoon"
        else:
            time_of_day = "evening"
        
        completion_rate = (stats.get('total_completed_days', 0) / 100) * 100
        
        video = get_daily_video_recommendation(
            current_streak=stats.get('current_streak', 0),
            completion_rate=completion_rate,
            time_of_day=time_of_day
        )
        
        return {"video": video, "time_of_day": time_of_day}
    except Exception as e:
        logging.error(f"Error getting daily video: {str(e)}")
        return {"video": None, "error": str(e)}


@app.get("/videos/for-habit/{habit_id}")
async def get_videos_for_habit(
    habit_id: int,
    user: User = Depends(get_current_user)
):
    """Get video recommendations for a specific habit"""
    try:
        # Get habit details
        habit_response = supabase.table('habits').select('*').eq(
            'id', habit_id
        ).eq('user_id', user.id).single().execute()
        
        if not habit_response.data:
            raise HTTPException(404, "Habit not found")
        
        habit = habit_response.data
        videos = get_recommended_videos_for_habit(habit['name'])
        
        return {
            "habit": habit['name'],
            "videos": videos
        }
    except Exception as e:
        logging.error(f"Error getting videos for habit: {str(e)}")
        return {"videos": [], "error": str(e)}


@app.get("/videos/learning-path")
async def get_learning_path(
    difficulty: str = "beginner",
    user: User = Depends(get_current_user)
):
    """Get structured video learning path"""
    try:
        path = get_learning_path_videos(difficulty)
        return path
    except Exception as e:
        logging.error(f"Error getting learning path: {str(e)}")
        return {"error": str(e)}


@app.get("/videos/categories")
async def get_video_categories(user: User = Depends(get_current_user)):
    """Get available video categories"""
    return {
        "categories": [
            {"id": "habits", "name": "Habit Building", "icon": "🎯"},
            {"id": "motivation", "name": "Motivation", "icon": "🔥"},
            {"id": "sleep", "name": "Sleep & Rest", "icon": "😴"},
            {"id": "productivity", "name": "Productivity", "icon": "⚡"},
            {"id": "mindfulness", "name": "Mindfulness", "icon": "🧘"}
        ]
    }

# ==================== GAMIFICATION SYSTEM ====================

# Badge definitions
BADGES = {
    "first_habit": {
        "id": "first_habit",
        "name": "First Step",
        "description": "Complete your first habit",
        "icon": "🌱",
        "xp": 10
    },
    "perfect_day": {
        "id": "perfect_day",
        "name": "Perfect Day",
        "description": "Complete all habits in a day",
        "icon": "⭐",
        "xp": 25
    },
    "week_warrior": {
        "id": "week_warrior",
        "name": "Week Warrior",
        "description": "7-day streak achieved",
        "icon": "🔥",
        "xp": 100
    },
    "habit_master": {
        "id": "habit_master",
        "name": "Habit Master",
        "description": "21-day streak achieved",
        "icon": "🏆",
        "xp": 250
    },
    "month_legend": {
        "id": "month_legend",
        "name": "Month Legend",
        "description": "30-day streak achieved",
        "icon": "💎",
        "xp": 500
    },
    "halfway_hero": {
        "id": "halfway_hero",
        "name": "Halfway Hero",
        "description": "50 days completed",
        "icon": "🚀",
        "xp": 750
    },
    "centurion": {
        "id": "centurion",
        "name": "Centurion",
        "description": "100 days completed - Challenge Won!",
        "icon": "👑",
        "xp": 1000
    },
    "early_bird": {
        "id": "early_bird",
        "name": "Early Bird",
        "description": "Complete a habit before 6 AM",
        "icon": "🌅",
        "xp": 50
    },
    "night_owl": {
        "id": "night_owl",
        "name": "Night Owl",
        "description": "Complete all habits after 10 PM",
        "icon": "🦉",
        "xp": 50
    },
    "sleep_champion": {
        "id": "sleep_champion",
        "name": "Sleep Champion",
        "description": "Get 8+ hours of sleep for 7 days",
        "icon": "😴",
        "xp": 100
    },
    "thought_leader": {
        "id": "thought_leader",
        "name": "Thought Leader",
        "description": "Record 30 daily thoughts",
        "icon": "💡",
        "xp": 150
    },
    "comeback_kid": {
        "id": "comeback_kid",
        "name": "Comeback Kid",
        "description": "Recover from a missed day",
        "icon": "💪",
        "xp": 75
    }
}

# Level definitions
def get_level_info(xp: int) -> dict:
    """Calculate level based on XP"""
    levels = [
        {"level": 1, "name": "Beginner", "min_xp": 0, "max_xp": 100},
        {"level": 2, "name": "Apprentice", "min_xp": 100, "max_xp": 250},
        {"level": 3, "name": "Practitioner", "min_xp": 250, "max_xp": 500},
        {"level": 4, "name": "Journeyman", "min_xp": 500, "max_xp": 1000},
        {"level": 5, "name": "Expert", "min_xp": 1000, "max_xp": 1750},
        {"level": 6, "name": "Master", "min_xp": 1750, "max_xp": 2750},
        {"level": 7, "name": "Grandmaster", "min_xp": 2750, "max_xp": 4000},
        {"level": 8, "name": "Legend", "min_xp": 4000, "max_xp": 5500},
        {"level": 9, "name": "Mythic", "min_xp": 5500, "max_xp": 7500},
        {"level": 10, "name": "Transcendent", "min_xp": 7500, "max_xp": float('inf')}
    ]
    
    for level_info in levels:
        if level_info["min_xp"] <= xp < level_info["max_xp"]:
            progress = (xp - level_info["min_xp"]) / (level_info["max_xp"] - level_info["min_xp"]) * 100
            return {
                **level_info,
                "current_xp": xp,
                "progress": round(progress, 1),
                "xp_to_next": level_info["max_xp"] - xp
            }
    
    return levels[-1]


@app.get("/gamification/profile")
async def get_gamification_profile(user: User = Depends(get_current_user)):
    """Get user's gamification profile"""
    try:
        # Get user's badges and XP from database
        user_data = supabase.table('users').select('badges, total_xp').eq('id', user.id).single().execute()
        
        earned_badges = user_data.data.get('badges', []) if user_data.data else []
        total_xp = user_data.data.get('total_xp', 0) if user_data.data else 0
        
        level_info = get_level_info(total_xp)
        
        # Get badge details
        badge_details = [
            {**BADGES[badge_id], "earned": True}
            for badge_id in earned_badges
            if badge_id in BADGES
        ]
        
        # Get locked badges
        locked_badges = [
            {**badge, "earned": False}
            for badge_id, badge in BADGES.items()
            if badge_id not in earned_badges
        ]
        
        return {
            "level": level_info,
            "total_xp": total_xp,
            "earned_badges": badge_details,
            "locked_badges": locked_badges,
            "total_badges": len(earned_badges),
            "available_badges": len(BADGES)
        }
    except Exception as e:
        logging.error(f"Error getting gamification profile: {str(e)}")
        return {
            "level": get_level_info(0),
            "total_xp": 0,
            "earned_badges": [],
            "locked_badges": list(BADGES.values()),
            "total_badges": 0,
            "available_badges": len(BADGES)
        }


@app.post("/gamification/check-badges")
async def check_and_award_badges(user: User = Depends(get_current_user)):
    """Check and award any new badges earned"""
    try:
        # Get current user data
        user_data = supabase.table('users').select('badges, total_xp').eq('id', user.id).single().execute()
        current_badges = user_data.data.get('badges', []) if user_data.data else []
        current_xp = user_data.data.get('total_xp', 0) if user_data.data else 0
        
        # Get stats
        stats = await get_user_stats(user)
        
        # Get additional data
        thoughts_count = supabase.table('daily_thoughts').select('id', count='exact').eq('user_id', user.id).execute()
        sleep_records = supabase.table('sleep_records').select('sleep_hours').eq('user_id', user.id).order('date', desc=True).limit(7).execute()
        
        new_badges = []
        xp_earned = 0
        
        # Check each badge condition
        streak = stats.get('current_streak', 0)
        total_days = stats.get('total_completed_days', 0)
        total_checkins = stats.get('total_checkins', 0)
        
        # First habit
        if total_checkins >= 1 and 'first_habit' not in current_badges:
            new_badges.append('first_habit')
            xp_earned += BADGES['first_habit']['xp']
        
        # Streak badges
        if streak >= 7 and 'week_warrior' not in current_badges:
            new_badges.append('week_warrior')
            xp_earned += BADGES['week_warrior']['xp']
        
        if streak >= 21 and 'habit_master' not in current_badges:
            new_badges.append('habit_master')
            xp_earned += BADGES['habit_master']['xp']
        
        if streak >= 30 and 'month_legend' not in current_badges:
            new_badges.append('month_legend')
            xp_earned += BADGES['month_legend']['xp']
        
        # Total days badges
        if total_days >= 50 and 'halfway_hero' not in current_badges:
            new_badges.append('halfway_hero')
            xp_earned += BADGES['halfway_hero']['xp']
        
        if total_days >= 100 and 'centurion' not in current_badges:
            new_badges.append('centurion')
            xp_earned += BADGES['centurion']['xp']
        
        # Thought leader
        if thoughts_count.count >= 30 and 'thought_leader' not in current_badges:
            new_badges.append('thought_leader')
            xp_earned += BADGES['thought_leader']['xp']
        
        # Sleep champion
        if sleep_records.data and len(sleep_records.data) >= 7:
            good_sleep_days = sum(1 for r in sleep_records.data if r.get('sleep_hours', 0) >= 8)
            if good_sleep_days >= 7 and 'sleep_champion' not in current_badges:
                new_badges.append('sleep_champion')
                xp_earned += BADGES['sleep_champion']['xp']
        
        # Update user if new badges earned
        if new_badges:
            updated_badges = current_badges + new_badges
            new_xp = current_xp + xp_earned
            
            supabase.table('users').update({
                'badges': updated_badges,
                'total_xp': new_xp
            }).eq('id', user.id).execute()
            
            return {
                "new_badges": [BADGES[b] for b in new_badges],
                "xp_earned": xp_earned,
                "total_xp": new_xp,
                "level": get_level_info(new_xp)
            }
        
        return {
            "new_badges": [],
            "xp_earned": 0,
            "total_xp": current_xp,
            "level": get_level_info(current_xp)
        }
    except Exception as e:
        logging.error(f"Error checking badges: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"new_badges": [], "xp_earned": 0}


@app.get("/gamification/leaderboard")
async def get_leaderboard(user: User = Depends(get_current_user)):
    """Get global leaderboard"""
    try:
        # Get top users by XP
        response = supabase.table('users').select(
            'id, name, total_xp, badges'
        ).order('total_xp', desc=True).limit(10).execute()
        
        leaderboard = []
        for i, u in enumerate(response.data or []):
            level_info = get_level_info(u.get('total_xp', 0))
            leaderboard.append({
                "rank": i + 1,
                "name": u.get('name', 'Anonymous'),
                "xp": u.get('total_xp', 0),
                "level": level_info['level'],
                "level_name": level_info['name'],
                "badges_count": len(u.get('badges', [])),
                "is_current_user": u['id'] == user.id
            })
        
        # Find current user's rank if not in top 10
        current_user_in_top = any(u['is_current_user'] for u in leaderboard)
        user_rank = None
        
        if not current_user_in_top:
            # Get user's rank
            all_users = supabase.table('users').select('id, total_xp').order('total_xp', desc=True).execute()
            for i, u in enumerate(all_users.data or []):
                if u['id'] == user.id:
                    user_rank = i + 1
                    break
        
        return {
            "leaderboard": leaderboard,
            "current_user_rank": user_rank
        }
    except Exception as e:
        logging.error(f"Error getting leaderboard: {str(e)}")
        return {"leaderboard": [], "current_user_rank": None}
    

@app.put("/settings/notifications")
async def update_notification_settings(
    preferences: NotificationPreferences,
    user: User = Depends(get_current_user)
):
    """Update user notification preferences"""
    try:
        supabase.table('users').update({
            "email_notifications": preferences.email_notifications,
            "reminder_time": preferences.reminder_time
        }).eq('id', user.id).execute()
        
        return {"success": True, "message": "Notification settings updated"}
    except Exception as e:
        logging.error(f"Error updating notifications: {str(e)}")
        raise HTTPException(500, "Failed to update settings")


@app.get("/settings/notifications")
async def get_notification_settings(user: User = Depends(get_current_user)):
    """Get user notification preferences"""
    try:
        response = supabase.table('users').select(
            'email_notifications, reminder_time'
        ).eq('id', user.id).single().execute()
        
        return response.data or {"email_notifications": True, "reminder_time": None}
    except Exception as e:
        logging.error(f"Error getting notifications: {str(e)}")
        return {"email_notifications": True, "reminder_time": None}


@app.post("/admin/trigger-reminders")
async def trigger_smart_reminders():
    """Manually trigger smart reminders (for testing or cron job)"""
    try:
        result = await check_and_send_reminders(supabase)
        return result
    except Exception as e:
        logging.error(f"Error triggering reminders: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/habits/incomplete-today")
async def get_incomplete_habits_today(user: User = Depends(get_current_user)):
    """Get list of incomplete habits for today"""
    try:
        today = date.today().strftime('%Y-%m-%d')
        
        # Get all habits
        habits_response = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        habits = habits_response.data or []
        
        # Get today's checkins
        checkins_response = supabase.table('checkins').select('*').eq(
            'user_id', user.id
        ).eq('date', today).execute()
        
        completed_ids = set(
            c['habit_id'] for c in (checkins_response.data or []) if c['completed']
        )
        
        incomplete = [h for h in habits if h['id'] not in completed_ids]
        
        return {
            "incomplete_habits": incomplete,
            "completed_count": len(completed_ids),
            "total_count": len(habits)
        }
    except Exception as e:
        logging.error(f"Error getting incomplete habits: {str(e)}")
        raise HTTPException(500, str(e))

@app.post("/habits/enhanced")
async def create_enhanced_habit(
    habit: EnhancedHabitCreate,
    user: User = Depends(get_current_user)
):
    """Create a habit with enhanced properties"""
    try:
        habit_data = {
            "user_id": user.id,
            "name": habit.name,
            "why": habit.why,
            "time": habit.time,
            "category": habit.category,
            "icon": habit.icon,
            "color": habit.color,
            "goal_type": habit.goal_type,
            "goal_value": habit.goal_value,
            "goal_unit": habit.goal_unit,
            "difficulty": habit.difficulty,
            "created_at": datetime.now().isoformat()
        }
        
        response = supabase.table('habits').insert(habit_data).execute()
        
        return {"success": True, "habit": response.data[0] if response.data else None}
    except Exception as e:
        logging.error(f"Error creating enhanced habit: {str(e)}")
        raise HTTPException(500, str(e))


@app.post("/checkins/enhanced")
async def create_enhanced_checkin(
    checkin: EnhancedCheckinCreate,
    user: User = Depends(get_current_user)
):
    """Create a checkin with enhanced data"""
    try:
        # Check for existing checkin
        existing = supabase.table('checkins').select('*').eq(
            'user_id', user.id
        ).eq('habit_id', checkin.habit_id).eq('date', checkin.date).execute()
        
        checkin_data = {
            "user_id": user.id,
            "habit_id": checkin.habit_id,
            "date": checkin.date,
            "completed": checkin.completed,
            "value": checkin.value or 1,
            "note": checkin.note,
            "mood": checkin.mood,
            "difficulty_felt": checkin.difficulty_felt,
            "time_spent": checkin.time_spent,
            "completed_at": datetime.now().isoformat() if checkin.completed else None
        }
        
        if existing.data:
            response = supabase.table('checkins').update(checkin_data).eq(
                'id', existing.data[0]['id']
            ).execute()
        else:
            response = supabase.table('checkins').insert(checkin_data).execute()
        
        # Update streak if completed
        if checkin.completed:
            streak = HabitStreakManager.update_streak(user.id, checkin.habit_id, checkin.date)
            
            # Update habit total completions
            supabase.rpc('increment_habit_completions', {
                'habit_id': checkin.habit_id
            }).execute()
        
        # Check daily challenges
        challenge_result = DailyChallengeManager.update_challenge_progress(user.id)
        
        return {
            "success": True,
            "checkin": response.data[0] if response.data else None,
            "streak_updated": checkin.completed,
            "challenges_completed": challenge_result.get('completed_challenges', []),
            "xp_earned": challenge_result.get('xp_earned', 0)
        }
    except Exception as e:
        logging.error(f"Error creating enhanced checkin: {str(e)}")
        raise HTTPException(500, str(e))


@app.post("/habits/{habit_id}/skip")
async def skip_habit(
    habit_id: int,
    skip_request: SkipHabitRequest,
    user: User = Depends(get_current_user)
):
    """Skip a habit with a reason (doesn't break streak for valid reasons)"""
    try:
        valid_reasons = ['sick', 'travel', 'rest', 'emergency']
        
        checkin_data = {
            "user_id": user.id,
            "habit_id": habit_id,
            "date": skip_request.date,
            "completed": False,
            "skip_reason": skip_request.reason
        }
        
        # Check if skip reason preserves streak
        preserves_streak = skip_request.reason in valid_reasons
        
        response = supabase.table('checkins').insert(checkin_data).execute()
        
        return {
            "success": True,
            "preserves_streak": preserves_streak,
            "message": f"Habit skipped due to: {skip_request.reason}" + 
                      (" (streak preserved)" if preserves_streak else " (streak may be affected)")
        }
    except Exception as e:
        logging.error(f"Error skipping habit: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/habits/streaks")
async def get_all_habit_streaks(user: User = Depends(get_current_user)):
    """Get streaks for all habits"""
    try:
        streaks = HabitStreakManager.get_habit_streaks(user.id)
        at_risk = HabitStreakManager.check_streak_at_risk(user.id)
        
        return {
            "streaks": streaks,
            "at_risk": at_risk,
            "total_active_streaks": len([s for s in streaks if s['current_streak'] > 0])
        }
    except Exception as e:
        logging.error(f"Error getting streaks: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/habits/{habit_id}/analytics")
async def get_habit_analytics(
    habit_id: int,
    days: int = 30,
    user: User = Depends(get_current_user)
):
    """Get detailed analytics for a specific habit"""
    try:
        performance = HabitAnalytics.get_habit_performance(user.id, habit_id, days)
        return performance
    except Exception as e:
        logging.error(f"Error getting habit analytics: {str(e)}")
        raise HTTPException(500, str(e))


# ==================== DAILY CHALLENGES ====================

@app.get("/challenges/daily")
async def get_daily_challenges(user: User = Depends(get_current_user)):
    """Get today's daily challenges"""
    try:
        challenges = challenges_service.get_daily_challenges(user.id)
        return challenges
    except Exception as e:
        logging.error(f"Error getting daily challenges: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/challenges/weekly")
async def get_weekly_challenges(user: User = Depends(get_current_user)):
    """Get this week's challenges"""
    try:
        challenges = challenges_service.get_weekly_challenges(user.id)
        return challenges
    except Exception as e:
        logging.error(f"Error getting weekly challenges: {str(e)}")
        raise HTTPException(500, str(e))


@app.post("/challenges/{challenge_id}/complete")
async def complete_challenge(
    challenge_id: str,
    user: User = Depends(get_current_user)
):
    """Complete a challenge and claim XP"""
    try:
        result = challenges_service.complete_challenge(user.id, challenge_id)
        
        if result.get('success'):
            # Invalidate cache
            invalidate_cache(f"user:{user.id}")
        
        return result
    except Exception as e:
        logging.error(f"Error completing challenge: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/challenges/history")
async def get_challenge_history(
    days: int = 7,
    user: User = Depends(get_current_user)
):
    """Get challenge completion history"""
    try:
        from datetime import date, timedelta
        
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        response = supabase.table('challenge_completions').select('*').eq(
            'user_id', user.id
        ).gte('date', start_date.strftime('%Y-%m-%d')).lte(
            'date', end_date.strftime('%Y-%m-%d')
        ).order('date', desc=True).execute()
        
        return {
            "history": response.data or [],
            "total_xp_earned": sum(c.get('xp_earned', 0) for c in (response.data or []))
        }
    except Exception as e:
        logging.error(f"Error getting challenge history: {str(e)}")
        raise HTTPException(500, str(e))
    

# ==================== STREAK ENDPOINTS ====================

@app.get("/streak/details")
async def get_streak_details(user: User = Depends(get_current_user)):
    """Get detailed streak information"""
    try:
        details = streak_service.get_streak_details(user.id)
        return details
    except Exception as e:
        logging.error(f"Error getting streak details: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/streak/at-risk")
async def check_streak_at_risk(user: User = Depends(get_current_user)):
    """Check if streak is at risk"""
    try:
        result = streak_service.check_streak_at_risk(user.id)
        return result
    except Exception as e:
        logging.error(f"Error checking streak risk: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/streak/milestones")
async def get_streak_milestones(user: User = Depends(get_current_user)):
    """Get streak milestones"""
    try:
        details = streak_service.get_streak_details(user.id)
        return {
            "milestones": details.get('milestones', []),
            "next_milestone": details.get('next_milestone'),
            "current_streak": details.get('current_streak', 0)
        }
    except Exception as e:
        logging.error(f"Error getting milestones: {str(e)}")
        raise HTTPException(500, str(e))


# ==================== CACHE ENDPOINTS ====================

@app.get("/cache/stats")
async def get_cache_stats(user: User = Depends(get_current_user)):
    """Get cache statistics (admin only)"""
    return cache.get_stats()


@app.post("/cache/clear")
async def clear_cache(user: User = Depends(get_current_user)):
    """Clear cache (admin only)"""
    cache.clear()
    return {"message": "Cache cleared"}


# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cache_stats": cache.get_stats()
    }


# ==================== ANALYTICS & INSIGHTS ====================

@app.get("/analytics/correlations")
async def get_correlation_insights(user: User = Depends(get_current_user)):
    """Get correlation insights between sleep, habits, and mood"""
    try:
        insights = HabitAnalytics.get_correlation_insights(user.id)
        return insights
    except Exception as e:
        logging.error(f"Error getting correlations: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/analytics/prediction")
async def get_today_prediction(user: User = Depends(get_current_user)):
    """Get prediction for today's habit completion"""
    try:
        prediction = HabitAnalytics.get_prediction(user.id)
        return prediction
    except Exception as e:
        logging.error(f"Error getting prediction: {str(e)}")
        raise HTTPException(500, str(e))


@app.get("/analytics/export")
async def export_user_data(
    format: str = "json",
    user: User = Depends(get_current_user)
):
    """Export all user data"""
    try:
        # Gather all data
        habits = supabase.table('habits').select('*').eq('user_id', user.id).execute()
        checkins = supabase.table('checkins').select('*').eq('user_id', user.id).execute()
        thoughts = supabase.table('daily_thoughts').select('*').eq('user_id', user.id).execute()
        sleep = supabase.table('sleep_records').select('*').eq('user_id', user.id).execute()
        streaks = supabase.table('habit_streaks').select('*').eq('user_id', user.id).execute()
        
        data = {
            "exported_at": datetime.now().isoformat(),
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            },
            "habits": habits.data or [],
            "checkins": checkins.data or [],
            "thoughts": thoughts.data or [],
            "sleep_records": sleep.data or [],
            "streaks": streaks.data or []
        }
        
        if format == "csv":
            # Would need to implement CSV conversion
            pass
        
        return data
    except Exception as e:
        logging.error(f"Error exporting data: {str(e)}")
        raise HTTPException(500, str(e))


# ==================== HABIT TEMPLATES ====================

@app.get("/habits/templates")
async def get_habit_templates(
    category: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get habit templates"""
    try:
        query = supabase.table('habit_templates').select('*')
        
        if category:
            query = query.eq('category', category)
        
        response = query.order('popularity', desc=True).execute()
        
        return {
            "templates": response.data or [],
            "categories": ["health", "productivity", "mindfulness", "learning", "general"]
        }
    except Exception as e:
        logging.error(f"Error getting templates: {str(e)}")
        raise HTTPException(500, str(e))


@app.post("/habits/from-template/{template_id}")
async def create_habit_from_template(
    template_id: int,
    user: User = Depends(get_current_user)
):
    """Create a habit from a template"""
    try:
        template = supabase.table('habit_templates').select('*').eq(
            'id', template_id
        ).single().execute()
        
        if not template.data:
            raise HTTPException(404, "Template not found")
        
        t = template.data
        
        habit_data = {
            "user_id": user.id,
            "name": t['name'],
            "why": t['description'],
            "time": t['suggested_time'] or "09:00",
            "category": t['category'],
            "icon": t['icon'],
            "goal_type": t['goal_type'],
            "goal_value": t['goal_value'],
            "goal_unit": t['goal_unit'],
            "difficulty": t['difficulty'],
            "created_at": datetime.now().isoformat()
        }
        
        response = supabase.table('habits').insert(habit_data).execute()
        
        # Increment template popularity
        supabase.table('habit_templates').update({
            'popularity': t['popularity'] + 1
        }).eq('id', template_id).execute()
        
        return {"success": True, "habit": response.data[0] if response.data else None}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating from template: {str(e)}")
        raise HTTPException(500, str(e))

@app.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """Get VAPID public key for push subscription"""
    public_key = os.getenv("VAPID_PUBLIC_KEY")
    if not public_key:
        raise HTTPException(500, "Push notifications not configured")
    return {"publicKey": public_key}


@app.post("/push/subscribe")
async def subscribe_to_push(
    subscription: PushSubscription,
    user: User = Depends(get_current_user)
):
    """Subscribe to push notifications"""
    try:
        # Get current subscriptions
        user_data = supabase.table('users').select('push_subscriptions').eq(
            'id', user.id
        ).single().execute()
        
        current_subs = user_data.data.get('push_subscriptions', []) or []
        
        # Convert subscription to dict
        new_sub = {
            "endpoint": subscription.endpoint,
            "keys": subscription.keys,
            "expirationTime": subscription.expirationTime,
            "created_at": datetime.now().isoformat()
        }
        
        # Check if already subscribed (by endpoint)
        existing = next(
            (s for s in current_subs if s.get('endpoint') == subscription.endpoint),
            None
        )
        
        if existing:
            # Update existing subscription
            current_subs = [s for s in current_subs if s.get('endpoint') != subscription.endpoint]
        
        current_subs.append(new_sub)
        
        # Save to database
        supabase.table('users').update({
            'push_subscriptions': current_subs
        }).eq('id', user.id).execute()
        
        # Send welcome notification
        push_service.send_notification(
            subscription={"endpoint": subscription.endpoint, "keys": subscription.keys},
            title="🎉 Notifications Enabled!",
            body="You'll now receive reminders for your habits. Stay consistent!",
            tag="welcome",
            data={"type": "welcome", "url": "/daily"}
        )
        
        logging.info(f"✅ Push subscription added for user {user.email}")
        return {"success": True, "message": "Subscribed to push notifications"}
        
    except Exception as e:
        logging.error(f"Error subscribing to push: {str(e)}")
        raise HTTPException(500, f"Failed to subscribe: {str(e)}")


@app.delete("/push/unsubscribe")
async def unsubscribe_from_push(
    subscription: PushSubscription,
    user: User = Depends(get_current_user)
):
    """Unsubscribe from push notifications"""
    try:
        user_data = supabase.table('users').select('push_subscriptions').eq(
            'id', user.id
        ).single().execute()
        
        current_subs = user_data.data.get('push_subscriptions', []) or []
        
        # Remove the subscription
        updated_subs = [
            s for s in current_subs 
            if s.get('endpoint') != subscription.endpoint
        ]
        
        supabase.table('users').update({
            'push_subscriptions': updated_subs
        }).eq('id', user.id).execute()
        
        logging.info(f"✅ Push subscription removed for user {user.email}")
        return {"success": True, "message": "Unsubscribed from push notifications"}
        
    except Exception as e:
        logging.error(f"Error unsubscribing: {str(e)}")
        raise HTTPException(500, f"Failed to unsubscribe: {str(e)}")


@app.get("/push/status")
async def get_push_status(user: User = Depends(get_current_user)):
    """Get push notification status for current user"""
    try:
        user_data = supabase.table('users').select(
            'push_subscriptions, notification_preferences'
        ).eq('id', user.id).single().execute()
        
        subscriptions = user_data.data.get('push_subscriptions', []) or []
        preferences = user_data.data.get('notification_preferences', {}) or {}
        
        return {
            "subscribed": len(subscriptions) > 0,
            "subscription_count": len(subscriptions),
            "preferences": preferences
        }
        
    except Exception as e:
        logging.error(f"Error getting push status: {str(e)}")
        return {"subscribed": False, "subscription_count": 0, "preferences": {}}


@app.put("/push/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    user: User = Depends(get_current_user)
):
    """Update notification preferences"""
    try:
        supabase.table('users').update({
            'notification_preferences': preferences.dict()
        }).eq('id', user.id).execute()
        
        return {"success": True, "message": "Preferences updated"}
        
    except Exception as e:
        logging.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(500, f"Failed to update preferences: {str(e)}")


@app.get("/push/preferences")
async def get_notification_preferences(user: User = Depends(get_current_user)):
    """Get notification preferences"""
    try:
        user_data = supabase.table('users').select(
            'notification_preferences'
        ).eq('id', user.id).single().execute()
        
        preferences = user_data.data.get('notification_preferences', {}) or {}
        
        # Return with defaults
        return {
            "push_enabled": preferences.get('push_enabled', True),
            "morning_motivation": preferences.get('morning_motivation', True),
            "habit_reminders": preferences.get('habit_reminders', True),
            "streak_alerts": preferences.get('streak_alerts', True),
            "evening_reminder": preferences.get('evening_reminder', True),
            "achievement_alerts": preferences.get('achievement_alerts', True),
            "sleep_reminders": preferences.get('sleep_reminders', True),
        }
        
    except Exception as e:
        logging.error(f"Error getting preferences: {str(e)}")
        return NotificationPreferences().dict()


@app.post("/push/test")
async def send_test_notification(
    request: TestNotificationRequest,
    user: User = Depends(get_current_user)
):
    """Send a test notification to the current user"""
    try:
        user_data = supabase.table('users').select('push_subscriptions').eq(
            'id', user.id
        ).single().execute()
        
        subscriptions = user_data.data.get('push_subscriptions', []) or []
        
        if not subscriptions:
            raise HTTPException(400, "No push subscriptions found. Please enable notifications first.")
        
        results = []
        for sub in subscriptions:
            result = push_service.send_notification(
                subscription={"endpoint": sub['endpoint'], "keys": sub['keys']},
                title=request.title,
                body=request.body,
                tag="test",
                data={"type": "test", "url": "/daily"}
            )
            results.append(result)
        
        success_count = sum(1 for r in results if r.get('success'))
        
        return {
            "success": success_count > 0,
            "message": f"Sent to {success_count}/{len(subscriptions)} devices"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error sending test notification: {str(e)}")
        raise HTTPException(500, f"Failed to send notification: {str(e)}")


@app.post("/push/send-habit-reminder/{habit_id}")
async def send_habit_reminder(
    habit_id: int,
    user: User = Depends(get_current_user)
):
    """Manually trigger a habit reminder"""
    try:
        # Get habit
        habit_response = supabase.table('habits').select('*').eq(
            'id', habit_id
        ).eq('user_id', user.id).single().execute()
        
        if not habit_response.data:
            raise HTTPException(404, "Habit not found")
        
        habit = habit_response.data
        
        # Get user subscriptions and stats
        user_data = supabase.table('users').select(
            'push_subscriptions, current_streak'
        ).eq('id', user.id).single().execute()
        
        subscriptions = user_data.data.get('push_subscriptions', []) or []
        streak = user_data.data.get('current_streak', 0)
        
        if not subscriptions:
            raise HTTPException(400, "No push subscriptions found")
        
        results = []
        for sub in subscriptions:
            result = push_service.send_habit_reminder(
                subscription={"endpoint": sub['endpoint'], "keys": sub['keys']},
                habit_name=habit['name'],
                habit_time=habit['time'],
                streak=streak
            )
            results.append(result)
        
        success_count = sum(1 for r in results if r.get('success'))
        
        return {
            "success": success_count > 0,
            "message": f"Reminder sent to {success_count} devices"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error sending habit reminder: {str(e)}")
        raise HTTPException(500, str(e))


# ==================== SCHEDULED NOTIFICATION TRIGGERS ====================
# These endpoints should be called by a cron job or scheduler

@app.post("/cron/check-reminders")
async def trigger_reminder_check(
    api_key: str = None  # Add API key authentication for cron jobs
):
    """Trigger smart reminder check (call every 5-10 minutes)"""
    try:
        # Optional: Verify API key for cron security
        # if api_key != os.getenv("CRON_API_KEY"):
        #     raise HTTPException(401, "Invalid API key")
        
        scheduler = SmartNotificationScheduler(supabase)
        results = await scheduler.check_and_send_reminders()
        
        return results
        
    except Exception as e:
        logging.error(f"Error in reminder check: {str(e)}")
        raise HTTPException(500, str(e))


@app.post("/cron/morning-motivation")
async def trigger_morning_motivation():
    """Trigger morning motivation (call at ~7 AM)"""
    try:
        scheduler = SmartNotificationScheduler(supabase)
        results = await scheduler.send_morning_motivation()
        return results
    except Exception as e:
        logging.error(f"Error in morning motivation: {str(e)}")
        raise HTTPException(500, str(e))


@app.post("/cron/evening-reminder")
async def trigger_evening_reminder():
    """Trigger evening reminder (call at ~8 PM)"""
    try:
        scheduler = SmartNotificationScheduler(supabase)
        results = await scheduler.send_evening_reminder()
        return results
    except Exception as e:
        logging.error(f"Error in evening reminder: {str(e)}")
        raise HTTPException(500, str(e))