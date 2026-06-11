from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models.models import Member
from app.modules.access_control.utils import auth_utils
from app.shared.tenant_context import TenantContextManager
from app.shared.security.constants import UserTypeEnum, CredentialLevel
from app.shared.security.cache import permission_cache
from datetime import date

# This tells FastAPI which URL to check for the token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_current_user_payload(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> dict:
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

    jti = payload.get("jti")
    if jti:
        from app.modules.access_control.models import RevokedAccessToken
        is_revoked = db.query(RevokedAccessToken).filter(RevokedAccessToken.jti == jti).first()
        if is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    # Set the tenant context for the current request
    lodge_id = payload.get("lodge_id")
    obedience_id = payload.get("obedience_id")
    if lodge_id is not None:
        TenantContextManager.set_lodge_id(lodge_id)
    if obedience_id is not None:
        TenantContextManager.set_obedience_id(obedience_id)
        
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
    
    credential = 0
    user = None
    granted_exceptions = []
    revoked_exceptions = []

    if user_type == UserTypeEnum.SUPER_ADMIN:
        user = db.query(SuperAdmin).filter(SuperAdmin.id == user_id).first()
        credential = int(CredentialLevel.SUPER_ADMIN_LEVEL)
    elif user_type == UserTypeEnum.WEBMASTER:
        user = db.query(Webmaster).filter(Webmaster.id == user_id).first()
        credential = int(CredentialLevel.WEBMASTER_LEVEL)
    elif user_type == UserTypeEnum.MEMBER:
        user = db.query(Member).filter(Member.id == user_id).first()
        if user:
            # Extract current credential dynamically from active roles
            today = date.today()
            active_roles = [
                rh.role for rh in user.role_history 
                if (rh.lodge_id == lodge_id if lodge_id else True) 
                and (rh.end_date is None or rh.end_date >= today)
            ]
            
            # The member's credential is the maximum base_credential of their active roles
            if active_roles:
                credential = max((role.base_credential for role in active_roles if role.base_credential is not None), default=0)

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
        if context.user_type == UserTypeEnum.SUPER_ADMIN:
            return context

        # 2. Revocations
        if permission_action in context.revoked_exceptions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission explicitly revoked: {permission_action}",
            )

        # 3. Grants
        if permission_action in context.granted_exceptions:
            return context

        # 4. Check Credential from Cache
        min_credential = permission_cache.get_min_credential(permission_action)
        
        if min_credential is None:
            # Fallback ao banco se o cache falhar ou a permissão não existir
            permission = db.query(Permission).filter(Permission.action == permission_action).first()
            if not permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission definition not found: {permission_action}",
                )
            min_credential = permission.min_credential

        if context.active_credential >= min_credential:
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient credential for: {permission_action} (Required: {min_credential}, Has: {context.active_credential})",
        )

    return dependency


