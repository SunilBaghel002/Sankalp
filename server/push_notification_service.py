# server/push_notification_service.py
import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv

load_dotenv()

# VAPID Configuration
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIMS_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@sankalp.app")

logging.basicConfig(level=logging.INFO)


class PushNotificationService:
    """Web Push Notification Service"""
    
    def __init__(self):
        self.public_key = VAPID_PUBLIC_KEY
        self.private_key = VAPID_PRIVATE_KEY
        self.claims_email = VAPID_CLAIMS_EMAIL
        
        if not self.public_key or not self.private_key:
            logging.warning("⚠️ VAPID keys not configured! Push notifications will not work.")
    
    def send_notification(
        self,
        subscription: Dict[str, Any],
        title: str,
        body: str,
        icon: str = "/icons/icon-192x192.png",
        badge: str = "/icons/badge-72x72.png",
        tag: str = None,
        data: Dict = None,
        actions: List[Dict] = None,
        require_interaction: bool = False,
        silent: bool = False,
        urgency: str = "normal"  # "very-low", "low", "normal", "high"
    ) -> Dict[str, Any]:
        """Send a push notification to a single subscription"""
        
        if not self.public_key or not self.private_key:
            return {"success": False, "error": "VAPID keys not configured"}
        
        try:
            payload = {
                "title": title,
                "body": body,
                "icon": icon,
                "badge": badge,
                "timestamp": datetime.now().isoformat(),
                "requireInteraction": require_interaction,
                "silent": silent,
            }
            
            if tag:
                payload["tag"] = tag
            if data:
                payload["data"] = data
            if actions:
                payload["actions"] = actions
            
            vapid_claims = {
                "sub": self.claims_email
            }
            
            response = webpush(
                subscription_info=subscription,
                data=json.dumps(payload),
                vapid_private_key=self.private_key,
                vapid_claims=vapid_claims,
                headers={
                    "Urgency": urgency,
                    "TTL": str(86400)  # 24 hours
                }
            )
            
            logging.info(f"✅ Push notification sent: {title}")
            return {"success": True, "status_code": response.status_code}
            
        except WebPushException as e:
            logging.error(f"Push notification failed: {str(e)}")
            
            # Check if subscription is expired/invalid
            if e.response and e.response.status_code in [404, 410]:
                return {"success": False, "error": "subscription_expired", "should_remove": True}
            
            return {"success": False, "error": str(e)}
        except Exception as e:
            logging.error(f"Push notification error: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def send_bulk_notifications(
        self,
        subscriptions: List[Dict[str, Any]],
        title: str,
        body: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Send notifications to multiple subscriptions"""
        
        results = {
            "total": len(subscriptions),
            "success": 0,
            "failed": 0,
            "expired": []
        }
        
        for subscription in subscriptions:
            result = self.send_notification(subscription, title, body, **kwargs)
            
            if result.get("success"):
                results["success"] += 1
            else:
                results["failed"] += 1
                if result.get("should_remove"):
                    results["expired"].append(subscription)
        
        return results
    
    def send_habit_reminder(
        self,
        subscription: Dict[str, Any],
        habit_name: str,
        habit_time: str,
        streak: int = 0
    ) -> Dict[str, Any]:
        """Send habit reminder notification"""
        
        body = f"Time for: {habit_name}"
        if streak > 0:
            body += f" 🔥 {streak} day streak!"
        
        return self.send_notification(
            subscription=subscription,
            title="🎯 Habit Reminder",
            body=body,
            tag=f"habit-reminder-{habit_name.replace(' ', '-').lower()}",
            data={
                "type": "habit_reminder",
                "habit_name": habit_name,
                "habit_time": habit_time,
                "url": "/daily"
            },
            actions=[
                {"action": "complete", "title": "✅ Mark Complete"},
                {"action": "snooze", "title": "⏰ Snooze 10min"}
            ],
            require_interaction=True,
            urgency="high"
        )
    
    def send_streak_alert(
        self,
        subscription: Dict[str, Any],
        current_streak: int,
        incomplete_count: int
    ) -> Dict[str, Any]:
        """Send streak at risk notification"""
        
        return self.send_notification(
            subscription=subscription,
            title="⚠️ Streak at Risk!",
            body=f"You have {incomplete_count} habits left today. Don't lose your {current_streak}-day streak!",
            tag="streak-alert",
            data={
                "type": "streak_alert",
                "streak": current_streak,
                "url": "/daily"
            },
            actions=[
                {"action": "open", "title": "📱 Open Sankalp"},
                {"action": "dismiss", "title": "Dismiss"}
            ],
            require_interaction=True,
            urgency="high"
        )
    
    def send_daily_motivation(
        self,
        subscription: Dict[str, Any],
        message: str,
        day_number: int
    ) -> Dict[str, Any]:
        """Send daily motivational notification"""
        
        return self.send_notification(
            subscription=subscription,
            title=f"💪 Day {day_number} of 100",
            body=message,
            tag="daily-motivation",
            data={
                "type": "motivation",
                "day": day_number,
                "url": "/daily"
            },
            urgency="normal"
        )
    
    def send_achievement(
        self,
        subscription: Dict[str, Any],
        badge_name: str,
        badge_icon: str,
        xp_earned: int
    ) -> Dict[str, Any]:
        """Send achievement unlocked notification"""
        
        return self.send_notification(
            subscription=subscription,
            title="🏆 Achievement Unlocked!",
            body=f"{badge_icon} {badge_name} - +{xp_earned} XP",
            tag=f"achievement-{badge_name.replace(' ', '-').lower()}",
            data={
                "type": "achievement",
                "badge_name": badge_name,
                "xp": xp_earned,
                "url": "/badges"
            },
            require_interaction=True,
            urgency="normal"
        )
    
    def send_perfect_day(
        self,
        subscription: Dict[str, Any],
        streak: int
    ) -> Dict[str, Any]:
        """Send perfect day celebration notification"""
        
        return self.send_notification(
            subscription=subscription,
            title="🎉 Perfect Day!",
            body=f"All habits completed! Your streak is now {streak} days! 🔥",
            tag="perfect-day",
            data={
                "type": "perfect_day",
                "streak": streak,
                "url": "/daily"
            },
            urgency="normal"
        )
    
    def send_sleep_reminder(
        self,
        subscription: Dict[str, Any],
        suggested_bedtime: str = "22:00"
    ) -> Dict[str, Any]:
        """Send sleep reminder notification"""
        
        return self.send_notification(
            subscription=subscription,
            title="😴 Time to Wind Down",
            body=f"For optimal rest, start your bedtime routine now. Target: {suggested_bedtime}",
            tag="sleep-reminder",
            data={
                "type": "sleep_reminder",
                "url": "/sleep"
            },
            actions=[
                {"action": "track", "title": "📝 Log Sleep"},
                {"action": "snooze", "title": "⏰ Remind Later"}
            ],
            urgency="low"
        )


# Singleton instance
push_service = PushNotificationService()


# Smart Notification Scheduler
class SmartNotificationScheduler:
    """Intelligent notification scheduling based on user behavior"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.push_service = push_service
    
    async def check_and_send_reminders(self) -> Dict[str, Any]:
        """Check all users and send appropriate reminders"""
        
        today = date.today().strftime('%Y-%m-%d')
        current_time = datetime.now()
        current_hour = current_time.hour
        current_minute = current_time.minute
        
        results = {
            "checked_users": 0,
            "reminders_sent": 0,
            "streak_alerts_sent": 0,
            "errors": []
        }
        
        try:
            # Get all users with push subscriptions
            users_response = self.supabase.table('users').select(
                'id, name, push_subscriptions, notification_preferences'
            ).not_.is_('push_subscriptions', 'null').execute()
            
            users = users_response.data or []
            results["checked_users"] = len(users)
            
            for user in users:
                try:
                    await self._process_user_notifications(
                        user, today, current_hour, current_minute, results
                    )
                except Exception as e:
                    results["errors"].append(f"User {user['id']}: {str(e)}")
            
            return results
            
        except Exception as e:
            logging.error(f"Error in check_and_send_reminders: {str(e)}")
            results["errors"].append(str(e))
            return results
    
    async def _process_user_notifications(
        self,
        user: Dict,
        today: str,
        current_hour: int,
        current_minute: int,
        results: Dict
    ):
        """Process notifications for a single user"""
        
        user_id = user['id']
        subscriptions = user.get('push_subscriptions', [])
        preferences = user.get('notification_preferences', {})
        
        if not subscriptions:
            return
        
        # Check notification preferences
        if not preferences.get('push_enabled', True):
            return
        
        # Get user's habits
        habits_response = self.supabase.table('habits').select('*').eq(
            'user_id', user_id
        ).execute()
        habits = habits_response.data or []
        
        if not habits:
            return
        
        # Get today's checkins
        checkins_response = self.supabase.table('checkins').select('*').eq(
            'user_id', user_id
        ).eq('date', today).execute()
        
        completed_habit_ids = set(
            c['habit_id'] for c in (checkins_response.data or []) if c['completed']
        )
        
        # Get user stats for streak info
        stats_response = self.supabase.table('users').select(
            'current_streak'
        ).eq('id', user_id).single().execute()
        
        current_streak = stats_response.data.get('current_streak', 0) if stats_response.data else 0
        
        # Process each habit
        for habit in habits:
            if habit['id'] in completed_habit_ids:
                continue  # Already completed
            
            habit_time = habit.get('time', '09:00')
            try:
                habit_hour, habit_minute = map(int, habit_time.split(':'))
            except:
                continue
            
            # Check if it's time for the habit reminder
            time_diff_minutes = (current_hour * 60 + current_minute) - (habit_hour * 60 + habit_minute)
            
            # Send reminder at habit time
            if 0 <= time_diff_minutes <= 5:
                for subscription in subscriptions:
                    result = self.push_service.send_habit_reminder(
                        subscription=subscription,
                        habit_name=habit['name'],
                        habit_time=habit_time,
                        streak=current_streak
                    )
                    if result.get('success'):
                        results["reminders_sent"] += 1
            
            # Send streak alert if habit is 2+ hours overdue
            elif time_diff_minutes >= 120 and preferences.get('streak_alerts', True):
                # Check if we already sent an alert today for this user
                alert_key = f"streak_alert_{user_id}_{today}"
                existing_alert = self.supabase.table('notification_log').select('id').eq(
                    'key', alert_key
                ).execute()
                
                if not existing_alert.data:
                    incomplete_count = len(habits) - len(completed_habit_ids)
                    
                    for subscription in subscriptions:
                        result = self.push_service.send_streak_alert(
                            subscription=subscription,
                            current_streak=current_streak,
                            incomplete_count=incomplete_count
                        )
                        if result.get('success'):
                            results["streak_alerts_sent"] += 1
                    
                    # Log that we sent the alert
                    self.supabase.table('notification_log').insert({
                        'key': alert_key,
                        'user_id': user_id,
                        'type': 'streak_alert',
                        'sent_at': datetime.now().isoformat()
                    }).execute()
    
    async def send_morning_motivation(self) -> Dict[str, Any]:
        """Send morning motivational messages (call at ~7 AM)"""
        
        results = {"sent": 0, "errors": []}
        
        try:
            users_response = self.supabase.table('users').select(
                'id, name, push_subscriptions, notification_preferences, total_completed_days'
            ).not_.is_('push_subscriptions', 'null').execute()
            
            messages = [
                "Rise and shine! Today is another step toward your goals. 🌅",
                "New day, new opportunities. Let's make it count! 💪",
                "Your consistency is building something amazing. Keep going! 🚀",
                "Champions are made in the morning. Time to win the day! 🏆",
                "Every habit you complete brings you closer to your best self. 🌟",
            ]
            
            import random
            
            for user in (users_response.data or []):
                preferences = user.get('notification_preferences', {})
                if not preferences.get('morning_motivation', True):
                    continue
                
                subscriptions = user.get('push_subscriptions', [])
                day_number = (user.get('total_completed_days', 0) or 0) + 1
                
                message = random.choice(messages)
                
                for subscription in subscriptions:
                    result = self.push_service.send_daily_motivation(
                        subscription=subscription,
                        message=message,
                        day_number=min(day_number, 100)
                    )
                    if result.get('success'):
                        results["sent"] += 1
            
            return results
            
        except Exception as e:
            results["errors"].append(str(e))
            return results
    
    async def send_evening_reminder(self) -> Dict[str, Any]:
        """Send evening reminder for incomplete habits (call at ~8 PM)"""
        
        today = date.today().strftime('%Y-%m-%d')
        results = {"sent": 0, "errors": []}
        
        try:
            users_response = self.supabase.table('users').select(
                'id, name, push_subscriptions, notification_preferences'
            ).not_.is_('push_subscriptions', 'null').execute()
            
            for user in (users_response.data or []):
                preferences = user.get('notification_preferences', {})
                if not preferences.get('evening_reminder', True):
                    continue
                
                user_id = user['id']
                subscriptions = user.get('push_subscriptions', [])
                
                # Check incomplete habits
                habits_response = self.supabase.table('habits').select('id').eq(
                    'user_id', user_id
                ).execute()
                total_habits = len(habits_response.data or [])
                
                checkins_response = self.supabase.table('checkins').select('habit_id').eq(
                    'user_id', user_id
                ).eq('date', today).eq('completed', True).execute()
                completed = len(checkins_response.data or [])
                
                incomplete = total_habits - completed
                
                if incomplete > 0:
                    for subscription in subscriptions:
                        result = self.push_service.send_notification(
                            subscription=subscription,
                            title="🌙 Evening Check-in",
                            body=f"You have {incomplete} habit{'s' if incomplete > 1 else ''} left today. There's still time!",
                            tag="evening-reminder",
                            data={"type": "evening_reminder", "url": "/daily"},
                            actions=[
                                {"action": "open", "title": "Complete Now"},
                                {"action": "dismiss", "title": "Dismiss"}
                            ],
                            urgency="normal"
                        )
                        if result.get('success'):
                            results["sent"] += 1
            
            return results
            
        except Exception as e:
            results["errors"].append(str(e))
            return results