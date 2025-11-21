
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Constrói o caminho para o arquivo .env no mesmo diretório do database.py
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")

# Escape the URL for configparser if needed, though not directly used by SQLAlchemy here
if DATABASE_URL and '%' in DATABASE_URL:
    # This is more for alembic.ini, but good practice to be aware of.
    # SQLAlchemy handles URL encoding directly.
    pass

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
