import logging
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from ..config import settings

logger = logging.getLogger(__name__)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """Decodes a JWT access token."""
    try:
        logger.debug(f"Attempting to decode token: {token}")
        logger.debug(f"Using SECRET_KEY: {settings.SECRET_KEY[:5]}...{settings.SECRET_KEY[-5:]}")  # Log partial key
        logger.debug(f"Using ALGORITHM: {settings.ALGORITHM}")

        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.debug(f"Token decoded successfully: {decoded_token}")
        return decoded_token
    except JWTError as e:
        logger.error(f"JWTError during token decoding: {e}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during token decoding: {e}")
        return None
