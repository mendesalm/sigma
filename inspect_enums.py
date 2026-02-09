import os
from sqlalchemy import create_engine, inspect
import sys
from dotenv import load_dotenv

# Load env vars first
load_dotenv()

# Manually get DB URL
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Connecting to {db_url.split('@')[1] if '@' in db_url else 'DB'}...")

engine = create_engine(db_url)
inspector = inspect(engine)

table_name = 'masonic_sessions'
columns = inspector.get_columns(table_name)

found = False
for col in columns:
    if col['name'] == 'status':
        found = True
        print(f"Column 'status' found. Type: {col['type']}")
        # For MySQL Enums, the type object might have the enums
        if hasattr(col['type'], 'enums'):
            print(f"Enums: {col['type'].enums}")
        else:
            print("Not an Enum type or ENUMS not visible.")
        
        # Check type length if available
        if hasattr(col['type'], 'length'):
            print(f"Length: {col['type'].length}")
            
if not found:
    print(f"Column 'status' not found in table '{table_name}'")
