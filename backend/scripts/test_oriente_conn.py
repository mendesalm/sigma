import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import oriente_engine
from sqlalchemy import text

def test_connection():
    if not oriente_engine:
        print("No oriente_engine configured.")
        return

    try:
        with oriente_engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Connection successful: {result.fetchone()}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection()
