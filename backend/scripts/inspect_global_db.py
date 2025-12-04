import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import oriente_engine
from sqlalchemy import inspect

def inspect_table():
    if not oriente_engine:
        print("No oriente_engine.")
        return

    inspector = inspect(oriente_engine)
    tables = inspector.get_table_names()
    print(f"Tables in oriente_data: {tables}")
    
    if "gen_of_lodges" in tables:
        print("Table 'gen_of_lodges' exists.")
        columns = inspector.get_columns("gen_of_lodges")
        for col in columns:
            print(f"Column: {col['name']} - {col['type']}")
    else:
        print("Table 'global_visitors' does NOT exist.")

if __name__ == "__main__":
    inspect_table()
