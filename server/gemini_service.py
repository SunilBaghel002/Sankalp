# server/gemini_service.py
import os
import logging
import google.generativeai as genai
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Use Gemini 1.5 Flash for fast responses
model = genai.GenerativeModel('gemini-1.5-flash')

logging.basicConfig(level=logging.INFO)


async def generate_motivational_quote(
    user_name: str,
    current_streak: int,
    habits_completed_today: int,
    total_habits: int
) -> Dict[str, str]:
    """Generate personalized motivational quote using Gemini"""
    try:
        prompt = f"""
        Generate a motivational quote for {user_name} who is building habits.
        
        Current stats:
        - Current streak: {current_streak} days
        - Habits completed today: {habits_completed_today}/{total_habits}
        
        Provide a response in JSON format with:
        - "quote": An inspiring quote (not from famous person, create original)
        - "author": "Sankalp AI Coach"
        - "personalized_message": A short personal message based on their progress
        
        Keep it encouraging, specific to their progress, and motivating!
        """
        
        response = model.generate_content(prompt)
        
        # Parse response (simplified - in production use proper JSON parsing)
        import json
        try:
            result = json.loads(response.text)
        except:
            # Fallback if JSON parsing fails
            result = {
                "quote": "Every small step forward is a victory worth celebrating.",
                "author": "Sankalp AI Coach",
                "personalized_message": f"You're on day {current_streak}! Keep building momentum! 💪"
            }
        
        return result
    except Exception as e:
        logging.error(f"Gemini API error: {str(e)}")
        return {
            "quote": "Consistency is the key to transformation.",
            "author": "Sankalp AI Coach",
            "personalized_message": "Keep going strong! 🌟"
        }


async def generate_habit_tips(
    habits: List[Dict],
    completion_rate: float
) -> Dict[str, Any]:
    """Generate personalized habit tips"""
    try:
        habit_names = [h['name'] for h in habits[:3]]  # Top 3 habits
        
        prompt = f"""
        Provide 3 actionable tips for someone working on these habits:
        {', '.join(habit_names)}
        
        Their current completion rate is {completion_rate:.1f}%
        
        Return JSON with:
        - "tips": Array of 3 specific, actionable tips
        - "focus_area": One word describing what they should focus on
        - "weekly_challenge": A specific challenge for this week
        
        Make it practical and encouraging!
        """
        
        response = model.generate_content(prompt)
        
        import json
        try:
            result = json.loads(response.text)
        except:
            result = {
                "tips": [
                    "Start with your hardest habit first thing in the morning",
                    "Link new habits to existing routines",
                    "Track your progress visually"
                ],
                "focus_area": "Consistency",
                "weekly_challenge": "Complete all habits for 7 days straight!"
            }
        
        return result
    except Exception as e:
        logging.error(f"Error generating tips: {str(e)}")
        return {
            "tips": ["Stay consistent", "Start small", "Track progress"],
            "focus_area": "Momentum",
            "weekly_challenge": "Don't break the chain this week!"
        }


async def generate_daily_affirmation(user_name: str, day_number: int) -> str:
    """Generate daily affirmation"""
    try:
        prompt = f"""
        Create a powerful daily affirmation for {user_name} who is on day {day_number} of their 100-day habit journey.
        
        Make it:
        - Personal and empowering
        - Related to habit building
        - Positive and present tense
        - One sentence, max 20 words
        
        Just return the affirmation text, nothing else.
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logging.error(f"Error generating affirmation: {str(e)}")
        return f"I am building the life I want, one day at a time. Day {day_number} strong! 💪"


async def generate_thought_reflection(thought: str, date: str) -> Dict[str, str]:
    """Generate AI reflection on user's daily thought"""
    try:
        prompt = f"""
        A user recorded this positive thought on {date}:
        "{thought}"
        
        Provide a brief reflection in JSON format:
        - "reflection": 1-2 sentences acknowledging and expanding on their thought
        - "related_quote": A related inspirational quote
        - "action_item": One small action they can take today based on this thought
        
        Be warm, encouraging, and insightful!
        """
        
        response = model.generate_content(prompt)
        
        import json
        try:
            result = json.loads(response.text)
        except:
            result = {
                "reflection": "What a beautiful perspective! This shows real growth mindset.",
                "related_quote": "The quality of your thoughts determines the quality of your life.",
                "action_item": "Share this positive energy with someone today."
            }
        
        return result
    except Exception as e:
        logging.error(f"Error generating reflection: {str(e)}")
        return {
            "reflection": "Thank you for sharing this thought!",
            "related_quote": "Positive thoughts create positive outcomes.",
            "action_item": "Keep reflecting on what matters most."
        }