def require_module(module_name: str):
    """
    Dependency factory to check if a specific module is enabled for the current user's Lodge/Obedience.
    """
    def dependency(
        context: UserContext = Depends(get_current_active_user_with_permissions), db: Session = Depends(get_db)
    ) -> UserContext:
        if context.user_type == UserTypeEnum.SUPER_ADMIN:
            return context

        available_modules = {}
        if context.lodge_id:
            from models.models import Lodge
            lodge = db.query(Lodge).filter(Lodge.id == context.lodge_id).first()
            if lodge and lodge.available_modules:
                available_modules = lodge.available_modules
        elif context.obedience_id:
            from models.models import Obedience
            obedience = db.query(Obedience).filter(Obedience.id == context.obedience_id).first()
            if obedience and obedience.available_modules:
                available_modules = obedience.available_modules

        if not available_modules.get(module_name, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Módulo desativado para esta instituição: {module_name}",
            )
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth_utils.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    # Set the tenant context for the current request
    lodge_id = payload.get("lodge_id")
    obedience_id = payload.get("obedience_id")
    if lodge_id is not None:
        TenantContextManager.set_lodge_id(lodge_id)
    if obedience_id is not None:
        TenantContextManager.set_obedience_id(obedience_id)
        
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
    
    credential = 0
    user = None
    granted_exceptions = []
    revoked_exceptions = []

    if user_type == UserTypeEnum.SUPER_ADMIN:
        user = db.query(SuperAdmin).filter(SuperAdmin.id == user_id).first()
        credential = int(CredentialLevel.SUPER_ADMIN_LEVEL)
    elif user_type == UserTypeEnum.WEBMASTER:
        user = db.query(Webmaster).filter(Webmaster.id == user_id).first()
        credential = int(CredentialLevel.WEBMASTER_LEVEL)
    elif user_type == UserTypeEnum.MEMBER:
        user = db.query(Member).filter(Member.id == user_id).first()
        if user:
            # Extract current credential dynamically from active roles
            today = date.today()
            active_roles = [
                rh.role for rh in user.role_history 
                if (rh.lodge_id == lodge_id if lodge_id else True) 
                and (rh.end_date is None or rh.end_date >= today)
            ]
            
            # The member's credential is the maximum base_credential of their active roles
            if active_roles:
                credential = max((role.base_credential for role in active_roles if role.base_credential is not None), default=0)

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
        if context.user_type == UserTypeEnum.SUPER_ADMIN:
            return context

        # 2. Revocations
        if permission_action in context.revoked_exceptions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission explicitly revoked: {permission_action}",
            )

        # 3. Grants
        if permission_action in context.granted_exceptions:
            return context

        # 4. Check Credential from Cache
        min_credential = permission_cache.get_min_credential(permission_action)
        
        if min_credential is None:
            # Fallback ao banco se o cache falhar ou a permissão não existir
            permission = db.query(Permission).filter(Permission.action == permission_action).first()
            if not permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission definition not found: {permission_action}",
                )
            min_credential = permission.min_credential

        if context.active_credential >= min_credential:
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient credential for: {permission_action} (Required: {min_credential}, Has: {context.active_credential})",
        )

    return dependency


def require_module(module_name: str):
    """
    Dependency factory to check if a specific module is enabled for the current user's Lodge/Obedience.
    """
    def dependency(
        context: UserContext = Depends(get_current_active_user_with_permissions), db: Session = Depends(get_db)
    ) -> UserContext:
        if context.user_type == UserTypeEnum.SUPER_ADMIN:
            return context

        available_modules = {}
        if context.lodge_id:
            from models.models import Lodge
            lodge = db.query(Lodge).filter(Lodge.id == context.lodge_id).first()
            if lodge and lodge.available_modules:
                available_modules = lodge.available_modules
        elif context.obedience_id:
            from models.models import Obedience
            obedience = db.query(Obedience).filter(Obedience.id == context.obedience_id).first()
            if obedience and obedience.available_modules:
                available_modules = obedience.available_modules

        if not available_modules.get(module_name, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Módulo desativado para esta instituição: {module_name}",
            )

        return context

    return dependency


def get_session_manager(payload: dict = Depends(get_current_user_payload)) -> dict:
    """
    Verifica se o usuário tem permissão para gerenciar uma sessão.
    Por enquanto, permite webmasters de loja. A lógica pode ser expandida para outros cargos.
    """
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")

    if user_type != UserTypeEnum.WEBMASTER or not lodge_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores da loja.")
    return payload


def get_current_lodge_webmaster(payload: dict = Depends(get_current_user_payload)) -> int:
    """
    Verifica se o usuário atual é um webmaster associado a uma loja e retorna o lodge_id.
    Usado como dependência para endpoints que só podem ser acessados por webmasters de loja.
    """
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")

    if user_type != UserTypeEnum.WEBMASTER or not lodge_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a Webmasters de Loja.")
    return lodge_id


def get_current_super_admin(payload: dict = Depends(get_current_user_payload)) -> dict:
    """
    Verifies if the current user is a super admin.
    """
    if payload.get("user_type") != UserTypeEnum.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to perform this action."
        )
    return payload
