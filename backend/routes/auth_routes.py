from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user_payload
from ..schemas.auth_schema import Token
from ..services import auth_service
from ..utils import auth_utils
from ..models import models

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

class AssociationSelection(BaseModel):
    association_id: int
    association_type: str

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Fornece um token de acesso para um usuário válido.
    O campo 'username' do formulário pode ser um email, nome de usuário ou CIM.
    """
    user_auth_data = auth_service.authenticate_user(
        db=db, identifier=form_data.username, password=form_data.password
    )

    if not user_auth_data:
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
        "role": user_type,
    }

    # Adiciona contexto específico com base no tipo de usuário
    if user_type == 'webmaster':
        if user.lodge_id:
            access_token_data["lodge_id"] = user.lodge_id
        if user.obedience_id:
            access_token_data["obedience_id"] = user.obedience_id
    elif user_type == 'member':
        lodge_associations = user.lodge_associations
        obedience_associations = user.obedience_associations
        
        all_associations = (
            [{"id": la.lodge.id, "name": la.lodge.lodge_name, "type": "lodge"} for la in lodge_associations] +
            [{"id": oa.obedience.id, "name": oa.obedience.name, "type": "obedience"} for oa in obedience_associations]
        )

        if len(all_associations) > 1:
            access_token_data["requires_selection"] = True
            access_token_data["associations"] = all_associations
        elif len(all_associations) == 1:
            association = all_associations[0]
            if association['type'] == 'lodge':
                access_token_data["lodge_id"] = association['id']
            else:
                access_token_data["obedience_id"] = association['id']

    access_token = auth_utils.create_access_token(data=access_token_data)

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token/select-association", response_model=Token)
def select_association(
    association_data: AssociationSelection,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    """
    Seleciona uma associação para um usuário com múltiplas associações e retorna um novo token.
    """
    user_id = payload.get("user_id")
    user_type = payload.get("role")
    
    if user_type != "member" or user_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a membros."
        )

    user = db.query(models.Member).filter(models.Member.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    access_token_data = {
        "sub": user.email,
        "user_id": user.id,
        "role": user_type,
    }

    if association_data.association_type == 'lodge':
        access_token_data["lodge_id"] = association_data.association_id
    elif association_data.association_type == 'obedience':
        access_token_data["obedience_id"] = association_data.association_id
    else:
        raise HTTPException(status_code=400, detail="Tipo de associação inválido.")

    access_token = auth_utils.create_access_token(data=access_token_data)

    return {"access_token": access_token, "token_type": "bearer"}
