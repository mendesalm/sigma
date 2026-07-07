import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from app.modules.core.routes.dashboard_routes import get_calendar_events
import traceback

def test_calendar():
    db = SessionLocal()
    payload = {"lodge_id": 1, "user_type": "webmaster", "user_id": 4}
    
    try:
        events = get_calendar_events(month=7, year=2026, db=db, payload=payload)
        print("Calendar events successful!")
        print(f"Got {len(events)} events")
    except Exception as e:
        print("Calendar events failed!")
        traceback.print_exc()
        
    db.close()

if __name__ == '__main__':
    test_calendar()
