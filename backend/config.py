import os
from pathlib import Path


class Settings:
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable not set. Please set a strong, random secret key.")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutos (Stateless)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 dias (Stateful)

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # File Storage
    STORAGE_BASE_PATH: str = os.getenv("STORAGE_BASE_PATH", "./storage")


settings = Settings()

# Ensure the storage path exists
Path(settings.STORAGE_BASE_PATH).mkdir(parents=True, exist_ok=True)
