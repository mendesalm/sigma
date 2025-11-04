import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@localhost:3306/dbname")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-that-should-be-at-least-32-characters-long")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30

settings = Settings()
