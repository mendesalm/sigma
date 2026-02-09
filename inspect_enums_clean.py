import os
import json
import sys
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Load env vars first
load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print(json.dumps({"error": "DATABASE_URL not set"}))
    sys.exit(1)

try:
    engine = create_engine(db_url)
    inspector = inspect(engine)
    table_name = 'masonic_sessions'
    
    if table_name not in inspector.get_table_names():
         print(json.dumps({"error": f"Table {table_name} not found"}))
         sys.exit(0)

    columns = inspector.get_columns(table_name)
    status_col = next((c for c in columns if c['name'] == 'status'), None)
    
    result = {}
    if status_col:
        col_type = status_col['type']
        result['type_str'] = str(col_type)
        if hasattr(col_type, 'enums'):
            result['enums'] = col_type.enums
        if hasattr(col_type, 'length'):
            result['length'] = col_type.length
    else:
        result['error'] = "Column status not found"
        
    print(json.dumps(result, indent=2))

except Exception as e:
    print(json.dumps({"error": str(e)}))
