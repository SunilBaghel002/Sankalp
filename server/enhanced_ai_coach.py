# server/enhanced_ai_coach.py
import os
import logging
import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from database import supabase

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

logging.basicConfig(level=logging.INFO)

# Initialize model
_model = None

def get_model():
    global _model
    if _model is None:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel('gemini-1.5-flash')
    return _model


class ConversationManager:
    """Manage AI coach conversations with memory"""
    
    @staticmethod
    def get_conversation_history(user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        try:
            response = supabase.table('ai_conversations').select('*').eq(
                'user_id', user_id
            ).order('created_at', desc=True).limit(limit).execute()
            
            return list(reversed(response.data)) if response.data else []
        except Exception as e:
            logging.error(f"Error getting conversation: {str(e)}")
            return []
    
    @staticmethod
    def save_message(user_id: int, role: str, content: str, metadata: Dict = None):
        """Save a message to conversation history"""
        try:
            supabase.table('ai_conversations').insert({
                'user_id': user_id,
                'role': role,
                'content': content,
                'metadata': metadata or {},
                'created_at': datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logging.error(f"Error saving message: {str(e)}")
    
    @staticmethod
    def clear_history(user_id: int):
        """Clear conversation history"""
        try:
            supabase.table('ai_conversations').delete().eq('user_id', user_id).execute()
        except Exception as e:
            logging.error(f"Error clearing history: {str(e)}")


class EnhancedAICoach:
    """Enhanced AI Coach with memory, context, and proactive insights"""
    
    @staticmethod
    def get_user_context(user_id: int) -> Dict[str, Any]:
        """Get comprehensive user context for AI"""
        try:
            # User info
            user = supabase.table('users').select('*').eq('id', user_id).single().execute()
            
            # Habits
            habits = supabase.table('habits').select('*').eq('user_id', user_id).execute()
            
            # Recent checkins
            today = date.today()
            week_ago = today - timedelta(days=7)
            checkins = supabase.table('checkins').select('*').eq(
                'user_id', user_id
            ).gte('date', week_ago.strftime('%Y-%m-%d')).execute()
            
            # Streaks
            streaks = supabase.table('habit_streaks').select('*').eq('user_id', user_id).execute()
            
            # Recent sleep
            sleep = supabase.table('sleep_records').select('*').eq(
                'user_id', user_id
            ).order('date', desc=True).limit(7).execute()
            
            # Recent thoughts
            thoughts = supabase.table('daily_thoughts').select('*').eq(
                'user_id', user_id
            ).order('date', desc=True).limit(5).execute()
            
            # Calculate metrics
            habit_list = habits.data or []
            checkin_list = checkins.data or []
            
            total_habits = len(habit_list)
            completed_today = len([c for c in checkin_list 
                                  if c['date'] == today.strftime('%Y-%m-%d') and c['completed']])
            
            # Weekly completion rate
            weekly_completed = len([c for c in checkin_list if c['completed']])
            weekly_possible = total_habits * 7
            weekly_rate = (weekly_completed / weekly_possible * 100) if weekly_possible > 0 else 0
            
            # Best streak
            best_streak = max([s['best_streak'] for s in (streaks.data or [])], default=0)
            current_streaks = [s['current_streak'] for s in (streaks.data or []) if s['current_streak'] > 0]
            
            # Average sleep
            sleep_hours = [s['sleep_hours'] for s in (sleep.data or []) if s.get('sleep_hours')]
            avg_sleep = sum(sleep_hours) / len(sleep_hours) if sleep_hours else 0
            
            # Recent mood from thoughts
            recent_thoughts = [t['thought'] for t in (thoughts.data or [])]
            
            return {
                'user_name': user.data.get('name', 'Friend').split()[0] if user.data else 'Friend',
                'total_habits': total_habits,
                'habits': [{'name': h['name'], 'category': h.get('category', 'general')} for h in habit_list],
                'completed_today': completed_today,
                'weekly_completion_rate': round(weekly_rate, 1),
                'current_streaks': current_streaks,
                'best_streak': best_streak,
                'average_sleep': round(avg_sleep, 1),
                'recent_thoughts': recent_thoughts,
                'total_xp': user.data.get('total_xp', 0) if user.data else 0,
                'days_active': user.data.get('total_completed_days', 0) if user.data else 0
            }
            
        except Exception as e:
            logging.error(f"Error getting user context: {str(e)}")
            return {
                'user_name': 'Friend',
                'total_habits': 0,
                'habits': [],
                'completed_today': 0,
                'weekly_completion_rate': 0,
                'current_streaks': [],
                'best_streak': 0,
                'average_sleep': 0,
                'recent_thoughts': [],
                'total_xp': 0,
                'days_active': 0
            }
    
    @staticmethod
    async def chat(user_id: int, message: str) -> Dict[str, Any]:
        """Chat with enhanced context and memory"""
        try:
            # Get context
            context = EnhancedAICoach.get_user_context(user_id)
            
            # Get conversation history
            history = ConversationManager.get_conversation_history(user_id, limit=6)
            
            # Build conversation for AI
            conversation_text = ""
            for msg in history:
                role = "User" if msg['role'] == 'user' else "Coach"
                conversation_text += f"{role}: {msg['content']}\n"
            
            # Build prompt
            prompt = f"""You are Sankalp AI Coach, a friendly and knowledgeable habit-building assistant.

USER CONTEXT:
- Name: {context['user_name']}
- Has {context['total_habits']} habits: {', '.join([h['name'] for h in context['habits'][:5]])}
- Completed {context['completed_today']}/{context['total_habits']} habits today
- Weekly completion rate: {context['weekly_completion_rate']}%
- Active streaks: {len(context['current_streaks'])} habits
- Best streak ever: {context['best_streak']} days
- Average sleep: {context['average_sleep']} hours
- Total XP: {context['total_xp']}
- Days active: {context['days_active']}

RECENT CONVERSATION:
{conversation_text}

CURRENT MESSAGE FROM USER:
{message}

INSTRUCTIONS:
1. Be warm, personal, and reference their actual data when relevant
2. Remember context from the conversation
3. Give specific, actionable advice
4. Be encouraging but honest
5. Use their name occasionally
6. Keep responses 2-4 sentences unless they ask for more detail
7. If they seem stuck, offer specific strategies based on their habits

Respond naturally:"""

            model = get_model()
            response = model.generate_content(prompt)
            
            ai_response = response.text.strip() if response.text else "I'm here to help! What's on your mind?"
            
            # Save to conversation history
            ConversationManager.save_message(user_id, 'user', message)
            ConversationManager.save_message(user_id, 'assistant', ai_response, {
                'context_used': True,
                'habits_referenced': context['total_habits']
            })
            
            # Detect if we should offer proactive suggestions
            suggestions = []
            if context['completed_today'] == 0 and datetime.now().hour >= 12:
                suggestions.append({
                    'type': 'reminder',
                    'message': "You haven't checked in any habits today. Want me to help you get started?"
                })
            
            if context['average_sleep'] < 7:
                suggestions.append({
                    'type': 'insight',
                    'message': "I noticed your sleep has been below optimal. Better sleep = better habits!"
                })
            
            return {
                'response': ai_response,
                'suggestions': suggestions,
                'context': {
                    'habits_today': f"{context['completed_today']}/{context['total_habits']}",
                    'streak_count': len(context['current_streaks'])
                }
            }
            
        except Exception as e:
            logging.error(f"Error in enhanced chat: {str(e)}")
            return {
                'response': "I'm here to help you build great habits! What would you like to work on?",
                'suggestions': [],
                'context': {}
            }
    
    @staticmethod
    async def get_proactive_insight(user_id: int) -> Optional[Dict[str, Any]]:
        """Generate proactive insight based on user data"""
        try:
            context = EnhancedAICoach.get_user_context(user_id)
            
            insights = []
            
            # Check for patterns
            if context['completed_today'] == context['total_habits'] and context['total_habits'] > 0:
                insights.append({
                    'type': 'celebration',
                    'title': '🎉 Perfect Day!',
                    'message': f"Amazing work, {context['user_name']}! You've completed all your habits today!"
                })
            
            if len(context['current_streaks']) > 0 and max(context['current_streaks']) == 7:
                insights.append({
                    'type': 'milestone',
                    'title': '🔥 Week Warrior!',
                    'message': "You've hit a 7-day streak! You're building real momentum!"
                })
            
            if context['weekly_completion_rate'] < 50 and context['days_active'] > 7:
                insights.append({
                    'type': 'encouragement',
                    'title': '💪 You Can Do This!',
                    'message': "I see you've been struggling this week. Remember, progress isn't linear. Start with just one habit today."
                })
            
            if context['average_sleep'] >= 7.5:
                insights.append({
                    'type': 'positive',
                    'title': '😴 Sleep Champion!',
                    'message': "Your sleep has been great! This is fueling your habit success."
                })
            
            return insights[0] if insights else None
            
        except Exception as e:
            logging.error(f"Error getting proactive insight: {str(e)}")
            return None
    
    @staticmethod
    async def generate_weekly_coaching_plan(user_id: int) -> Dict[str, Any]:
        """Generate personalized weekly coaching plan"""
        try:
            context = EnhancedAICoach.get_user_context(user_id)
            
            prompt = f"""Create a personalized weekly coaching plan for {context['user_name']}.

Their current situation:
- {context['total_habits']} habits to track
- {context['weekly_completion_rate']}% weekly completion rate
- Best streak: {context['best_streak']} days
- Average sleep: {context['average_sleep']} hours
- Habits: {', '.join([h['name'] for h in context['habits']])}

Create a JSON response with:
{{
    "focus_area": "main thing to focus on this week",
    "daily_tips": [
        {{"day": "Monday", "tip": "specific tip"}},
        ...for each day
    ],
    "mini_challenge": "a fun challenge for the week",
    "affirmation": "personalized affirmation",
    "goal": "specific measurable goal for the week"
}}"""

            model = get_model()
            response = model.generate_content(prompt)
            
            try:
                # Try to parse JSON from response
                import re
                json_match = re.search(r'\{[\s\S]*\}', response.text)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass
            
            # Fallback plan
            return {
                "focus_area": "Building consistency",
                "daily_tips": [
                    {"day": "Monday", "tip": "Start the week strong - complete your hardest habit first"},
                    {"day": "Tuesday", "tip": "Review your why for each habit"},
                    {"day": "Wednesday", "tip": "Midweek check-in - how are you feeling?"},
                    {"day": "Thursday", "tip": "Try a new approach for any struggling habits"},
                    {"day": "Friday", "tip": "Celebrate your wins from the week"},
                    {"day": "Saturday", "tip": "Rest is productive too - focus on sleep"},
                    {"day": "Sunday", "tip": "Plan and prepare for next week"}
                ],
                "mini_challenge": "Complete all habits before noon for 3 days",
                "affirmation": f"{context['user_name']}, you are building an incredible life one habit at a time!",
                "goal": "Achieve 80% completion rate this week"
            }
            
        except Exception as e:
            logging.error(f"Error generating coaching plan: {str(e)}")
            return {}