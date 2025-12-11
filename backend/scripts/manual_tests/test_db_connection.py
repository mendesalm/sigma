import os
import pymysql
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

# Load .env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path)

database_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL found: {'Yes' if database_url else 'No'}")
# print(f"DATABASE_URL: {database_url}") # Don't print full credentials for security logs

if not database_url:
    print("No DATABASE_URL set.")
    exit(1)

# Extract host to verify
if "@" in database_url:
    host = database_url.split("@")[1].split("/")[0].split(":")[0]
    print(f"Connecting to host: {host}")

try:
    engine = create_engine(database_url)
    connection = engine.connect()
    print("SQLAlchemy connection successful!")
    connection.close()
except OperationalError as e:
    print(f"SQLAlchemy OperationalError: {e}")
except Exception as e:
    print(f"SQLAlchemy Error: {e}")

# Try low level pymysql if possible (parsing simplified)
# This part depends on how complex the URL is, skipping for now if SQLAlchemy fails.
