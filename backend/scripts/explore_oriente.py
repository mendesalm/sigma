import sys
import os
from sqlalchemy import text, inspect

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import oriente_engine

def explore_oriente_db():
    if not oriente_engine:
        print("ORIENTE_DB_URL not configured.")
        return

    print(f"Connecting to: {oriente_engine.url}")
    
    try:
        inspector = inspect(oriente_engine)
        tables = inspector.get_table_names()
        print(f"Tables found: {tables}")
        
        with oriente_engine.connect() as conn:
            for table in tables:
                print(f"\n--- Inspecting table: {table} ---")
                try:
                    # Try to get columns
                    columns = inspector.get_columns(table)
                    col_names = [c['name'] for c in columns]
                    print(f"Columns: {col_names}")
                    
                    # Try to select data
                    query = text(f"SELECT * FROM `{table}` LIMIT 1")
                    result = conn.execute(query)
                    row = result.fetchone()
                    if row:
                        print(f"Sample data: {row}")
                    else:
                        print("Table is empty.")
                except Exception as e:
                    print(f"Error accessing table {table}: {e}")
                    
    except Exception as e:
        print(f"General error: {e}")

if __name__ == "__main__":
    explore_oriente_db()
