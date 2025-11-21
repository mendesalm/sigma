from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .utils import auth_utils
from . import database
from .services import auth_service

# This tells FastAPI which URL to check for the token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes the token, handles errors, and returns the payload.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth_utils.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    return payload

def get_session_manager(payload: dict = Depends(get_current_user_payload)) -> dict:
    """
    Verifica se o usuário tem permissão para gerenciar uma sessão.
    Por enquanto, permite webmasters de loja. A lógica pode ser expandida para outros cargos.
    """
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")

    if user_type != "webmaster" or not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores da loja."
        )
    return payload