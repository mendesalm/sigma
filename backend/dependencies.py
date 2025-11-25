from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models.models import Member
from .utils import auth_utils

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

async def get_current_active_member(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
) -> Member:
    """
    Retrieves the current active member from the database based on the token payload.
    """
    user_id = payload.get("user_id")
    user_type = payload.get("user_type")

    if user_type != "member" or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to members."
        )

    member = db.query(Member).filter(Member.id == user_id).first()

    if member is None:
        raise HTTPException(status_code=404, detail="Member not found.")

    return member

def require_permission(permission_action: str):
    """
    Dependency factory to check for a specific permission action.
    """
    def dependency(
        current_member: Member = Depends(get_current_active_member),
    ) -> Member:
        has_perm = False
        # Check lodge roles
        for assoc in current_member.lodge_associations:
            for perm in assoc.role.permissions:
                if perm.action == permission_action:
                    has_perm = True
                    break
            if has_perm:
                break

        # If permission not found in lodge roles, check obedience roles
        if not has_perm:
            for assoc in current_member.obedience_associations:
                for perm in assoc.role.permissions:
                    if perm.action == permission_action:
                        has_perm = True
                        break
                if has_perm:
                    break

        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have the required permission: {permission_action}",
            )
        return current_member
    return dependency

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

def get_current_lodge_webmaster(payload: dict = Depends(get_current_user_payload)) -> int:
    """
    Verifica se o usuário atual é um webmaster associado a uma loja e retorna o lodge_id.
    Usado como dependência para endpoints que só podem ser acessados por webmasters de loja.
    """
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")

    if user_type != "webmaster" or not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a Webmasters de Loja."
        )
    return lodge_id
