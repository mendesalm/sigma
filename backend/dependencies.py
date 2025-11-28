from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models.models import Member
from utils import auth_utils

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
    payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)
) -> Member:
    """
    Retrieves the current active member from the database based on the token payload.
    """
    user_id = payload.get("user_id")
    user_type = payload.get("user_type")

    if user_type != "member" or user_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted to members.")

    member = db.query(Member).filter(Member.id == user_id).first()

    if member is None:
        raise HTTPException(status_code=404, detail="Member not found.")

    return member


from models.models import ExceptionTypeEnum, Member, MemberPermissionException, Permission, SuperAdmin, Webmaster

# ... imports ...


class UserContext:
    def __init__(
        self, user, user_type, active_credential, granted_exceptions, revoked_exceptions, lodge_id, obedience_id
    ):
        self.user = user
        self.user_type = user_type
        self.active_credential = active_credential
        self.granted_exceptions = granted_exceptions
        self.revoked_exceptions = revoked_exceptions
        self.lodge_id = lodge_id
        self.obedience_id = obedience_id


async def get_current_active_user_with_permissions(
    payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)
) -> UserContext:
    user_id = payload.get("user_id")
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")
    obedience_id = payload.get("obedience_id")
    credential = payload.get("credential", 0)

    user = None
    granted_exceptions = []
    revoked_exceptions = []

    if user_type == "super_admin":
        user = db.query(SuperAdmin).filter(SuperAdmin.id == user_id).first()
        credential = 9999  # SuperAdmin has max credential
    elif user_type == "webmaster":
        user = db.query(Webmaster).filter(Webmaster.id == user_id).first()
        credential = 999  # Webmaster has high credential within tenant
    elif user_type == "member":
        user = db.query(Member).filter(Member.id == user_id).first()
        if user:
            # Fetch exceptions for the current context
            query = db.query(MemberPermissionException).filter(MemberPermissionException.member_id == user_id)
            if lodge_id:
                query = query.filter(MemberPermissionException.lodge_id == lodge_id)
            elif obedience_id:
                query = query.filter(MemberPermissionException.obedience_id == obedience_id)

            exceptions = query.all()
            for exc in exceptions:
                if exc.exception_type == ExceptionTypeEnum.GRANT:
                    granted_exceptions.append(exc.permission.action)
                elif exc.exception_type == ExceptionTypeEnum.REVOKE:
                    revoked_exceptions.append(exc.permission.action)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return UserContext(
        user=user,
        user_type=user_type,
        active_credential=credential,
        granted_exceptions=granted_exceptions,
        revoked_exceptions=revoked_exceptions,
        lodge_id=lodge_id,
        obedience_id=obedience_id,
    )


def require_permission(permission_action: str):
    """
    Dependency factory to check for a specific permission action using RBAC.
    """

    def dependency(
        context: UserContext = Depends(get_current_active_user_with_permissions), db: Session = Depends(get_db)
    ) -> UserContext:
        # 1. SuperAdmin bypass
        if context.user_type == "super_admin":
            return context

        # 2. Webmaster bypass (within tenant)
        if context.user_type == "webmaster":
            # Webmaster has full access to their tenant.
            # Assuming permission_action doesn't imply cross-tenant access.
            return context

        # 3. Member Logic
        # a. Check Revocations
        if permission_action in context.revoked_exceptions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission explicitly revoked: {permission_action}",
            )

        # b. Check Grants
        if permission_action in context.granted_exceptions:
            return context

        # c. Check Credential
        # Fetch permission min_credential
        permission = db.query(Permission).filter(Permission.action == permission_action).first()
        if not permission:
            # If permission doesn't exist in DB, deny by default or log warning
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission definition not found: {permission_action}",
            )

        if context.active_credential >= permission.min_credential:
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient credential for: {permission_action} (Required: {permission.min_credential}, Has: {context.active_credential})",
        )

    return dependency


def get_session_manager(payload: dict = Depends(get_current_user_payload)) -> dict:
    """
    Verifica se o usuário tem permissão para gerenciar uma sessão.
    Por enquanto, permite webmasters de loja. A lógica pode ser expandida para outros cargos.
    """
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")

    if user_type != "webmaster" or not lodge_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores da loja.")
    return payload


def get_current_lodge_webmaster(payload: dict = Depends(get_current_user_payload)) -> int:
    """
    Verifica se o usuário atual é um webmaster associado a uma loja e retorna o lodge_id.
    Usado como dependência para endpoints que só podem ser acessados por webmasters de loja.
    """
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")

    if user_type != "webmaster" or not lodge_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a Webmasters de Loja.")
    return lodge_id


def get_current_super_admin(payload: dict = Depends(get_current_user_payload)) -> dict:
    """
    Verifies if the current user is a super admin.
    """
    if payload.get("user_type") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to perform this action."
        )
    return payload
