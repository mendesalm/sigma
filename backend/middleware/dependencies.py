# backend/middleware/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from services import auth_service
from database import get_db
from models.models import SuperAdmin, Webmaster, Member

# Esta é a URL onde o cliente (frontend) pode obter o token (nosso endpoint /token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependência principal: decodifica o token, valida e retorna o objeto do usuário.
    """
    payload = auth_service.decode_token(token)
    username: str = payload.get("sub")
    scope: str = payload.get("scope")

    if username is None or scope is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Busca o usuário no banco de dados com base no escopo
    user = None
    if scope == "super_admin":
        user = db.query(SuperAdmin).filter(SuperAdmin.username == username).first()
    elif scope in ["webmaster_obedience", "webmaster_lodge"]:
        user = db.query(Webmaster).filter(Webmaster.username == username).first()
    elif scope == "member":
        user = db.query(Member).filter(Member.email == username).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Anexa o escopo e outros dados do payload ao objeto do usuário para uso nos endpoints
    user.scope = scope
    user.lodge_id = payload.get("lodge_id")
    user.obedience_id = payload.get("obedience_id")

    return user

def get_current_super_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependência de autorização: garante que o usuário atual é um SuperAdmin.
    """
    if current_user.scope != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return current_user
