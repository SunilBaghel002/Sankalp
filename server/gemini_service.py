# server/gemini_service.py
import os
import logging
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

logging.basicConfig(level=logging.INFO)

# Initialize model as None, will be set up on first use
_model = None

def get_model():
    """Get or create the Gemini model instance"""
    global _model
    
    if _model is None:
        if not GEMINI_API_KEY:
            logging.error("❌ GEMINI_API_KEY not set in environment!")
            raise ValueError("GEMINI_API_KEY not configured")
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            _model = genai.GenerativeModel('gemini-1.5-flash')
            logging.info("✅ Gemini model initialized successfully")
        except Exception as e:
            logging.error(f"❌ Failed to initialize Gemini: {str(e)}")
            raise
    
    return _model


def extract_json_from_response(text: str) -> Optional[Dict]:
    """Extract JSON from Gemini response which might contain markdown"""
    try:
        # First try direct JSON parse
        return json.loads(text)
    except:
        pass
    
    # Try to find JSON in markdown code blocks
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if json_match:
        try:
            return json.loads(json_match.group(1).strip())
        except:
            pass
    
    # Try to find JSON object in text
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except:
            pass
    
    return None


def generate_content_sync(prompt: str) -> str:
    """Synchronous content generation"""
    try:
        model = get_model()
        response = model.generate_content(prompt)
        
        if response and response.text:
            return response.text.strip()
        else:
            logging.warning("Empty response from Gemini")
            return ""
    except Exception as e:
        logging.error(f"Gemini generate_content error: {str(e)}")
        raise


async def generate_motivational_quote(
    user_name: str,
    current_streak: int,
    habits_completed_today: int,
    total_habits: int
) -> Dict[str, str]:
    """Generate personalized motivational quote using Gemini"""
    try:
        prompt = f"""Generate a motivational message for {user_name} who is building habits.

Current stats:
- Current streak: {current_streak} days
- Habits completed today: {habits_completed_today}/{total_habits}

Respond with ONLY valid JSON (no markdown, no explanation):
{{"quote": "An inspiring original quote", "author": "Sankalp AI Coach", "personalized_message": "A short personal message based on their progress"}}
"""
        
        response_text = generate_content_sync(prompt)
        result = extract_json_from_response(response_text)
        
        if result and all(k in result for k in ["quote", "author", "personalized_message"]):
            return result
        
        # Fallback
        return {
            "quote": "Every small step forward is a victory worth celebrating.",
            "author": "Sankalp AI Coach",
            "personalized_message": f"Day {current_streak} strong! You've got {habits_completed_today}/{total_habits} habits done today. Keep pushing! 💪"
        }
        
    except Exception as e:
        logging.error(f"Gemini API error in motivational_quote: {str(e)}")
        return {
            "quote": "Consistency is the key to transformation.",
            "author": "Sankalp AI Coach",
            "personalized_message": f"Keep going strong! You're on day {current_streak}! 🌟"
        }


async def generate_habit_tips(
    habits: List[Dict],
    completion_rate: float
) -> Dict[str, Any]:
    """Generate personalized habit tips"""
    try:
        habit_names = [h.get('name', 'habit') for h in habits[:3]] if habits else ["daily habits"]
        
        prompt = f"""Provide 3 actionable tips for someone working on these habits: {', '.join(habit_names)}
Their current completion rate is {completion_rate:.1f}%

Respond with ONLY valid JSON (no markdown):
{{"tips": ["tip1", "tip2", "tip3"], "focus_area": "one word focus", "weekly_challenge": "specific challenge"}}
"""
        
        response_text = generate_content_sync(prompt)
        result = extract_json_from_response(response_text)
        
        if result and "tips" in result:
            return result
        
        return {
            "tips": [
                "Start with your hardest habit first thing in the morning",
                "Link new habits to existing routines",
                "Track your progress visually every day"
            ],
            "focus_area": "Consistency",
            "weekly_challenge": "Complete all habits for 7 days straight!"
        }
        
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
        prompt = f"""Create a powerful daily affirmation for {user_name} who is on day {day_number} of their 100-day habit journey.

Requirements:
- Personal and empowering
- Related to habit building
- Positive and present tense
- One sentence, max 20 words

Respond with ONLY the affirmation text, nothing else."""
        
        response_text = generate_content_sync(prompt)
        
        # Clean up response
        affirmation = response_text.strip().strip('"').strip("'")
        
        if len(affirmation) > 10:
            return affirmation
        
        return f"I am becoming stronger every day. Day {day_number} of my transformation! 💪"
        
    except Exception as e:
        logging.error(f"Error generating affirmation: {str(e)}")
        return f"I am building the life I want, one day at a time. Day {day_number} strong! 💪"


