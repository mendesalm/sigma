import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database import oriente_engine

def inspect_gen_of_lodges():
    if not oriente_engine:
        print("ORIENTE_DB_URL not configured.")
        return

    print(f"Connecting to: {oriente_engine.url}")
    
    try:
        with oriente_engine.connect() as conn:
            # Get columns using SQL because inspector might fail if it's a view with weird permissions
            # But let's try inspector first as it's cleaner
            inspector = inspect(oriente_engine)
            columns = inspector.get_columns('gen_of_lodges')
            print("Columns found via Inspector:")
            for col in columns:
                print(f"- {col['name']} ({col['type']})")
            
            # Get one row to verify data
            print("\nSample Row:")
            result = conn.execute(text("SELECT * FROM gen_of_lodges LIMIT 1"))
            row = result.fetchone()
            if row:
                print(row)
            else:
                print("Table is empty.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_gen_of_lodges()