async def generate_sleep_insights(
    average_sleep: float,
    sleep_pattern: List[Dict],
    habit_completion_rate: float
) -> Dict[str, str]:
    """Generate insights about sleep patterns"""
    try:
        prompt = f"""
        Analyze this sleep data:
        - Average sleep: {average_sleep} hours
        - Habit completion rate: {habit_completion_rate}%
        - Recent sleep pattern: {len(sleep_pattern)} days tracked
        
        Provide insights in JSON:
        - "insight": Main observation about their sleep
        - "recommendation": Specific actionable advice
        - "correlation": How sleep might be affecting their habit success
        
        Be scientific but friendly!
        """
        
        response = model.generate_content(prompt)
        
        import json
        try:
            result = json.loads(response.text)
        except:
            quality = "good" if average_sleep >= 7 else "needs improvement"
            result = {
                "insight": f"Your average of {average_sleep}h is {quality}.",
                "recommendation": "Aim for 7-8 hours of consistent sleep.",
                "correlation": "Better sleep typically leads to better habit completion!"
            }
        
        return result
    except Exception as e:
        logging.error(f"Error generating sleep insights: {str(e)}")
        return {
            "insight": "Sleep is foundational to habit success.",
            "recommendation": "Maintain a consistent sleep schedule.",
            "correlation": "Well-rested minds build better habits!"
        }


async def generate_weekly_report(
    user_name: str,
    habits: List[Dict],
    weekly_stats: Dict,
    sleep_data: List[Dict],
    thoughts: List[str]
) -> Dict[str, Any]:
    """Generate comprehensive weekly report"""
    try:
        prompt = f"""
        Create a weekly report for {user_name}.
        
        This week:
        - Perfect days: {weekly_stats.get('perfect_days', 0)}/7
        - Average completion: {weekly_stats.get('avg_completion', 0)}%
        - Current streak: {weekly_stats.get('current_streak', 0)} days
        - Sleep records: {len(sleep_data)} days
        - Thoughts recorded: {len(thoughts)} days
        
        Habits: {', '.join([h['name'] for h in habits[:3]])}
        
        Provide JSON with:
        - "summary": 2-3 sentence overview of the week
        - "highlights": Array of 3 specific wins/achievements
        - "areas_to_improve": Array of 2 specific areas
        - "next_week_focus": One main focus for next week
        - "motivational_message": Encouraging closing message
        
        Be specific, data-driven, and encouraging!
        """
        
        response = model.generate_content(prompt)
        
        import json
        try:
            result = json.loads(response.text)
        except:
            result = {
                "summary": "You made solid progress this week!",
                "highlights": ["Maintained consistency", "Tracked your habits", "Showed up daily"],
                "areas_to_improve": ["Sleep consistency", "Thought journaling"],
                "next_week_focus": "Aim for 7/7 perfect days",
                "motivational_message": "Every week is a new opportunity! 🚀"
            }
        
        return result
    except Exception as e:
        logging.error(f"Error generating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "summary": "Keep building momentum!",
            "highlights": ["Consistency is key"],
            "areas_to_improve": ["Stay focused"],
            "next_week_focus": "Build on this week's progress",
            "motivational_message": "You're doing great! 💪"
        }


async def chat_with_habit_coach(message: str, user_context: Dict) -> str:
    """Chat with AI habit coach"""
    try:
        prompt = f"""
        You are a supportive habit-building coach. The user has:
        - {user_context.get('total_habits', 5)} daily habits
        - {user_context.get('current_streak', 0)} day streak
        - {user_context.get('total_days', 0)} total completed days
        
        User message: "{message}"
        
        Respond in a friendly, encouraging way. Give specific advice.
        Keep response to 2-3 sentences. Be conversational and supportive!
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        return "I'm here to help you build lasting habits! What challenges are you facing?"