async def generate_thought_reflection(thought: str, date: str) -> Dict[str, str]:
    """Generate AI reflection on user's daily thought"""
    try:
        prompt = f"""A user recorded this thought on {date}: "{thought}"

Provide a brief, warm reflection. Respond with ONLY valid JSON:
{{"reflection": "1-2 sentences acknowledging their thought", "related_quote": "An inspirational quote", "action_item": "One small action for today"}}
"""
        
        response_text = generate_content_sync(prompt)
        result = extract_json_from_response(response_text)
        
        if result and all(k in result for k in ["reflection", "related_quote", "action_item"]):
            return result
        
        return {
            "reflection": "What a beautiful perspective! This shows real growth mindset.",
            "related_quote": "The quality of your thoughts determines the quality of your life.",
            "action_item": "Share this positive energy with someone today."
        }
        
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
        prompt = f"""Analyze this sleep data:
- Average sleep: {average_sleep} hours
- Habit completion rate: {habit_completion_rate}%
- Days tracked: {len(sleep_pattern)}

Respond with ONLY valid JSON:
{{"insight": "Main observation about their sleep", "recommendation": "Specific actionable advice", "correlation": "How sleep affects habit success"}}
"""
        
        response_text = generate_content_sync(prompt)
        result = extract_json_from_response(response_text)
        
        if result and all(k in result for k in ["insight", "recommendation", "correlation"]):
            return result
        
        quality = "good" if average_sleep >= 7 else "could be improved"
        return {
            "insight": f"Your average of {average_sleep}h sleep is {quality}.",
            "recommendation": "Aim for 7-8 hours of consistent sleep each night.",
            "correlation": "Better sleep typically leads to better habit completion!"
        }
        
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
        habit_names = [h.get('name', 'habit') for h in habits[:3]] if habits else ["habits"]
        
        prompt = f"""Create a weekly report for {user_name}.

This week:
- Perfect days: {weekly_stats.get('perfect_days', 0)}/7
- Average completion: {weekly_stats.get('avg_completion', 0)}%
- Current streak: {weekly_stats.get('current_streak', 0)} days
- Sleep tracked: {len(sleep_data)} days
- Thoughts recorded: {len(thoughts)}
- Habits: {', '.join(habit_names)}

Respond with ONLY valid JSON:
{{"summary": "2-3 sentence overview", "highlights": ["win1", "win2", "win3"], "areas_to_improve": ["area1", "area2"], "next_week_focus": "main focus", "motivational_message": "encouraging message"}}
"""
        
        response_text = generate_content_sync(prompt)
        result = extract_json_from_response(response_text)
        
        if result and "summary" in result:
            return result
        
        return {
            "summary": f"You showed up {weekly_stats.get('perfect_days', 0)} out of 7 days this week!",
            "highlights": ["Maintained consistency", "Tracked your habits", "Showed up daily"],
            "areas_to_improve": ["Sleep consistency", "Complete all habits daily"],
            "next_week_focus": "Aim for 7/7 perfect days",
            "motivational_message": "Every week is a new opportunity! 🚀"
        }
        
    except Exception as e:
        logging.error(f"Error generating report: {str(e)}")
        return {
            "summary": "Keep building momentum!",
            "highlights": ["You're making progress", "Consistency is key"],
            "areas_to_improve": ["Stay focused on your goals"],
            "next_week_focus": "Build on this week's progress",
            "motivational_message": "You're doing great! 💪"
        }


