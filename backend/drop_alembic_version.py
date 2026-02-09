import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("DROP TABLE alembic_version"))
        print("Dropped alembic_version table.")
        conn.commit()
    except Exception as e:
        print(f"Error dropping table (might not exist): {e}")
