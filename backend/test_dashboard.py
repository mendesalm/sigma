import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from app.modules.core.routes.dashboard_routes import get_dashboard_stats
import traceback

def test_dashboard():
    db = SessionLocal()
    payload = {"lodge_id": 1, "user_type": "webmaster", "user_id": 4}
    
    try:
        stats = get_dashboard_stats(db=db, payload=payload)
        print("Dashboard stats successful!")
        print(stats.keys())
    except Exception as e:
        print("Dashboard stats failed!")
        traceback.print_exc()
        
    db.close()

if __name__ == '__main__':
    test_dashboard()
