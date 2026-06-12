import secrets
import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from config import settings
from app.core.logger import logger

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Gera um novo token de acesso JWT com identificador único (JTI)."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    if "jti" not in to_encode:
        to_encode["jti"] = str(uuid.uuid4())

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token() -> str:
    """Gera uma string aleatória criptograficamente segura para ser usada como Refresh Token."""
    return secrets.token_hex(64)


def decode_access_token(token: str) -> dict | None:
    """Decodifica e valida um token JWT."""
    try:
        logger.debug(f"Tentando decodificar token: {token}")
        logger.debug(f"Usando SECRET_KEY: {settings.SECRET_KEY[:5]}...{settings.SECRET_KEY[-5:]}")
        logger.debug(f"Usando ALGORITHM: {settings.ALGORITHM}")

        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.debug("Token decodificado com sucesso", extra={"extra_data": {"decoded_token": decoded_token}})
        return decoded_token
    except JWTError as e:
        logger.warning(f"Erro de assinatura ou validação do JWT (JWTError): {e}")
        return None
    except Exception as e:
        logger.error(f"Erro inesperado ao decodificar token JWT: {e}", exc_info=True)
        return None
