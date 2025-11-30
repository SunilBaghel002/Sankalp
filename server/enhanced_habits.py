# server/enhanced_habits.py
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from database import supabase

logging.basicConfig(level=logging.INFO)


# ==================== SCHEMAS ====================

class EnhancedHabitCreate(BaseModel):
    name: str
    why: str
    time: str
    category: str = "general"
    icon: str = "🎯"
    color: str = "#f97316"
    goal_type: str = "boolean"  # boolean, count, duration
    goal_value: int = 1
    goal_unit: Optional[str] = None
    difficulty: str = "medium"


class EnhancedCheckinCreate(BaseModel):
    habit_id: int
    date: str
    completed: bool
    value: Optional[int] = None  # For quantifiable habits
    note: Optional[str] = None
    mood: Optional[int] = None  # 1-5
    difficulty_felt: Optional[str] = None
    time_spent: Optional[int] = None  # minutes


class SkipHabitRequest(BaseModel):
    habit_id: int
    date: str
    reason: str  # sick, travel, rest, other


# ==================== HABIT STREAK MANAGER ====================

class HabitStreakManager:
    """Manage individual habit streaks"""
    
    @staticmethod
    def update_streak(user_id: int, habit_id: int, completed_date: str) -> Dict[str, Any]:
        """Update streak for a specific habit"""
        try:
            today = date.today()
            completed = datetime.strptime(completed_date, '%Y-%m-%d').date()
            
            # Get current streak record
            streak_response = supabase.table('habit_streaks').select('*').eq(
                'user_id', user_id
            ).eq('habit_id', habit_id).execute()
            
            if streak_response.data:
                streak = streak_response.data[0]
                last_date = datetime.strptime(streak['last_completed_date'], '%Y-%m-%d').date() if streak['last_completed_date'] else None
                
                if last_date:
                    days_diff = (completed - last_date).days
                    
                    if days_diff == 0:
                        # Already completed today
                        return streak
                    elif days_diff == 1:
                        # Consecutive day - increment streak
                        new_streak = streak['current_streak'] + 1
                        best_streak = max(new_streak, streak['best_streak'])
                    elif days_diff > 1:
                        # Streak broken - reset
                        new_streak = 1
                        best_streak = streak['best_streak']
                    else:
                        # Past date completion
                        new_streak = streak['current_streak']
                        best_streak = streak['best_streak']
                else:
                    new_streak = 1
                    best_streak = 1
                
                # Update streak
                updated = supabase.table('habit_streaks').update({
                    'current_streak': new_streak,
                    'best_streak': best_streak,
                    'last_completed_date': completed_date,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', streak['id']).execute()
                
                return updated.data[0] if updated.data else streak
            else:
                # Create new streak record
                new_streak = supabase.table('habit_streaks').insert({
                    'user_id': user_id,
                    'habit_id': habit_id,
                    'current_streak': 1,
                    'best_streak': 1,
                    'last_completed_date': completed_date,
                    'streak_started_date': completed_date
                }).execute()
                
                return new_streak.data[0] if new_streak.data else {}
                
        except Exception as e:
            logging.error(f"Error updating streak: {str(e)}")
            return {}
    
    @staticmethod
    def get_habit_streaks(user_id: int) -> List[Dict[str, Any]]:
        """Get all habit streaks for a user"""
        try:
            response = supabase.table('habit_streaks').select(
                '*, habits(name, icon, color)'
            ).eq('user_id', user_id).execute()
            
            return response.data or []
        except Exception as e:
            logging.error(f"Error getting streaks: {str(e)}")
            return []
    
    @staticmethod
    def check_streak_at_risk(user_id: int) -> List[Dict[str, Any]]:
        """Find habits that haven't been completed today (streak at risk)"""
        try:
            today = date.today().strftime('%Y-%m-%d')
            yesterday = (date.today() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            # Get habits with active streaks
            streaks = supabase.table('habit_streaks').select(
                '*, habits(name, icon)'
            ).eq('user_id', user_id).gt('current_streak', 0).execute()
            
            at_risk = []
            for streak in (streaks.data or []):
                # Check if completed today
                checkin = supabase.table('checkins').select('*').eq(
                    'habit_id', streak['habit_id']
                ).eq('date', today).eq('completed', True).execute()
                
                if not checkin.data:
                    at_risk.append({
                        'habit_id': streak['habit_id'],
                        'habit_name': streak['habits']['name'] if streak.get('habits') else 'Unknown',
                        'habit_icon': streak['habits']['icon'] if streak.get('habits') else '🎯',
                        'current_streak': streak['current_streak'],
                        'message': f"Don't break your {streak['current_streak']}-day streak!"
                    })
            
            return at_risk
        except Exception as e:
            logging.error(f"Error checking at-risk streaks: {str(e)}")
            return []


# ==================== DAILY CHALLENGES ====================

class DailyChallengeManager:
    """Generate and manage daily challenges"""
    
    CHALLENGE_TYPES = [
        {
            'type': 'early_bird',
            'title': '🌅 Early Bird',
            'description': 'Complete your first habit before 7 AM',
            'xp': 50
        },
        {
            'type': 'perfectionist',
            'title': '⭐ Perfectionist',
            'description': 'Complete ALL habits today',
            'xp': 100
        },
        {
            'type': 'speed_demon',
            'title': '⚡ Speed Demon',
            'description': 'Complete all habits within 2 hours of waking up',
            'xp': 75
        },
        {
            'type': 'reflector',
            'title': '💭 Deep Reflector',
            'description': 'Write a thought with at least 100 words',
            'xp': 50
        },
        {
            'type': 'sleep_champion',
            'title': '😴 Sleep Champion',
            'description': 'Log 7-9 hours of sleep',
            'xp': 50
        },
        {
            'type': 'streak_guardian',
            'title': '🔥 Streak Guardian',
            'description': 'Maintain all your habit streaks today',
            'xp': 75
        },
        {
            'type': 'bonus_habit',
            'title': '🎯 Bonus Round',
            'description': 'Complete a random bonus habit today',
            'xp': 60,
            'bonus_habits': ['5-minute stretch', '10 deep breaths', 'Compliment someone', 'Drink extra water']
        },
        {
            'type': 'no_skip',
            'title': '💪 No Excuses',
            'description': 'Complete all habits without using skip',
            'xp': 80
        }
    ]
    
    @staticmethod
    def generate_daily_challenges(user_id: int) -> List[Dict[str, Any]]:
        """Generate 3 daily challenges for a user"""
        import random
        
        today = date.today().strftime('%Y-%m-%d')
        
        # Check if challenges already exist for today
        existing = supabase.table('daily_challenges').select('*').eq(
            'user_id', user_id
        ).eq('date', today).execute()
        
        if existing.data:
            return existing.data
        
        # Select 3 random challenges
        selected = random.sample(DailyChallengeManager.CHALLENGE_TYPES, 3)
        
        challenges = []
        for challenge in selected:
            data = {
                'user_id': user_id,
                'date': today,
                'challenge_type': challenge['type'],
                'title': challenge['title'],
                'description': challenge['description'],
                'xp_reward': challenge['xp'],
                'completed': False,
                'progress': 0,
                'target': 1,
                'expires_at': (datetime.now().replace(hour=23, minute=59, second=59)).isoformat()
            }
            
            # Add bonus habit if applicable
            if challenge['type'] == 'bonus_habit':
                data['description'] = f"Complete this bonus: {random.choice(challenge['bonus_habits'])}"
            
            response = supabase.table('daily_challenges').insert(data).execute()
            if response.data:
                challenges.append(response.data[0])
        
        return challenges
    
    @staticmethod
    def check_challenge_completion(user_id: int, challenge_type: str) -> bool:
        """Check if a specific challenge is completed"""
        today = date.today().strftime('%Y-%m-%d')
        
        try:
            if challenge_type == 'perfectionist':
                # Check if all habits are completed
                habits = supabase.table('habits').select('id').eq('user_id', user_id).execute()
                if not habits.data:
                    return False
                
                checkins = supabase.table('checkins').select('*').eq(
                    'user_id', user_id
                ).eq('date', today).eq('completed', True).execute()
                
                completed_ids = set(c['habit_id'] for c in (checkins.data or []))
                habit_ids = set(h['id'] for h in habits.data)
                
                return completed_ids >= habit_ids
            
            elif challenge_type == 'early_bird':
                # Check if any habit completed before 7 AM
                checkins = supabase.table('checkins').select('*').eq(
                    'user_id', user_id
                ).eq('date', today).eq('completed', True).execute()
                
                for checkin in (checkins.data or []):
                    if checkin.get('completed_at'):
                        completed_time = datetime.fromisoformat(checkin['completed_at'])
                        if completed_time.hour < 7:
                            return True
                return False
            
            elif challenge_type == 'sleep_champion':
                sleep = supabase.table('sleep_records').select('*').eq(
                    'user_id', user_id
                ).eq('date', today).execute()
                
                if sleep.data and sleep.data[0].get('sleep_hours'):
                    hours = sleep.data[0]['sleep_hours']
                    return 7 <= hours <= 9
                return False
            
            elif challenge_type == 'reflector':
                thought = supabase.table('daily_thoughts').select('*').eq(
                    'user_id', user_id
                ).eq('date', today).execute()
                
                if thought.data and thought.data[0].get('thought'):
                    return len(thought.data[0]['thought']) >= 100
                return False
            
            # Default
            return False
            
        except Exception as e:
            logging.error(f"Error checking challenge: {str(e)}")
            return False
    
    @staticmethod
    def update_challenge_progress(user_id: int) -> Dict[str, Any]:
        """Update all daily challenge progress"""
        today = date.today().strftime('%Y-%m-%d')
        
        challenges = supabase.table('daily_challenges').select('*').eq(
            'user_id', user_id
        ).eq('date', today).execute()
        
        xp_earned = 0
        completed_challenges = []
        
        for challenge in (challenges.data or []):
            if challenge['completed']:
                continue
            
            is_completed = DailyChallengeManager.check_challenge_completion(
                user_id, challenge['challenge_type']
            )
            
            if is_completed:
                # Mark as completed
                supabase.table('daily_challenges').update({
                    'completed': True,
                    'progress': 1
                }).eq('id', challenge['id']).execute()
                
                xp_earned += challenge['xp_reward']
                completed_challenges.append(challenge)
                
                # Add XP to user
                user_data = supabase.table('users').select('total_xp').eq(
                    'id', user_id
                ).single().execute()
                
                current_xp = user_data.data.get('total_xp', 0) if user_data.data else 0
                supabase.table('users').update({
                    'total_xp': current_xp + challenge['xp_reward']
                }).eq('id', user_id).execute()
        
        return {
            'xp_earned': xp_earned,
            'completed_challenges': completed_challenges
        }


# ==================== HABIT ANALYTICS ====================

class HabitAnalytics:
    """Advanced analytics for habits"""
    
    @staticmethod
    def get_habit_performance(user_id: int, habit_id: int, days: int = 30) -> Dict[str, Any]:
        """Get detailed performance metrics for a habit"""
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=days)
            
            checkins = supabase.table('checkins').select('*').eq(
                'habit_id', habit_id
            ).gte('date', start_date.strftime('%Y-%m-%d')).lte(
                'date', end_date.strftime('%Y-%m-%d')
            ).execute()
            
            data = checkins.data or []
            completed = [c for c in data if c['completed']]
            
            # Calculate metrics
            completion_rate = (len(completed) / days) * 100 if days > 0 else 0
            
            # Best completion day
            day_counts = {}
            for c in completed:
                day_name = datetime.strptime(c['date'], '%Y-%m-%d').strftime('%A')
                day_counts[day_name] = day_counts.get(day_name, 0) + 1
            
            best_day = max(day_counts, key=day_counts.get) if day_counts else None
            worst_day = min(day_counts, key=day_counts.get) if day_counts else None
            
            # Average mood when completing
            moods = [c['mood'] for c in completed if c.get('mood')]
            avg_mood = sum(moods) / len(moods) if moods else None
            
            # Time spent stats
            times = [c['time_spent'] for c in completed if c.get('time_spent')]
            avg_time = sum(times) / len(times) if times else None
            
            # Streak info
            streak = supabase.table('habit_streaks').select('*').eq(
                'habit_id', habit_id
            ).single().execute()
            
            return {
                'habit_id': habit_id,
                'period_days': days,
                'total_completions': len(completed),
                'completion_rate': round(completion_rate, 1),
                'best_day': best_day,
                'worst_day': worst_day,
                'average_mood': round(avg_mood, 1) if avg_mood else None,
                'average_time_spent': round(avg_time, 1) if avg_time else None,
                'current_streak': streak.data.get('current_streak', 0) if streak.data else 0,
                'best_streak': streak.data.get('best_streak', 0) if streak.data else 0,
                'day_distribution': day_counts
            }
            
        except Exception as e:
            logging.error(f"Error getting habit performance: {str(e)}")
            return {}
    
    @staticmethod
    def get_correlation_insights(user_id: int) -> Dict[str, Any]:
        """Find correlations between sleep, habits, and mood"""
        try:
            # Get last 30 days of data
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
            
            # Fetch all data
            sleep_data = supabase.table('sleep_records').select('*').eq(
                'user_id', user_id
            ).gte('date', start_date.strftime('%Y-%m-%d')).execute()
            
            checkins = supabase.table('checkins').select('*').eq(
                'user_id', user_id
            ).gte('date', start_date.strftime('%Y-%m-%d')).execute()
            
            habits = supabase.table('habits').select('*').eq('user_id', user_id).execute()
            total_habits = len(habits.data) if habits.data else 1
            
            # Build daily summaries
            daily_data = {}
            
            for sleep in (sleep_data.data or []):
                daily_data[sleep['date']] = {
                    'sleep_hours': sleep['sleep_hours'],
                    'completed_habits': 0,
                    'completion_rate': 0
                }
            
            for checkin in (checkins.data or []):
                if checkin['date'] not in daily_data:
                    daily_data[checkin['date']] = {
                        'sleep_hours': None,
                        'completed_habits': 0,
                        'completion_rate': 0
                    }
                if checkin['completed']:
                    daily_data[checkin['date']]['completed_habits'] += 1
            
            # Calculate completion rates
            for d in daily_data:
                daily_data[d]['completion_rate'] = (
                    daily_data[d]['completed_habits'] / total_habits
                ) * 100
            
            # Analyze correlations
            insights = []
            
            # Sleep vs Habit completion
            good_sleep_days = [d for d, v in daily_data.items() 
                             if v.get('sleep_hours') and v['sleep_hours'] >= 7]
            poor_sleep_days = [d for d, v in daily_data.items() 
                             if v.get('sleep_hours') and v['sleep_hours'] < 7]
            
            if good_sleep_days and poor_sleep_days:
                good_sleep_completion = sum(
                    daily_data[d]['completion_rate'] for d in good_sleep_days
                ) / len(good_sleep_days)
                
                poor_sleep_completion = sum(
                    daily_data[d]['completion_rate'] for d in poor_sleep_days
                ) / len(poor_sleep_days)
                
                diff = good_sleep_completion - poor_sleep_completion
                
                if diff > 10:
                    insights.append({
                        'type': 'sleep_impact',
                        'title': '😴 Sleep Boosts Your Habits',
                        'description': f'When you sleep 7+ hours, you complete {diff:.0f}% more habits!',
                        'recommendation': 'Prioritize getting 7-9 hours of sleep for better habit completion.',
                        'impact': 'positive'
                    })
            
            # Best performing day
            day_performance = {}
            for d, v in daily_data.items():
                day_name = datetime.strptime(d, '%Y-%m-%d').strftime('%A')
                if day_name not in day_performance:
                    day_performance[day_name] = []
                day_performance[day_name].append(v['completion_rate'])
            
            avg_by_day = {
                day: sum(rates) / len(rates) 
                for day, rates in day_performance.items()
            }
            
            if avg_by_day:
                best_day = max(avg_by_day, key=avg_by_day.get)
                worst_day = min(avg_by_day, key=avg_by_day.get)
                
                insights.append({
                    'type': 'day_pattern',
                    'title': f'📅 {best_day}s Are Your Best Days',
                    'description': f'You complete {avg_by_day[best_day]:.0f}% of habits on {best_day}s vs {avg_by_day[worst_day]:.0f}% on {worst_day}s.',
                    'recommendation': f'Schedule important habits on {best_day}s. Consider lighter goals on {worst_day}s.',
                    'impact': 'neutral'
                })
            
            return {
                'insights': insights,
                'daily_data': daily_data,
                'day_performance': avg_by_day
            }
            
        except Exception as e:
            logging.error(f"Error getting correlations: {str(e)}")
            return {'insights': [], 'daily_data': {}, 'day_performance': {}}
    
    @staticmethod
    def get_prediction(user_id: int) -> Dict[str, Any]:
        """Predict likelihood of completing today's habits"""
        try:
            today = date.today()
            day_name = today.strftime('%A')
            
            # Get historical data for this day
            all_checkins = supabase.table('checkins').select('*').eq(
                'user_id', user_id
            ).execute()
            
            habits = supabase.table('habits').select('*').eq('user_id', user_id).execute()
            total_habits = len(habits.data) if habits.data else 1
            
            # Filter to same day of week
            same_day_completions = []
            for checkin in (all_checkins.data or []):
                checkin_date = datetime.strptime(checkin['date'], '%Y-%m-%d')
                if checkin_date.strftime('%A') == day_name and checkin['completed']:
                    same_day_completions.append(checkin)
            
            # Get today's sleep
            sleep = supabase.table('sleep_records').select('*').eq(
                'user_id', user_id
            ).eq('date', today.strftime('%Y-%m-%d')).execute()
            
            sleep_factor = 1.0
            if sleep.data and sleep.data[0].get('sleep_hours'):
                hours = sleep.data[0]['sleep_hours']
                if hours >= 7:
                    sleep_factor = 1.15  # 15% boost
                elif hours < 6:
                    sleep_factor = 0.85  # 15% penalty
            
            # Calculate base probability
            if len(all_checkins.data or []) > 7:
                completed = len([c for c in all_checkins.data if c['completed']])
                base_rate = completed / len(all_checkins.data)
            else:
                base_rate = 0.5  # Default 50%
            
            # Adjust for day of week
            day_factor = len(same_day_completions) / max(len(all_checkins.data or []) / 7, 1)
            
            # Final prediction
            prediction = min(base_rate * sleep_factor * (1 + day_factor * 0.1), 0.95)
            
            confidence = 'high' if len(all_checkins.data or []) > 30 else 'medium' if len(all_checkins.data or []) > 14 else 'low'
            
            return {
                'success_probability': round(prediction * 100, 1),
                'confidence': confidence,
                'factors': {
                    'day_of_week': day_name,
                    'sleep_impact': 'positive' if sleep_factor > 1 else 'negative' if sleep_factor < 1 else 'neutral',
                    'historical_performance': f'{base_rate * 100:.0f}%'
                },
                'tips': [
                    'Complete your easiest habit first to build momentum',
                    'Set specific times for each habit',
                    'Remove distractions before starting'
                ] if prediction < 0.7 else [
                    'You are on track for a great day!',
                    'Consider tackling a bonus challenge',
                    'Help a friend stay accountable'
                ]
            }
            
        except Exception as e:
            logging.error(f"Error getting prediction: {str(e)}")
            return {
                'success_probability': 50,
                'confidence': 'low',
                'factors': {},
                'tips': []
            }