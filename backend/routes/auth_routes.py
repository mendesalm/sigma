# backend/routes/auth_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel

from database import get_db
from services import auth_service
from config.settings import settings
from models.models import Member

router = APIRouter(
    tags=["Authentication"]
)

class TokenSelection(BaseModel):
    selection_token: str
    lodge_id: int

@router.post("/token", summary="Autentica o usuário e retorna um token de acesso ou um pedido de seleção")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user, scope = auth_service.authenticate_user(
        db, username=form_data.username, password=form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Se for membro, verifica as associações
    if scope == "member":
        associations = user.lodge_associations
        if len(associations) > 1:
            # Cenário de Múltiplas Lojas: requer seleção
            selection_token_expires = timedelta(minutes=5) # Token de seleção de curta duração
            selection_token = auth_service.create_access_token(
                data={"sub": user.email, "scope": "login-selection"},
                expires_delta=selection_token_expires
            )
            
            affiliations = [
                {
                    "lodge_id": assoc.lodge.id,
                    "lodge_name": assoc.lodge.lodge_name,
                    "role": assoc.role.name
                } for assoc in associations
            ]

            return {
                "status": "selection_required",
                "message": "Please select a lodge to continue.",
                "affiliations": affiliations,
                "selection_token": selection_token
            }
        elif len(associations) == 1:
            # Cenário de Loja Única: login direto
            assoc = associations[0]
            token_data = {
                "sub": user.email,
                "scope": "member",
                "lodge_id": assoc.lodge_id,
                "role_id": assoc.role_id
            }
        else:
            # Membro sem associação a nenhuma loja, login com escopo limitado
            token_data = {"sub": user.email, "scope": "member"}
    else:
        # Login para SuperAdmin ou Webmaster
        token_data = {"sub": user.username, "scope": scope}
        if scope == "webmaster_obedience":
            token_data["obedience_id"] = user.obedience_id
        elif scope == "webmaster_lodge":
            token_data["lodge_id"] = user.lodge_id

    # Gera o token de acesso final
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data=token_data, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token/select", summary="Finaliza o login após a seleção de loja")
def finalize_login_with_selection(selection: TokenSelection, db: Session = Depends(get_db)):
    payload = auth_service.decode_token(selection.selection_token)
    username: str = payload.get("sub")
    scope: str = payload.get("scope")
    if username is None or scope != "login-selection":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid selection token")

    user = db.query(Member).filter(Member.email == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verifica se a loja selecionada é válida para o usuário
    chosen_assoc = None
    for assoc in user.lodge_associations:
        if assoc.lodge_id == selection.lodge_id:
            chosen_assoc = assoc
            break
    
    if not chosen_assoc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid lodge selection for this user")

    # Gera o token de acesso final com o contexto da loja selecionada
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    token_data = {
        "sub": user.email,
        "scope": "member",
        "lodge_id": chosen_assoc.lodge_id,
        "role_id": chosen_assoc.role_id
    }
    access_token = auth_service.create_access_token(
        data=token_data, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}