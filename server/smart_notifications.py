# server/smart_notifications.py
import os
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

logging.basicConfig(level=logging.INFO)

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_reminder_email(to_email: str, user_name: str, incomplete_habits: List[Dict]) -> bool:
    """Send reminder email for incomplete habits"""
    try:
        if not SMTP_EMAIL or not SMTP_PASSWORD:
            logging.warning("Email not configured, skipping reminder")
            return False
        
        habit_list = "\n".join([f"• {h['name']} (scheduled: {h['time']})" for h in incomplete_habits])
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 15px; text-align: center;">
                <h1 style="color: white; margin: 0;">🎯 Sankalp Reminder</h1>
            </div>
            
            <div style="padding: 30px; background: #1e293b; border-radius: 0 0 15px 15px; color: white;">
                <h2 style="color: #f97316;">Hey {user_name}! 👋</h2>
                
                <p style="font-size: 16px; line-height: 1.6;">
                    We noticed you haven't completed some habits today. Don't break your streak!
                </p>
                
                <div style="background: #334155; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #fbbf24; margin-top: 0;">⏰ Incomplete Habits:</h3>
                    <pre style="color: #e2e8f0; font-family: Arial; white-space: pre-wrap;">{habit_list}</pre>
                </div>
                
                <p style="font-size: 14px; color: #94a3b8;">
                    Remember: Consistency is key! Even a small effort counts.
                </p>
                
                <a href="http://localhost:5173/daily" 
                   style="display: inline-block; background: #f97316; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px;">
                    ✅ Complete Your Habits Now
                </a>
            </div>
            
            <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 20px;">
                You're receiving this because you have pending habits. 
                <a href="http://localhost:5173/settings">Manage notifications</a>
            </p>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"🎯 {user_name}, you have {len(incomplete_habits)} habits waiting!"
        msg['From'] = f"Sankalp <{SMTP_EMAIL}>"
        msg['To'] = to_email
        
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        logging.info(f"✅ Reminder email sent to {to_email}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to send reminder email: {str(e)}")
        return False


async def check_and_send_reminders(supabase) -> Dict[str, Any]:
    """Check all users and send reminders for incomplete habits"""
    try:
        today = date.today().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M')
        
        # Get all users with notification preferences
        users_response = supabase.table('users').select('*').execute()
        users = users_response.data or []
        
        reminders_sent = 0
        
        for user in users:
            # Check if user wants notifications
            if not user.get('email_notifications', True):
                continue
            
            # Get user's habits
            habits_response = supabase.table('habits').select('*').eq('user_id', user['id']).execute()
            habits = habits_response.data or []
            
            if not habits:
                continue
            
            # Get today's checkins
            checkins_response = supabase.table('checkins').select('*').eq(
                'user_id', user['id']
            ).eq('date', today).execute()
            
            completed_habit_ids = set(
                c['habit_id'] for c in (checkins_response.data or []) if c['completed']
            )
            
            # Find incomplete habits whose time has passed
            incomplete_habits = []
            for habit in habits:
                if habit['id'] not in completed_habit_ids:
                    habit_time = habit.get('time', '09:00')
                    # Check if habit time has passed (with 30 min buffer)
                    if is_time_passed(habit_time, buffer_minutes=30):
                        incomplete_habits.append(habit)
            
            # Send reminder if there are incomplete habits
            if incomplete_habits:
                # Check if we already sent a reminder today
                reminder_key = f"reminder_{user['id']}_{today}"
                last_reminder = supabase.table('notifications').select('*').eq(
                    'key', reminder_key
                ).execute()
                
                if not last_reminder.data:
                    success = send_reminder_email(
                        to_email=user['email'],
                        user_name=user.get('name', 'Champion'),
                        incomplete_habits=incomplete_habits
                    )
                    
                    if success:
                        # Record that we sent a reminder
                        supabase.table('notifications').insert({
                            'key': reminder_key,
                            'user_id': user['id'],
                            'type': 'habit_reminder',
                            'sent_at': datetime.now().isoformat()
                        }).execute()
                        reminders_sent += 1
        
        return {
            "success": True,
            "reminders_sent": reminders_sent,
            "checked_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error in check_and_send_reminders: {str(e)}")
        return {"success": False, "error": str(e)}


def is_time_passed(time_str: str, buffer_minutes: int = 0) -> bool:
    """Check if a given time has passed today"""
    try:
        now = datetime.now()
        hour, minute = map(int, time_str.split(':'))
        target_time = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        target_time += timedelta(minutes=buffer_minutes)
        return now > target_time
    except:
        return False