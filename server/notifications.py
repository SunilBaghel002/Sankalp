# server/notifications.py
import os
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import supabase

load_dotenv()

logging.basicConfig(level=logging.INFO)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
APP_URL = os.getenv("APP_URL", "http://localhost:5173")


class NotificationManager:
    """Manage all types of notifications"""
    
    NOTIFICATION_TYPES = {
        'streak_at_risk': {
            'title': '🔥 Streak at Risk!',
            'priority': 'high'
        },
        'habit_reminder': {
            'title': '⏰ Habit Reminder',
            'priority': 'medium'
        },
        'daily_digest': {
            'title': '📊 Your Daily Summary',
            'priority': 'low'
        },
        'achievement': {
            'title': '🏆 Achievement Unlocked!',
            'priority': 'medium'
        },
        'weekly_report': {
            'title': '📈 Your Weekly Report',
            'priority': 'low'
        },
        'friend_activity': {
            'title': '👥 Friend Activity',
            'priority': 'low'
        }
    }
    
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """Send email notification"""
        try:
            if not SMTP_EMAIL or not SMTP_PASSWORD:
                logging.warning("Email not configured")
                return False
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"Sankalp <{SMTP_EMAIL}>"
            msg['To'] = to_email
            
            msg.attach(MIMEText(html_content, 'html'))
            
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            logging.error(f"Email send error: {str(e)}")
            return False
    
    @staticmethod
    def create_in_app_notification(
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        action_url: Optional[str] = None,
        data: Optional[Dict] = None
    ):
        """Create in-app notification"""
        try:
            supabase.table('notifications').insert({
                'user_id': user_id,
                'type': notification_type,
                'title': title,
                'message': message,
                'action_url': action_url,
                'data': data or {},
                'read': False,
                'created_at': datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logging.error(f"Error creating notification: {str(e)}")
    
    @staticmethod
    def get_user_notifications(user_id: int, unread_only: bool = False) -> List[Dict]:
        """Get user's notifications"""
        try:
            query = supabase.table('notifications').select('*').eq('user_id', user_id)
            
            if unread_only:
                query = query.eq('read', False)
            
            response = query.order('created_at', desc=True).limit(50).execute()
            return response.data or []
        except Exception as e:
            logging.error(f"Error getting notifications: {str(e)}")
            return []
    
    @staticmethod
    def mark_as_read(notification_id: int, user_id: int):
        """Mark notification as read"""
        try:
            supabase.table('notifications').update({
                'read': True,
                'read_at': datetime.now().isoformat()
            }).eq('id', notification_id).eq('user_id', user_id).execute()
        except Exception as e:
            logging.error(f"Error marking as read: {str(e)}")


class SmartReminderService:
    """Smart reminders that adapt to user behavior"""
    
    @staticmethod
    def should_send_reminder(user_id: int, habit_id: int) -> Dict[str, Any]:
        """Determine if reminder should be sent based on user patterns"""
        try:
            today = date.today().strftime('%Y-%m-%d')
            now = datetime.now()
            
            # Check if already completed today
            checkin = supabase.table('checkins').select('*').eq(
                'habit_id', habit_id
            ).eq('date', today).eq('completed', True).execute()
            
            if checkin.data:
                return {'send': False, 'reason': 'already_completed'}
            
            # Get habit details
            habit = supabase.table('habits').select('*').eq('id', habit_id).single().execute()
            if not habit.data:
                return {'send': False, 'reason': 'habit_not_found'}
            
            habit_time = habit.data.get('time', '09:00')
            habit_hour, habit_minute = map(int, habit_time.split(':'))
            
            # Check if it's past the habit time
            if now.hour < habit_hour or (now.hour == habit_hour and now.minute < habit_minute):
                return {'send': False, 'reason': 'not_yet_time'}
            
            # Check if user is active (logged in recently)
            activity = supabase.table('activity_log').select('*').eq(
                'user_id', user_id
            ).gte('created_at', (now - timedelta(hours=2)).isoformat()).execute()
            
            if activity.data and len(activity.data) > 0:
                # User is active but hasn't completed - they might be working on it
                return {'send': False, 'reason': 'user_active'}
            
            # Check streak
            streak = supabase.table('habit_streaks').select('*').eq('habit_id', habit_id).execute()
            has_streak = streak.data and streak.data[0].get('current_streak', 0) > 0
            
            return {
                'send': True,
                'priority': 'high' if has_streak else 'medium',
                'message': f"Don't break your {streak.data[0]['current_streak']}-day streak!" if has_streak else f"Time for: {habit.data['name']}",
                'habit_name': habit.data['name']
            }
            
        except Exception as e:
            logging.error(f"Error checking reminder: {str(e)}")
            return {'send': False, 'reason': 'error'}
    
    @staticmethod
    async def send_smart_reminders():
        """Send reminders to all users who need them"""
        try:
            # Get all users with enabled notifications
            users = supabase.table('users').select('*').eq(
                'email_notifications', True
            ).execute()
            
            reminders_sent = 0
            
            for user in (users.data or []):
                # Get user's habits
                habits = supabase.table('habits').select('*').eq(
                    'user_id', user['id']
                ).execute()
                
                pending_habits = []
                
                for habit in (habits.data or []):
                    check = SmartReminderService.should_send_reminder(user['id'], habit['id'])
                    if check.get('send'):
                        pending_habits.append({
                            'name': check.get('habit_name', habit['name']),
                            'message': check.get('message'),
                            'priority': check.get('priority')
                        })
                
                if pending_habits:
                    # Check if we already sent a reminder today
                    today = date.today().strftime('%Y-%m-%d')
                    existing = supabase.table('notification_log').select('*').eq(
                        'user_id', user['id']
                    ).eq('date', today).eq('type', 'smart_reminder').execute()
                    
                    if not existing.data:
                        # Send email
                        SmartReminderService._send_reminder_email(
                            user['email'],
                            user.get('name', 'Friend'),
                            pending_habits
                        )
                        
                        # Log notification
                        supabase.table('notification_log').insert({
                            'user_id': user['id'],
                            'date': today,
                            'type': 'smart_reminder',
                            'data': {'habits': len(pending_habits)}
                        }).execute()
                        
                        reminders_sent += 1
            
            return {'reminders_sent': reminders_sent}
            
        except Exception as e:
            logging.error(f"Error sending smart reminders: {str(e)}")
            return {'error': str(e)}
    
    @staticmethod
    def _send_reminder_email(email: str, name: str, habits: List[Dict]):
        """Send reminder email"""
        high_priority = [h for h in habits if h.get('priority') == 'high']
        
        habits_html = "".join([
            f"""
            <div style="background: {'#7c3aed20' if h.get('priority') == 'high' else '#1e293b'}; 
                        padding: 15px; border-radius: 10px; margin-bottom: 10px;
                        border-left: 4px solid {'#f97316' if h.get('priority') == 'high' else '#475569'};">
                <div style="font-weight: bold; color: white;">{h['name']}</div>
                <div style="color: #94a3b8; font-size: 14px;">{h.get('message', '')}</div>
            </div>
            """
            for h in habits
        ])
        
        subject = f"🔥 {name}, {len(high_priority)} streak(s) at risk!" if high_priority else f"⏰ {name}, {len(habits)} habits waiting"
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 15px; text-align: center;">
                <h1 style="color: white; margin: 0;">🎯 Sankalp Reminder</h1>
            </div>
            
            <div style="padding: 30px; background: #1e293b; border-radius: 0 0 15px 15px; color: white;">
                <h2 style="color: #f97316;">Hey {name}!</h2>
                
                <p style="color: #94a3b8;">You have {len(habits)} habit(s) waiting for you today:</p>
                
                {habits_html}
                
                <a href="{APP_URL}/daily" 
                   style="display: block; background: #f97316; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 20px; text-align: center;">
                    ✅ Complete Your Habits Now
                </a>
                
                <p style="color: #64748b; font-size: 12px; margin-top: 30px; text-align: center;">
                    Stay consistent, stay unstoppable! 💪
                </p>
            </div>
        </body>
        </html>
        """
        
        NotificationManager.send_email(email, subject, html)