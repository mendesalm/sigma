import os
from pathlib import Path


class Settings:
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable not set. Please set a strong, random secret key.")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # File Storage
    STORAGE_BASE_PATH: str = os.getenv("STORAGE_BASE_PATH", "./storage")


settings = Settings()

# Ensure the storage path exists
Path(settings.STORAGE_BASE_PATH).mkdir(parents=True, exist_ok=True)
