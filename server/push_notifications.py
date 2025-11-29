# server/push_notifications.py
import os
from pywebpush import webpush, WebPushException
import json
import logging

logging.basicConfig(level=logging.INFO)

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "mailto:your@email.com")


def send_push_notification(subscription_info: dict, title: str, body: str, data: dict = None) -> bool:
    """Send a push notification to a subscribed user"""
    
    if not all([VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY]):
        logging.warning("⚠️ VAPID keys not configured")
        return False
    
    try:
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": "/icon-192.png",
            "badge": "/badge.png",
            "data": data or {},
            "actions": [
                {"action": "open", "title": "Open App"},
                {"action": "dismiss", "title": "Dismiss"}
            ]
        })
        
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": VAPID_EMAIL
            }
        )
        
        logging.info(f"✅ Push notification sent: {title}")
        return True
    except WebPushException as e:
        logging.error(f"Push notification failed: {str(e)}")
        return False


def send_habit_reminder(subscription_info: dict, habit_name: str, habit_time: str) -> bool:
    """Send a habit reminder notification"""
    return send_push_notification(
        subscription_info=subscription_info,
        title=f"🎯 Time for: {habit_name}",
        body=f"It's {habit_time}! Time to complete your habit. You've got this! 💪",
        data={"type": "habit_reminder", "habit": habit_name}
    )


def send_streak_notification(subscription_info: dict, streak: int) -> bool:
    """Send streak milestone notification"""
    messages = {
        7: "🔥 One week streak! You're building momentum!",
        14: "⚡ Two weeks strong! Habits are forming!",
        21: "🎉 21 days! Science says this is when habits stick!",
        30: "🏆 One month! You're unstoppable!",
        50: "💎 50 days! Halfway to the goal!",
        75: "🚀 75 days! The finish line is in sight!",
        100: "👑 100 DAYS! YOU DID IT! Claim your ₹500!"
    }
    
    if streak in messages:
        return send_push_notification(
            subscription_info=subscription_info,
            title=f"🎊 {streak}-Day Streak!",
            body=messages[streak],
            data={"type": "streak_milestone", "streak": streak}
        )
    return False


def send_daily_motivation(subscription_info: dict, message: str) -> bool:
    """Send daily motivational notification"""
    return send_push_notification(
        subscription_info=subscription_info,
        title="✨ Daily Motivation",
        body=message,
        data={"type": "motivation"}
    )