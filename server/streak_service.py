# server/streak_service.py
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)


class StreakService:
    """Service for managing habit streaks"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def get_streak_details(self, user_id: int) -> Dict[str, Any]:
        """Get detailed streak information for a user"""
        try:
            # Get habits
            habits_response = self.supabase.table('habits').select('*').eq(
                'user_id', user_id
            ).execute()
            habits = habits_response.data or []
            total_habits = len(habits)
            
            if total_habits == 0:
                return self._empty_streak_response()
            
            # Get all checkins
            checkins_response = self.supabase.table('checkins').select('*').eq(
                'user_id', user_id
            ).order('date', desc=True).execute()
            checkins = checkins_response.data or []
            
            # Group checkins by date
            checkins_by_date = {}
            for checkin in checkins:
                date_str = str(checkin['date'])
                if date_str not in checkins_by_date:
                    checkins_by_date[date_str] = {'completed': [], 'missed': []}
                
                habit = next((h for h in habits if h['id'] == checkin['habit_id']), None)
                habit_name = habit['name'] if habit else f"Habit {checkin['habit_id']}"
                
                if checkin['completed']:
                    checkins_by_date[date_str]['completed'].append(habit_name)
                else:
                    checkins_by_date[date_str]['missed'].append(habit_name)
            
            # Calculate current streak
            today = date.today()
            current_streak = 0
            streak_start_date = None
            current_date = today
            
            while True:
                date_str = current_date.strftime('%Y-%m-%d')
                
                if date_str in checkins_by_date:
                    completed_count = len(checkins_by_date[date_str]['completed'])
                    if completed_count == total_habits:
                        current_streak += 1
                        streak_start_date = current_date
                        current_date -= timedelta(days=1)
                    else:
                        break
                else:
                    if current_streak == 0 and current_date == today:
                        # Today not completed yet, check yesterday
                        current_date -= timedelta(days=1)
                    else:
                        break
            
            # Calculate longest streak
            longest_streak = 0
            longest_streak_start = None
            longest_streak_end = None
            current_run = 0
            run_start = None
            
            if checkins_by_date:
                all_dates = sorted(checkins_by_date.keys())
                first_date = datetime.strptime(all_dates[0], '%Y-%m-%d').date()
                last_date = datetime.strptime(all_dates[-1], '%Y-%m-%d').date()
                
                check_date = first_date
                while check_date <= last_date:
                    date_str = check_date.strftime('%Y-%m-%d')
                    
                    if date_str in checkins_by_date:
                        completed_count = len(checkins_by_date[date_str]['completed'])
                        if completed_count == total_habits:
                            if current_run == 0:
                                run_start = check_date
                            current_run += 1
                            
                            if current_run > longest_streak:
                                longest_streak = current_run
                                longest_streak_start = run_start
                                longest_streak_end = check_date
                        else:
                            current_run = 0
                    else:
                        current_run = 0
                    
                    check_date += timedelta(days=1)
            
            # Calculate streak history (last 30 days)
            streak_history = []
            for i in range(29, -1, -1):
                check_date = today - timedelta(days=i)
                date_str = check_date.strftime('%Y-%m-%d')
                
                day_data = {
                    'date': date_str,
                    'day_name': check_date.strftime('%a'),
                    'day_number': check_date.day,
                    'is_today': check_date == today,
                    'is_future': check_date > today,
                    'completed': False,
                    'partial': False,
                    'completed_count': 0,
                    'total_habits': total_habits
                }
                
                if date_str in checkins_by_date:
                    completed_count = len(checkins_by_date[date_str]['completed'])
                    day_data['completed_count'] = completed_count
                    day_data['completed'] = completed_count == total_habits
                    day_data['partial'] = 0 < completed_count < total_habits
                
                streak_history.append(day_data)
            
            # Calculate completion rate
            total_possible = 0
            total_completed = 0
            
            for date_str, data in checkins_by_date.items():
                total_possible += total_habits
                total_completed += len(data['completed'])
            
            completion_rate = (total_completed / max(total_possible, 1)) * 100
            
            # Get per-habit streaks
            habit_streaks = []
            for habit in habits:
                habit_streak = self._calculate_habit_streak(habit['id'], checkins)
                habit_streaks.append({
                    'id': habit['id'],
                    'name': habit['name'],
                    'current_streak': habit_streak['current'],
                    'longest_streak': habit_streak['longest'],
                    'completion_rate': habit_streak['rate']
                })
            
            # Determine streak status
            if current_streak == 0:
                status = 'inactive'
                status_message = "Start completing habits to build your streak!"
            elif current_streak < 7:
                status = 'building'
                status_message = f"Great start! {7 - current_streak} more days to your first milestone!"
            elif current_streak < 21:
                status = 'growing'
                status_message = f"You're building momentum! {21 - current_streak} days to habit formation!"
            elif current_streak < 30:
                status = 'strong'
                status_message = f"Amazing! {30 - current_streak} days to a full month!"
            elif current_streak < 66:
                status = 'powerful'
                status_message = f"Incredible! {66 - current_streak} days to habit mastery!"
            elif current_streak < 100:
                status = 'unstoppable'
                status_message = f"Legendary! {100 - current_streak} days to complete the challenge!"
            else:
                status = 'champion'
                status_message = "You've completed the 100-day challenge! 🏆"
            
            return {
                'current_streak': current_streak,
                'longest_streak': longest_streak,
                'streak_start_date': streak_start_date.strftime('%Y-%m-%d') if streak_start_date else None,
                'longest_streak_period': {
                    'start': longest_streak_start.strftime('%Y-%m-%d') if longest_streak_start else None,
                    'end': longest_streak_end.strftime('%Y-%m-%d') if longest_streak_end else None,
                    'days': longest_streak
                },
                'status': status,
                'status_message': status_message,
                'completion_rate': round(completion_rate, 1),
                'total_habits': total_habits,
                'streak_history': streak_history,
                'habit_streaks': habit_streaks,
                'milestones': self._get_streak_milestones(current_streak, longest_streak),
                'next_milestone': self._get_next_milestone(current_streak)
            }
            
        except Exception as e:
            logging.error(f"Error getting streak details: {str(e)}")
            import traceback
            traceback.print_exc()
            return self._empty_streak_response()
    
    def _calculate_habit_streak(
        self, habit_id: int, all_checkins: List[Dict]
    ) -> Dict[str, Any]:
        """Calculate streak for a specific habit"""
        habit_checkins = [c for c in all_checkins if c['habit_id'] == habit_id]
        
        if not habit_checkins:
            return {'current': 0, 'longest': 0, 'rate': 0}
        
        # Sort by date descending
        habit_checkins.sort(key=lambda x: x['date'], reverse=True)
        
        # Calculate current streak
        current_streak = 0
        today = date.today()
        current_date = today
        
        completed_dates = set(
            str(c['date']) for c in habit_checkins if c['completed']
        )
        
        while True:
            date_str = current_date.strftime('%Y-%m-%d')
            if date_str in completed_dates:
                current_streak += 1
                current_date -= timedelta(days=1)
            else:
                if current_streak == 0 and current_date == today:
                    current_date -= timedelta(days=1)
                else:
                    break
        
        # Calculate longest streak
        all_dates = sorted(set(str(c['date']) for c in habit_checkins))
        longest_streak = 0
        current_run = 0
        
        if all_dates:
            first_date = datetime.strptime(all_dates[0], '%Y-%m-%d').date()
            last_date = datetime.strptime(all_dates[-1], '%Y-%m-%d').date()
            
            check_date = first_date
            while check_date <= last_date:
                date_str = check_date.strftime('%Y-%m-%d')
                if date_str in completed_dates:
                    current_run += 1
                    longest_streak = max(longest_streak, current_run)
                else:
                    current_run = 0
                check_date += timedelta(days=1)
        
        # Calculate completion rate
        total_checkins = len(habit_checkins)
        completed_checkins = len([c for c in habit_checkins if c['completed']])
        rate = (completed_checkins / max(total_checkins, 1)) * 100
        
        return {
            'current': current_streak,
            'longest': longest_streak,
            'rate': round(rate, 1)
        }
    
    def _get_streak_milestones(
        self, current_streak: int, longest_streak: int
    ) -> List[Dict[str, Any]]:
        """Get streak milestones with completion status"""
        milestones = [
            {'days': 3, 'name': 'Getting Started', 'icon': '🌱', 'xp': 25},
            {'days': 7, 'name': 'One Week', 'icon': '🔥', 'xp': 50},
            {'days': 14, 'name': 'Two Weeks', 'icon': '💪', 'xp': 100},
            {'days': 21, 'name': 'Habit Formed', 'icon': '🧠', 'xp': 150},
            {'days': 30, 'name': 'One Month', 'icon': '🌟', 'xp': 200},
            {'days': 50, 'name': 'Halfway Hero', 'icon': '🚀', 'xp': 350},
            {'days': 66, 'name': 'Habit Master', 'icon': '🏅', 'xp': 500},
            {'days': 100, 'name': 'Century Champion', 'icon': '👑', 'xp': 1000},
        ]
        
        for milestone in milestones:
            milestone['achieved'] = longest_streak >= milestone['days']
            milestone['current'] = current_streak >= milestone['days']
            milestone['progress'] = min(100, (current_streak / milestone['days']) * 100)
        
        return milestones
    
    def _get_next_milestone(self, current_streak: int) -> Optional[Dict[str, Any]]:
        """Get the next milestone to achieve"""
        milestone_days = [3, 7, 14, 21, 30, 50, 66, 100]
        
        for days in milestone_days:
            if current_streak < days:
                return {
                    'days': days,
                    'days_remaining': days - current_streak,
                    'progress': (current_streak / days) * 100
                }
        
        return None
    
    def _empty_streak_response(self) -> Dict[str, Any]:
        """Return empty streak response"""
        return {
            'current_streak': 0,
            'longest_streak': 0,
            'streak_start_date': None,
            'longest_streak_period': {'start': None, 'end': None, 'days': 0},
            'status': 'inactive',
            'status_message': 'Add some habits to start building your streak!',
            'completion_rate': 0,
            'total_habits': 0,
            'streak_history': [],
            'habit_streaks': [],
            'milestones': [],
            'next_milestone': {'days': 3, 'days_remaining': 3, 'progress': 0}
        }
    
    def check_streak_at_risk(self, user_id: int) -> Dict[str, Any]:
        """Check if user's streak is at risk today"""
        try:
            today = date.today()
            today_str = today.strftime('%Y-%m-%d')
            
            # Get habits
            habits_response = self.supabase.table('habits').select('*').eq(
                'user_id', user_id
            ).execute()
            habits = habits_response.data or []
            total_habits = len(habits)
            
            if total_habits == 0:
                return {'at_risk': False, 'reason': 'No habits'}
            
            # Get today's checkins
            checkins_response = self.supabase.table('checkins').select('*').eq(
                'user_id', user_id
            ).eq('date', today_str).eq('completed', True).execute()
            
            completed_today = len(checkins_response.data or [])
            incomplete_today = total_habits - completed_today
            
            # Get current streak
            streak_details = self.get_streak_details(user_id)
            current_streak = streak_details['current_streak']
            
            # Check if at risk
            current_hour = datetime.now().hour
            at_risk = incomplete_today > 0 and current_hour >= 18 and current_streak > 0
            
            return {
                'at_risk': at_risk,
                'current_streak': current_streak,
                'completed_today': completed_today,
                'incomplete_today': incomplete_today,
                'total_habits': total_habits,
                'hours_remaining': max(0, 24 - current_hour),
                'incomplete_habits': [
                    h['name'] for h in habits
                    if h['id'] not in [c['habit_id'] for c in (checkins_response.data or [])]
                ]
            }
            
        except Exception as e:
            logging.error(f"Error checking streak at risk: {str(e)}")
            return {'at_risk': False, 'error': str(e)}