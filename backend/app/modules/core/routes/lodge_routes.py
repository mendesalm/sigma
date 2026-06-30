from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import database
import dependencies
from app.modules.core.schemas import lodge_schema
from app.modules.core.services import lodge_service

router = APIRouter(
    prefix="/lodges",
    tags=["Lodges"],
)

# Dependency to check for super admin role
# This can be moved to a shared dependency file later if needed
# Now using shared dependency


@router.post(
    "/",
    response_model=lodge_schema.LodgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Nova Loja",
    description="Cria o registro de uma nova Loja Maçônica no sistema. Acesso restrito a Super Admins.",
)
def create_lodge(
    lodge: lodge_schema.LodgeCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Create a new lodge. Only accessible by super admins."""
    return lodge_service.create_lodge(db=db, lodge=lodge)


@router.get(
    "/",
    response_model=list[lodge_schema.LodgeResponse],
    summary="Listar Todas as Lojas",
    description="Retorna uma lista paginada de todas as lojas cadastradas no portal.",
)
def read_lodges(skip: int = 0, limit: int = 100, obedience_id: int | None = None, search: str | None = None, db: Session = Depends(database.get_db)):
    """Retrieve all lodges. Publicly accessible."""
    lodges = lodge_service.get_lodges(db, skip=skip, limit=limit, obedience_id=obedience_id, search=search)
    return lodges


@router.get(
    "/{lodge_id}",
    response_model=lodge_schema.LodgeResponse,
    summary="Obter Detalhes da Loja",
    description="Recupera as informações detalhadas de uma loja específica utilizando seu ID interno.",
)
def read_lodge(lodge_id: int, db: Session = Depends(database.get_db)):
    """Retrieve a single lodge by ID. Publicly accessible."""
    db_lodge = lodge_service.get_lodge(db, lodge_id=lodge_id)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge


@router.put(
    "/{lodge_id}",
    response_model=lodge_schema.LodgeResponse,
    summary="Atualizar Dados da Loja",
    description="Atualiza as informações de uma loja (endereço, rito, contatos, etc). Apenas Webmasters da respectiva loja ou Super Admins têm permissão.",
)
def update_lodge(
    lodge_id: int,
    lodge: lodge_schema.LodgeUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Update a lodge. Accessible by super admins or the lodge's webmaster."""
    # Check permissions
    user_type = current_user.get("user_type")
    user_lodge_id = current_user.get("lodge_id")

    if user_type != "super_admin":
        # If not super admin, must be webmaster of THIS lodge
        if user_type != "webmaster" or str(user_lodge_id) != str(lodge_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this lodge")
        
        # Protect available_modules
        if lodge.available_modules is not None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas Super Admins podem alterar os módulos disponíveis.")
    db_lodge = lodge_service.update_lodge(db, lodge_id=lodge_id, lodge_update=lodge)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge


@router.delete(
    "/{lodge_id}",
    response_model=lodge_schema.LodgeResponse,
    summary="Excluir Loja",
    description="Remove permanentemente uma loja do sistema. Acesso restrito estruturalmente para Super Admins.",
)
def delete_lodge(
    lodge_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Delete a lodge. Only accessible by super admins."""
    db_lodge = lodge_service.delete_lodge(db, lodge_id=lodge_id)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge


import os
import shutil

from fastapi import File, UploadFile

from dependencies import get_current_user_payload


from app.shared.utils.path_utils import get_tenant_path_for_lodge

@router.post("/{lodge_id}/logo", summary="Upload do Logo da Loja")
async def upload_lodge_logo(
    lodge_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    # Verifica permissões (apenas admin ou webmaster da loja)
    # TODO: Implementar verificação de permissão mais robusta

    # Define o caminho de armazenamento usando lazy loading
    storage_dir = get_tenant_path_for_lodge(db, lodge_id, "assets/images")
    file_path = storage_dir / "logo.png"

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar logo: {str(e)}")

    return {"message": "Logo atualizado com sucesso", "path": str(file_path)}


@router.post("/{lodge_id}/upload_asset", summary="Upload de Asset Genérico da Loja")
async def upload_lodge_asset(
    lodge_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """
    Upload a generic asset file (image, etc) for the lodge.
    Returns the URL to access the file.
    """
    # Verify Permissions
    user_type = current_user.get("user_type")
    user_lodge_id = current_user.get("lodge_id")

    if user_type != "super_admin":
        if user_type != "webmaster" or str(user_lodge_id) != str(lodge_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to upload assets for this lodge"
            )

    # Sanitize filename
    safe_filename = file.filename.replace(" ", "_").lower()

    # Define storage path
    storage_dir = get_tenant_path_for_lodge(db, lodge_id, "assets")
    file_path = storage_dir / safe_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")

    # Return Public URL
    url_path = f"/{file_path.as_posix()}"

    return {"url": url_path}





@router.post("/{lodge_id}/settings/reset")
def reset_lodge_settings(
    lodge_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """
    Realiza o reset das configurações da Loja para os padrões de fábrica.
    Faz backup do estado atual em 'previous_settings' para permitir reversão.
    Acesso restrito a Webmaster da Loja e Super Admin.
    """
    lodge = lodge_service.get_lodge(db, lodge_id)
    if not lodge:
        raise HTTPException(status_code=404, detail="Lodge not found")

    user_type = current_user.get("user_type")
    user_lodge_id = current_user.get("lodge_id")

    if user_type != "super_admin":
        if user_type != "webmaster" or str(user_lodge_id) != str(lodge_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso restrito: Apenas o Webmaster da loja pode realizar o reset.",
            )

    # Check if already at factory settings
    factory_modules = {
        "member_registration": True,
        "session_management": True,
        "session_attendance": True,
        "chancellery": True,
    }
    
    is_modules_factory = lodge.available_modules == factory_modules or lodge.available_modules is None
    is_docs_factory = not lodge.document_settings or len(lodge.document_settings) == 0
    
    if is_modules_factory and is_docs_factory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A loja já está com as configurações de fábrica. O reset foi cancelado para proteger o backup anterior."
        )

    # Backup current settings
    backup = {
        "document_settings": lodge.document_settings,
        "available_modules": lodge.available_modules,
    }
    lodge.previous_settings = backup

    # Reset settings
    lodge.document_settings = None  # Or a default JSON
    # available_modules usually not reset to None, but kept or set to minimal default
    lodge.available_modules = {
        "member_registration": True,
        "session_management": True,
        "session_attendance": True,
        "chancellery": True,
    }

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(lodge, "document_settings")
    flag_modified(lodge, "available_modules")
    flag_modified(lodge, "previous_settings")

    db.commit()
    return {"message": "Configurações resetadas com sucesso. Em caso de acidente, contate o Suporte para restaurar."}


@router.post("/{lodge_id}/settings/restore_previous")
def restore_previous_lodge_settings(
    lodge_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """
    Restaura as configurações de fábrica a partir do backup feito no último reset.
    Acesso EXCLUSIVO a Super Admins.
    """
    lodge = lodge_service.get_lodge(db, lodge_id)
    if not lodge:
        raise HTTPException(status_code=404, detail="Lodge not found")

    if not lodge.previous_settings:
        raise HTTPException(status_code=400, detail="Não há configurações anteriores para restaurar.")

    previous = lodge.previous_settings
    if "document_settings" in previous:
        lodge.document_settings = previous["document_settings"]
    if "available_modules" in previous:
        lodge.available_modules = previous["available_modules"]

    lodge.previous_settings = None # Clear backup after restore

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(lodge, "document_settings")
    flag_modified(lodge, "available_modules")
    flag_modified(lodge, "previous_settings")

    db.commit()
    return {"message": "Configurações restauradas para a versão anterior com sucesso."}


from typing import List
from app.modules.core.schemas.import_lodge_schema import ImportLodgePreviewResponse, ImportLodgeConfirmRequest
from app.modules.core.services.import_lodge_service import process_lodge_upload_files

@router.post(
    "/import/preview",
    response_model=ImportLodgePreviewResponse,
    summary="Pré-visualizar Importação de Lojas",
)
async def preview_lodge_import(
    files: List[UploadFile] = File(...),
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    return await process_lodge_upload_files(db, files)

@router.post(
    "/import/confirm",
    status_code=status.HTTP_200_OK,
    summary="Confirmar Importação de Lojas",
)
def confirm_lodge_import(
    request_data: ImportLodgeConfirmRequest,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    saved_count = 0
    from app.modules.core.models import Obedience
    all_obediences = db.query(Obedience).all()
    potency_map = {o.acronym.lower(): o.id for o in all_obediences if o.acronym and not o.parent_obedience_id}
    subpotency_map = {o.acronym.lower(): o.id for o in all_obediences if o.acronym and o.parent_obedience_id}
    
    for row in request_data.rows:
        if not row.is_valid:
            continue
            
        potency_id = potency_map.get(row.potency_acronym.lower()) if row.potency_acronym else None
        subpotency_id = subpotency_map.get(row.subpotency_acronym.lower()) if row.subpotency_acronym else None
        
        lodge_create = lodge_schema.LodgeCreate(
            lodge_name=row.name,
            lodge_number=row.number,
            obedience_id=potency_id,
            subobedience_id=subpotency_id,
            cnpj=row.cnpj,
            technical_contact_email=row.technical_contact_email,
            technical_contact_name=row.technical_contact_name,
        )
        try:
            lodge_service.create_lodge(db=db, lodge=lodge_create)
            saved_count += 1
        except Exception as e:
            print(f"Error creating lodge {row.name}: {e}")
            
    db.commit()
    return {"message": "Importação concluída.", "saved_count": saved_count}
