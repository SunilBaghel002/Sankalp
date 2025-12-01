# server/challenges_service.py
import os
import logging
import random
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)


# Challenge definitions
DAILY_CHALLENGES = [
    {
        "id": "early_bird",
        "name": "Early Bird",
        "description": "Complete your first habit before 7 AM",
        "icon": "🌅",
        "xp_reward": 25,
        "type": "time_based",
        "condition": {"before_hour": 7, "habit_count": 1}
    },
    {
        "id": "perfect_morning",
        "name": "Perfect Morning",
        "description": "Complete all habits before noon",
        "icon": "☀️",
        "xp_reward": 50,
        "type": "time_based",
        "condition": {"before_hour": 12, "habit_count": "all"}
    },
    {
        "id": "quick_starter",
        "name": "Quick Starter",
        "description": "Complete a habit within 1 hour of waking up",
        "icon": "⚡",
        "xp_reward": 20,
        "type": "special",
        "condition": {"within_hours_of_wake": 1}
    },
    {
        "id": "streak_keeper",
        "name": "Streak Keeper",
        "description": "Maintain your streak for another day",
        "icon": "🔥",
        "xp_reward": 15,
        "type": "streak",
        "condition": {"maintain_streak": True}
    },
    {
        "id": "thought_leader",
        "name": "Thought Leader",
        "description": "Write a meaningful daily thought (50+ characters)",
        "icon": "💭",
        "xp_reward": 20,
        "type": "thought",
        "condition": {"min_characters": 50}
    },
    {
        "id": "sleep_champion",
        "name": "Sleep Champion",
        "description": "Log 7-9 hours of sleep",
        "icon": "😴",
        "xp_reward": 25,
        "type": "sleep",
        "condition": {"min_hours": 7, "max_hours": 9}
    },
    {
        "id": "consistency_king",
        "name": "Consistency King",
        "description": "Complete all habits at their scheduled times (±30 min)",
        "icon": "👑",
        "xp_reward": 75,
        "type": "timing",
        "condition": {"within_minutes": 30}
    },
    {
        "id": "double_down",
        "name": "Double Down",
        "description": "Complete all habits twice as fast as yesterday",
        "icon": "🚀",
        "xp_reward": 40,
        "type": "improvement",
        "condition": {"faster_than_yesterday": True}
    },
    {
        "id": "mindful_moment",
        "name": "Mindful Moment",
        "description": "Track both sleep and thought today",
        "icon": "🧘",
        "xp_reward": 30,
        "type": "combined",
        "condition": {"track_sleep": True, "track_thought": True}
    },
    {
        "id": "no_snooze",
        "name": "No Snooze",
        "description": "Complete all habits without any being overdue",
        "icon": "⏰",
        "xp_reward": 35,
        "type": "timing",
        "condition": {"no_overdue": True}
    }
]

WEEKLY_CHALLENGES = [
    {
        "id": "week_warrior",
        "name": "Week Warrior",
        "description": "Complete all habits every day this week",
        "icon": "⚔️",
        "xp_reward": 200,
        "type": "streak",
        "condition": {"perfect_days": 7}
    },
    {
        "id": "sleep_master",
        "name": "Sleep Master",
        "description": "Get optimal sleep (7-9h) for 5 days this week",
        "icon": "🌙",
        "xp_reward": 150,
        "type": "sleep",
        "condition": {"optimal_sleep_days": 5}
    },
    {
        "id": "thinker",
        "name": "Deep Thinker",
        "description": "Write daily thoughts for 5 days this week",
        "icon": "🧠",
        "xp_reward": 100,
        "type": "thought",
        "condition": {"thought_days": 5}
    }
]


