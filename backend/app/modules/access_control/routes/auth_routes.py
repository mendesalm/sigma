from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.modules.access_control.schemas.auth_schema import Token, RegisterRequest
from app.modules.access_control.services import auth_service
from app.modules.access_control.utils import auth_utils
from database import get_db
from dependencies import get_current_user_payload
from models import models
from app.modules.audit.services.audit_service import log_action
from app.core.logger import logger

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class AssociationSelection(BaseModel):
    association_id: int
    association_type: str


@router.post(
    "/login",
    response_model=Token,
    summary="Login de Usuários",
    description="Endpoint unificado de login. Aceita E-mail, CPF ou CIM. Autentica Membros, Webmasters e Super Admins e retorna um JWT.",
)
def login_for_access_token(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Fornece um token de acesso para um usuário válido.
    O campo 'username' do formulário pode ser um email, nome de usuário ou CIM.
    """
    user_auth_data = auth_service.authenticate_user(db=db, identifier=form_data.username, password=form_data.password)

    if not user_auth_data:
        logger.warning("Falha de autenticação: Nome de usuário ou senha incorretos", extra={"extra_data": {"username": form_data.username}})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nome de usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user, user_type = user_auth_data

    # Cria os dados para o payload do JWT
    access_token_data = {
        "sub": user.email,
        "user_id": user.id,
        "user_type": user_type,
    }

    # Add name to payload for frontend display
    if user_type == "member":
        access_token_data["name"] = user.full_name
        access_token_data["role"] = "Membro"  # Default role name
        access_token_data["profile_picture_path"] = user.profile_picture_path
    elif user_type == "webmaster":
        access_token_data["name"] = user.username
        access_token_data["role"] = "Webmaster"
    elif user_type == "super_admin":
        access_token_data["name"] = user.username
        access_token_data["role"] = "Super Admin"

    # Adiciona contexto específico com base no tipo de usuário
    if user_type == "webmaster":
        if user.lodge_id:
            access_token_data["lodge_id"] = user.lodge_id
        if user.obedience_id:
            access_token_data["obedience_id"] = user.obedience_id
    elif user_type == "member":
        lodge_associations = user.lodge_associations
        obedience_associations = user.obedience_associations

        all_associations = [
            {"id": la.lodge.id, "name": la.lodge.lodge_name, "type": "lodge"} for la in lodge_associations
        ] + [{"id": oa.obedience.id, "name": oa.obedience.name, "type": "obedience"} for oa in obedience_associations]

        if len(all_associations) > 1:
            access_token_data["requires_selection"] = True
            access_token_data["associations"] = all_associations
        elif len(all_associations) == 1:
            association = all_associations[0]
            if association["type"] == "lodge":
                access_token_data["lodge_id"] = association["id"]
                access_token_data["credential"] = auth_service.calculate_member_credential(
                    user, association["id"], "lodge"
                )
                access_token_data["active_role_name"] = auth_service.get_active_role_name(
                    user, association["id"], "lodge"
                )
            else:
                access_token_data["obedience_id"] = association["id"]
                access_token_data["credential"] = auth_service.calculate_member_credential(
                    user, association["id"], "obedience"
                )
                access_token_data["active_role_name"] = auth_service.get_active_role_name(
                    user, association["id"], "obedience"
                )

    access_token = auth_utils.create_access_token(data=access_token_data)


    # NOVO: Gerar e salvar Refresh Token no Banco de Dados
    refresh_token = auth_utils.create_refresh_token()
    from app.modules.access_control.models import RefreshToken
    from config import settings
    from datetime import datetime, UTC, timedelta
    
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_refresh_token = RefreshToken(
        user_id=user.id,
        user_type=user_type,
        token=refresh_token,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()

    # Setar Cookie HttpOnly
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Em dev (http). Para prod deve ser True
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    log_action(
        db=db,
        user_id=user.id,
        user_type=user_type,
        action="LOGIN",
        resource_type="SESSION",
        resource_id=None,
        details={"ip": request.client.host if request.client else None},
        ip_address=request.client.host if request.client else None
    )
    
    logger.info("Login realizado com sucesso", extra={"extra_data": {"user_id": user.id, "user_type": user_type}})

    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Cadastro de Membro",
    description="Endpoint público para cadastro de membros. Cria a Loja e a Obediência caso não existam.",
)
def register_member(data: RegisterRequest, db: Session = Depends(get_db)):
    from app.modules.access_control.utils.password_utils import hash_password
    from models.models import Member, Lodge, Obedience, LodgeMemberAssociation, ObedienceMemberAssociation

    # 1. Verifica ou cria a Obediência
    obedience = db.query(Obedience).filter(Obedience.name.ilike(data.obedience_name)).first()
    if not obedience:
        obedience = Obedience(name=data.obedience_name)
        db.add(obedience)
        db.flush()

    # 2. Verifica ou cria a Loja
    lodge = db.query(Lodge).filter(
        Lodge.number == data.lodge_number,
        Lodge.lodge_name.ilike(data.lodge_name),
        Lodge.obedience_id == obedience.id
    ).first()
    
    if not lodge:
        lodge = Lodge(
            number=data.lodge_number,
            lodge_name=data.lodge_name,
            obedience_id=obedience.id,
            is_active=True
        )
        db.add(lodge)
        db.flush()

    # 3. Verifica se o membro já existe
    existing_member = db.query(Member).filter(
        (Member.email == data.email) | (Member.cim == data.cim)
    ).first()
    
    if existing_member:
        member = existing_member
    else:
        member = Member(
            email=data.email,
            cim=data.cim,
            full_name=data.full_name,
            degree=data.degree,
            password_hash=hash_password(data.password),
            is_active=True
        )
        db.add(member)
        db.flush()

    # 4. Associações
    assoc = db.query(LodgeMemberAssociation).filter_by(member_id=member.id, lodge_id=lodge.id).first()
    if not assoc:
        new_assoc = LodgeMemberAssociation(member_id=member.id, lodge_id=lodge.id)
        db.add(new_assoc)

    ob_assoc = db.query(ObedienceMemberAssociation).filter_by(member_id=member.id, obedience_id=obedience.id).first()
    if not ob_assoc:
        new_ob_assoc = ObedienceMemberAssociation(member_id=member.id, obedience_id=obedience.id)
        db.add(new_ob_assoc)

    db.commit()
    return {"message": "Cadastro realizado com sucesso."}


@router.post(
    "/token/select-association",
    response_model=Token,
    summary="Selecionar Associação (Loja/Obediência)",
    description="Permite que Membros com múltiplas filiações (ex: mais de uma Loja) escolham qual associação "
    "deve ficar ativa para a sessão atual, recebendo um novo token JWT atualizado com a escolha.",
)
def select_association(
    association_data: AssociationSelection,
    response: Response,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    """
    Seleciona uma associação para um usuário com múltiplas associações e retorna um novo token.
    """
    user_id = payload.get("user_id")
    user_type = payload.get("user_type")

    if user_type != "member" or user_id is None:
        logger.warning("Tentativa de selecionar associação por usuário não membro", extra={"extra_data": {"user_type": user_type}})
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a membros.")

    user = db.query(models.Member).filter(models.Member.id == user_id).first()
    if not user:
        logger.error("Membro não encontrado no banco de dados durante seleção de associação", extra={"extra_data": {"user_id": user_id}})
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    access_token_data = {
        "sub": user.email,
        "user_id": user.id,
        "user_type": user_type,
        "name": user.full_name,
        "role": "Membro",
        "profile_picture_path": user.profile_picture_path,
    }

    if association_data.association_type == "lodge":
        # Validação de segurança: Verifica se o membro realmente pertence à Loja
        if not any(la.lodge_id == association_data.association_id for la in user.lodge_associations):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado: Você não pertence a esta Loja.")
            
        access_token_data["lodge_id"] = association_data.association_id
        access_token_data["credential"] = auth_service.calculate_member_credential(
            user, association_data.association_id, "lodge"
        )
        access_token_data["active_role_name"] = auth_service.get_active_role_name(
            user, association_data.association_id, "lodge"
        )
    elif association_data.association_type == "obedience":
        # Validação de segurança: Verifica se o membro realmente pertence à Obediência
        if not any(oa.obedience_id == association_data.association_id for oa in user.obedience_associations):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado: Você não pertence a esta Obediência.")
            
        access_token_data["obedience_id"] = association_data.association_id
        access_token_data["credential"] = auth_service.calculate_member_credential(
            user, association_data.association_id, "obedience"
        )
        access_token_data["active_role_name"] = auth_service.get_active_role_name(
            user, association_data.association_id, "obedience"
        )
    else:
        raise HTTPException(status_code=400, detail="Tipo de associação inválido.")

    access_token = auth_utils.create_access_token(data=access_token_data)


    # NOVO: Gerar e salvar Refresh Token no Banco de Dados
    refresh_token = auth_utils.create_refresh_token()
    from app.modules.access_control.models import RefreshToken
    from config import settings
    from datetime import datetime, UTC, timedelta
    
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_refresh_token = RefreshToken(
        user_id=user.id,
        user_type=user_type,
        token=refresh_token,
        expires_at=expires_at
    )
    db.add(db_refresh_token)
    db.commit()

    # Setar Cookie HttpOnly
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Em dev (http). Para prod deve ser True
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/refresh",
    response_model=Token,
    summary="Atualizar JWT via Refresh Token",
    description="Gera um novo Access Token a partir de um Refresh Token válido salvo em um Cookie HttpOnly."
)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    from app.modules.access_control.models import RefreshToken
    from datetime import datetime, UTC
    
    # Verify in DB
    db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token_cookie).first()
    if not db_token:
        logger.warning("Tentativa de uso de refresh token inválido ou inexistente no banco")
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    if db_token.revoked:
        logger.warning("Tentativa de uso de refresh token revogado", extra={"extra_data": {"user_id": db_token.user_id}})
        raise HTTPException(status_code=401, detail="Refresh token revoked")
        
    if db_token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
        logger.info("Refresh token expirado", extra={"extra_data": {"user_id": db_token.user_id}})
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user_type = db_token.user_type
    user = None
    if user_type == "super_admin":
        from models.models import SuperAdmin
        user = db.query(SuperAdmin).filter(SuperAdmin.id == db_token.user_id).first()
    elif user_type == "webmaster":
        from models.models import Webmaster
        user = db.query(Webmaster).filter(Webmaster.id == db_token.user_id).first()
    elif user_type == "member":
        from models.models import Member
        user = db.query(Member).filter(Member.id == db_token.user_id).first()
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Recreate access token data (simplified for refresh)
    access_token_data = {
        "sub": user.email if hasattr(user, 'email') else user.username,
        "user_id": user.id,
        "user_type": user_type,
    }
    
    access_token = auth_utils.create_access_token(data=access_token_data)
    
    logger.info("Access token renovado com sucesso via refresh token", extra={"extra_data": {"user_id": user.id}})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Fazer Logout Seguramente",
    description="Invalida o Refresh Token e bloqueia o Access Token atual."
)
def logout(
    request: Request,
    response: Response,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if refresh_token_cookie:
        from app.modules.access_control.models import RefreshToken
        db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token_cookie).first()
        if db_token:
            db_token.revoked = True
            db.commit()
    
    # Adiciona o Access Token atual à Denylist
    jti = payload.get("jti")
    if jti:
        from app.modules.access_control.models import RevokedAccessToken
        from datetime import datetime, UTC
        from config import settings
        from datetime import timedelta
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        exists = db.query(RevokedAccessToken).filter(RevokedAccessToken.jti == jti).first()
        if not exists:
            db_revoked = RevokedAccessToken(jti=jti, expires_at=expires_at)
            db.add(db_revoked)
            db.commit()

    # Limpar cookie
    response.delete_cookie("refresh_token")
    
    logger.info("Logout realizado com sucesso", extra={"extra_data": {"jti": jti}})
    return
