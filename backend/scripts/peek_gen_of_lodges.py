import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import oriente_engine
from sqlalchemy import text

def peek_gen_of_lodges():
    if not oriente_engine:
        print("No oriente_engine.")
        return

    try:
        with oriente_engine.connect() as conn:
            result = conn.execute(text("SELECT * FROM gen_of_lodges LIMIT 1"))
            row = result.fetchone()
            if row:
                print(f"Row keys: {result.keys()}")
                print(f"Row data: {row}")
            else:
                print("Table is empty.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    peek_gen_of_lodges()