class ChallengesService:
    """Service for managing daily and weekly challenges"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def get_daily_challenges(self, user_id: int, date_str: str = None) -> Dict[str, Any]:
        """Get daily challenges for a user"""
        if not date_str:
            date_str = date.today().strftime('%Y-%m-%d')
        
        # Use date as seed for consistent daily challenges
        seed = int(date_str.replace('-', '')) + user_id
        random.seed(seed)
        
        # Select 3 random challenges for the day
        selected = random.sample(DAILY_CHALLENGES, min(3, len(DAILY_CHALLENGES)))
        
        # Check completion status
        challenges = []
        for challenge in selected:
            completed = self._check_challenge_completed(user_id, challenge, date_str)
            challenges.append({
                **challenge,
                "completed": completed,
                "date": date_str
            })
        
        return {
            "date": date_str,
            "challenges": challenges,
            "total_xp_available": sum(c["xp_reward"] for c in selected),
            "completed_count": sum(1 for c in challenges if c["completed"])
        }
    
    def get_weekly_challenges(self, user_id: int) -> Dict[str, Any]:
        """Get weekly challenges for a user"""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        challenges = []
        for challenge in WEEKLY_CHALLENGES:
            completed = self._check_weekly_challenge_completed(
                user_id, challenge, week_start, week_end
            )
            progress = self._get_weekly_challenge_progress(
                user_id, challenge, week_start, week_end
            )
            challenges.append({
                **challenge,
                "completed": completed,
                "progress": progress,
                "week_start": week_start.strftime('%Y-%m-%d'),
                "week_end": week_end.strftime('%Y-%m-%d')
            })
        
        return {
            "week_start": week_start.strftime('%Y-%m-%d'),
            "week_end": week_end.strftime('%Y-%m-%d'),
            "challenges": challenges,
            "total_xp_available": sum(c["xp_reward"] for c in WEEKLY_CHALLENGES),
            "completed_count": sum(1 for c in challenges if c["completed"])
        }
    
    def _check_challenge_completed(
        self, user_id: int, challenge: Dict, date_str: str
    ) -> bool:
        """Check if a daily challenge is completed"""
        try:
            challenge_type = challenge.get("type")
            condition = challenge.get("condition", {})
            
            if challenge_type == "thought":
                # Check if thought exists with min characters
                thought_response = self.supabase.table('daily_thoughts').select('thought').eq(
                    'user_id', user_id
                ).eq('date', date_str).execute()
                
                if thought_response.data:
                    thought = thought_response.data[0].get('thought', '')
                    return len(thought) >= condition.get('min_characters', 0)
                return False
            
            elif challenge_type == "sleep":
                # Check sleep hours
                sleep_response = self.supabase.table('sleep_records').select('sleep_hours').eq(
                    'user_id', user_id
                ).eq('date', date_str).execute()
                
                if sleep_response.data:
                    hours = sleep_response.data[0].get('sleep_hours', 0)
                    return condition.get('min_hours', 0) <= hours <= condition.get('max_hours', 24)
                return False
            
            elif challenge_type == "combined":
                # Check both sleep and thought
                has_sleep = False
                has_thought = False
                
                if condition.get('track_sleep'):
                    sleep_response = self.supabase.table('sleep_records').select('id').eq(
                        'user_id', user_id
                    ).eq('date', date_str).execute()
                    has_sleep = bool(sleep_response.data)
                
                if condition.get('track_thought'):
                    thought_response = self.supabase.table('daily_thoughts').select('id').eq(
                        'user_id', user_id
                    ).eq('date', date_str).execute()
                    has_thought = bool(thought_response.data)
                
                return has_sleep and has_thought
            
            elif challenge_type == "streak":
                # Check if streak is maintained
                habits_response = self.supabase.table('habits').select('id').eq(
                    'user_id', user_id
                ).execute()
                total_habits = len(habits_response.data) if habits_response.data else 0
                
                if total_habits == 0:
                    return False
                
                checkins_response = self.supabase.table('checkins').select('*').eq(
                    'user_id', user_id
                ).eq('date', date_str).eq('completed', True).execute()
                
                completed_habits = len(checkins_response.data) if checkins_response.data else 0
                return completed_habits == total_habits
            
            elif challenge_type == "timing":
                # Check if all habits completed without being overdue
                habits_response = self.supabase.table('habits').select('*').eq(
                    'user_id', user_id
                ).execute()
                habits = habits_response.data or []
                
                if not habits:
                    return False
                
                checkins_response = self.supabase.table('checkins').select('*').eq(
                    'user_id', user_id
                ).eq('date', date_str).execute()
                
                checkins = {c['habit_id']: c for c in (checkins_response.data or [])}
                
                # For now, just check if all are completed
                # In a full implementation, you'd track completion times
                return len([c for c in checkins.values() if c.get('completed')]) == len(habits)
            
            else:
                # Default: check if all habits completed
                habits_response = self.supabase.table('habits').select('id').eq(
                    'user_id', user_id
                ).execute()
                total_habits = len(habits_response.data) if habits_response.data else 0
                
                checkins_response = self.supabase.table('checkins').select('*').eq(
                    'user_id', user_id
                ).eq('date', date_str).eq('completed', True).execute()
                
                return len(checkins_response.data or []) == total_habits
                
        except Exception as e:
            logging.error(f"Error checking challenge completion: {str(e)}")
            return False
    
    def _check_weekly_challenge_completed(
        self, user_id: int, challenge: Dict, week_start: date, week_end: date
    ) -> bool:
        """Check if a weekly challenge is completed"""
        progress = self._get_weekly_challenge_progress(user_id, challenge, week_start, week_end)
        condition = challenge.get("condition", {})
        
        if "perfect_days" in condition:
            return progress >= condition["perfect_days"]
        elif "optimal_sleep_days" in condition:
            return progress >= condition["optimal_sleep_days"]
        elif "thought_days" in condition:
            return progress >= condition["thought_days"]
        
        return False
    
    def _get_weekly_challenge_progress(
        self, user_id: int, challenge: Dict, week_start: date, week_end: date
    ) -> int:
        """Get progress for a weekly challenge"""
        try:
            condition = challenge.get("condition", {})
            
            if "perfect_days" in condition:
                # Count perfect days
                habits_response = self.supabase.table('habits').select('id').eq(
                    'user_id', user_id
                ).execute()
                total_habits = len(habits_response.data) if habits_response.data else 0
                
                if total_habits == 0:
                    return 0
                
                perfect_days = 0
                current_date = week_start
                
                while current_date <= min(week_end, date.today()):
                    date_str = current_date.strftime('%Y-%m-%d')
                    checkins_response = self.supabase.table('checkins').select('*').eq(
                        'user_id', user_id
                    ).eq('date', date_str).eq('completed', True).execute()
                    
                    if len(checkins_response.data or []) == total_habits:
                        perfect_days += 1
                    
                    current_date += timedelta(days=1)
                
                return perfect_days
            
            elif "optimal_sleep_days" in condition:
                # Count days with optimal sleep
                sleep_response = self.supabase.table('sleep_records').select('*').eq(
                    'user_id', user_id
                ).gte('date', week_start.strftime('%Y-%m-%d')).lte(
                    'date', week_end.strftime('%Y-%m-%d')
                ).execute()
                
                optimal_days = sum(
                    1 for r in (sleep_response.data or [])
                    if 7 <= r.get('sleep_hours', 0) <= 9
                )
                return optimal_days
            
            elif "thought_days" in condition:
                # Count days with thoughts
                thoughts_response = self.supabase.table('daily_thoughts').select('id').eq(
                    'user_id', user_id
                ).gte('date', week_start.strftime('%Y-%m-%d')).lte(
                    'date', week_end.strftime('%Y-%m-%d')
                ).execute()
                
                return len(thoughts_response.data or [])
            
            return 0
            
        except Exception as e:
            logging.error(f"Error getting weekly challenge progress: {str(e)}")
            return 0
    
    def complete_challenge(
        self, user_id: int, challenge_id: str, date_str: str = None
    ) -> Dict[str, Any]:
        """Mark a challenge as completed and award XP"""
        if not date_str:
            date_str = date.today().strftime('%Y-%m-%d')
        
        # Find the challenge
        challenge = next(
            (c for c in DAILY_CHALLENGES if c["id"] == challenge_id),
            None
        )
        
        if not challenge:
            challenge = next(
                (c for c in WEEKLY_CHALLENGES if c["id"] == challenge_id),
                None
            )
        
        if not challenge:
            return {"success": False, "error": "Challenge not found"}
        
        # Check if already completed
        existing = self.supabase.table('challenge_completions').select('id').eq(
            'user_id', user_id
        ).eq('challenge_id', challenge_id).eq('date', date_str).execute()
        
        if existing.data:
            return {"success": False, "error": "Challenge already completed"}
        
        # Verify challenge is actually completed
        is_completed = self._check_challenge_completed(user_id, challenge, date_str)
        
        if not is_completed:
            return {"success": False, "error": "Challenge conditions not met"}
        
        # Record completion
        self.supabase.table('challenge_completions').insert({
            'user_id': user_id,
            'challenge_id': challenge_id,
            'date': date_str,
            'xp_earned': challenge['xp_reward']
        }).execute()
        
        # Award XP
        user_response = self.supabase.table('users').select('total_xp').eq(
            'id', user_id
        ).single().execute()
        
        current_xp = user_response.data.get('total_xp', 0) if user_response.data else 0
        new_xp = current_xp + challenge['xp_reward']
        
        self.supabase.table('users').update({
            'total_xp': new_xp
        }).eq('id', user_id).execute()
        
        return {
            "success": True,
            "challenge": challenge,
            "xp_earned": challenge['xp_reward'],
            "total_xp": new_xp
        }