async def chat_with_habit_coach(message: str, user_context: Dict) -> str:
    """Chat with AI habit coach - THE MAIN FIX"""
    try:
        # Validate API key first
        if not GEMINI_API_KEY:
            logging.error("GEMINI_API_KEY not configured!")
            return "I'm having trouble connecting right now. Please make sure the AI service is configured properly."
        
        total_habits = user_context.get('total_habits', 0)
        current_streak = user_context.get('current_streak', 0)
        total_days = user_context.get('total_days', 0)
        
        prompt = f"""You are Sankalp AI Coach, a friendly and knowledgeable habit-building assistant. 

USER CONTEXT:
- They have {total_habits} daily habits to track
- Current streak: {current_streak} days
- Total completed days: {total_days}

USER MESSAGE: "{message}"

INSTRUCTIONS:
- Be warm, supportive, and conversational
- Give specific, actionable advice related to their question
- Reference their stats when relevant
- Keep response to 2-4 sentences
- Use emojis sparingly but effectively
- If asked about something unrelated to habits/productivity, gently redirect to habits

Respond directly to their message:"""

        logging.info(f"Sending chat message to Gemini: {message[:50]}...")
        
        response_text = generate_content_sync(prompt)
        
        if response_text and len(response_text) > 10:
            logging.info(f"Got response from Gemini: {response_text[:50]}...")
            return response_text
        else:
            logging.warning("Empty or short response from Gemini")
            return get_fallback_response(message, user_context)
            
    except ValueError as e:
        # API key not configured
        logging.error(f"Configuration error: {str(e)}")
        return "I'm having trouble connecting to my brain right now! 🤖 Please check that the AI service is properly configured."
        
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return get_fallback_response(message, user_context)


def get_fallback_response(message: str, user_context: Dict) -> str:
    """Provide contextual fallback responses when AI fails"""
    message_lower = message.lower()
    streak = user_context.get('current_streak', 0)
    
    # Keyword-based fallback responses
    if any(word in message_lower for word in ['motivat', 'inspired', 'discouraged', 'give up']):
        if streak > 0:
            return f"You're on a {streak}-day streak - that's amazing! 🔥 Remember, every champion was once a beginner who refused to give up. You've got this!"
        return "Every expert was once a beginner! Start small, stay consistent, and celebrate every tiny win. Your future self will thank you! 💪"
    
    if any(word in message_lower for word in ['morning', 'routine', 'wake up', 'early']):
        return "Great morning routines start the night before! Try laying out everything you need, going to bed 30 mins earlier, and starting with just ONE habit. What's your first habit of the day? ☀️"
    
    if any(word in message_lower for word in ['fail', 'missed', 'broke', 'streak', 'skip']):
        return "Missing a day doesn't erase your progress - it's just a small bump! The best thing you can do is start again immediately. Don't wait for Monday. Start now! 🚀"
    
    if any(word in message_lower for word in ['sleep', 'tired', 'energy', 'exhausted']):
        return "Sleep is the foundation of everything! Try setting a consistent bedtime, avoiding screens 1 hour before bed, and keeping your room cool and dark. Quality sleep = quality habits! 😴"
    
    if any(word in message_lower for word in ['productiv', 'focus', 'distract', 'procrastinat']):
        return "Try the 2-minute rule: if a habit takes less than 2 minutes, do it now! Also, remove distractions before starting. Put your phone in another room and watch your focus skyrocket! ⚡"
    
    if any(word in message_lower for word in ['habit', 'new', 'start', 'begin', 'how']):
        return "The secret to new habits: make them tiny, stack them on existing routines, and track them daily! Start with something so small you can't say no. What habit do you want to build? 🎯"
    
    if any(word in message_lower for word in ['hello', 'hi', 'hey', 'help']):
        if streak > 0:
            return f"Hey there! Great to see you! 👋 You're on a {streak}-day streak - keep it up! What can I help you with today? I'm here for motivation, habit tips, or just a friendly chat about your progress!"
        return "Hello! 👋 I'm your habit coach, here to help you build an amazing life one habit at a time! What would you like to work on today?"
    
    # Default response with context
    if streak > 7:
        return f"You're doing amazing with your {streak}-day streak! 🔥 Keep up the momentum. What specific aspect of your habit journey can I help with?"
    elif streak > 0:
        return f"Nice work on your {streak}-day streak! What questions do you have about building habits? I'm here to help with motivation, tips, or strategies! 💪"
    else:
        return "I'm here to help you build lasting habits! What's on your mind? Whether it's motivation, strategies, or specific habit questions - I've got you covered! 🎯"