# server/test_db.py
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"URL: {SUPABASE_URL}")
print(f"Key: {SUPABASE_KEY[:20]}..." if SUPABASE_KEY else "Key: None")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Test users table
    result = supabase.table('users').select('*').limit(1).execute()
    print(f"✅ Users table OK: {len(result.data)} records")
    
    # Test checkins table
    result = supabase.table('checkins').select('*').limit(1).execute()
    print(f"✅ Checkins table OK: {len(result.data)} records")
    
    # Test habits table
    result = supabase.table('habits').select('*').limit(1).execute()
    print(f"✅ Habits table OK: {len(result.data)} records")
    
    print("\n✅ All database connections working!")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()