from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import database, dependencies
from schemas import lodge_schema
from services import lodge_service

router = APIRouter(
    prefix="/lodges",
    tags=["Lodges"],
)

# Dependency to check for super admin role
# This can be moved to a shared dependency file later if needed
# Now using shared dependency


@router.post("/", response_model=lodge_schema.LodgeResponse, status_code=status.HTTP_201_CREATED)
def create_lodge(
    lodge: lodge_schema.LodgeCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Create a new lodge. Only accessible by super admins."""
    return lodge_service.create_lodge(db=db, lodge=lodge)


@router.get("/", response_model=list[lodge_schema.LodgeResponse])
def read_lodges(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Retrieve all lodges. Publicly accessible."""
    lodges = lodge_service.get_lodges(db, skip=skip, limit=limit)
    return lodges


@router.get("/{lodge_id}", response_model=lodge_schema.LodgeResponse)
def read_lodge(lodge_id: int, db: Session = Depends(database.get_db)):
    """Retrieve a single lodge by ID. Publicly accessible."""
    db_lodge = lodge_service.get_lodge(db, lodge_id=lodge_id)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge


@router.put("/{lodge_id}", response_model=lodge_schema.LodgeResponse)
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
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Not authorized to update this lodge"
            )
    db_lodge = lodge_service.update_lodge(db, lodge_id=lodge_id, lodge_update=lodge)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge


@router.delete("/{lodge_id}", response_model=lodge_schema.LodgeResponse)
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
from fastapi import UploadFile, File
from dependencies import get_current_user_payload

@router.post("/{lodge_id}/logo", summary="Upload do Logo da Loja")
async def upload_lodge_logo(
    lodge_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    # Verifica permissões (apenas admin ou webmaster da loja)
    # TODO: Implementar verificação de permissão mais robusta
    
    # Define o caminho de armazenamento
    storage_dir = os.path.join("storage", "lodges", str(lodge_id))
    os.makedirs(storage_dir, exist_ok=True)
    
    file_path = os.path.join(storage_dir, "logo.png")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar logo: {str(e)}")
        
    return {"message": "Logo atualizado com sucesso", "path": file_path}


@router.post("/{lodge_id}/upload_asset", summary="Upload de Asset Genérico da Loja")
async def upload_lodge_asset(
    lodge_id: int,
    file: UploadFile = File(...),
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
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Not authorized to upload assets for this lodge"
            )

    # Sanitize filename
    safe_filename = file.filename.replace(" ", "_").lower()
    
    # Define storage path
    # storage/lodges/{id}/assets/
    storage_dir = os.path.join("storage", "lodges", str(lodge_id), "assets")
    os.makedirs(storage_dir, exist_ok=True)
    
    file_path = os.path.join(storage_dir, safe_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")
        
    # Return Public URL
    # Assuming /storage is mounted to root storage
    # Windows paths might use \, force / for URL
    url_path = f"/storage/lodges/{lodge_id}/assets/{safe_filename}"
    
    return {"url": url_path}


# --- Document Settings Routes ---

from schemas.document_settings_schema import DocumentTypeSettings
from sqlalchemy.orm.attributes import flag_modified

@router.get("/{lodge_id}/document-settings/{doc_type}", response_model=DocumentTypeSettings)
def get_lodge_document_settings(
    lodge_id: int,
    doc_type: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """
    Recupera as configurações de documento para um tipo específico (balaustre, prancha, etc).
    """
    lodge = lodge_service.get_lodge(db, lodge_id)
    if not lodge:
        raise HTTPException(status_code=404, detail="Lodge not found")

    # Verifica permissão de leitura (membro da loja pode ler?)
    # Por enquanto, se tiver payload válido e for da mesma loja (ou superadmin), ok.
    user_lodge_id = current_user.get("lodge_id")
    user_type = current_user.get("user_type")
    
    if user_type != "super_admin":
         if str(user_lodge_id) != str(lodge_id):
             raise HTTPException(status_code=403, detail="Acesso negado a esta loja.")

    settings_raw = lodge.document_settings or {}
    
    # Fallback/Migration: If settings are legacy (flat) and we request 'balaustre', 
    # we might try to map it, but DocumentConfigPage saves hierarchically now.
    # If the key exists, return it.
    if doc_type in settings_raw:
        return settings_raw[doc_type]
    
    # If not found (new or legacy flat structure mixed), return default empty
    # The frontend will populate with defaults 
    return DocumentTypeSettings()


@router.post("/{lodge_id}/document-settings/{doc_type}")
def update_lodge_document_settings(
    lodge_id: int,
    doc_type: str,
    settings: DocumentTypeSettings,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """
    Salva as configurações de documento para um tipo específico.
    """
    lodge = lodge_service.get_lodge(db, lodge_id)
    if not lodge:
        raise HTTPException(status_code=404, detail="Lodge not found")

    # Verifica permissão: Apenas Webmaster da loja ou SuperAdmin
    user_lodge_id = current_user.get("lodge_id")
    user_type = current_user.get("user_type")
    
    if user_type != "super_admin":
        if user_type != "webmaster" or str(user_lodge_id) != str(lodge_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Apenas o Webmaster pode alterar configurações de documentos."
            )

    # Load existing settings
    current_json = dict(lodge.document_settings or {})
    
    # --- Copy-on-Write Logic ---
    # Before saving 'personalizations' (JSON), ensure the physical template exists locally.
    # If not, copy from 'model' (Global Master) -> 'loja_X' (Local Shadow).
    
    if lodge.lodge_number:
        safe_number = "".join(c for c in str(lodge.lodge_number) if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
        folder_name = f"loja_{safe_number}"
    else:
        folder_name = f"loja_id_{lodge.id}"
        
    base_storage = os.path.join("storage", "lodges")
    local_template_dir = os.path.join(base_storage, folder_name, "templates", doc_type)
    
    # Check if local templates exist (any file in the dir is enough signal)
    # If not, populate from Master
    if not os.path.exists(local_template_dir) or not os.listdir(local_template_dir):
        os.makedirs(local_template_dir, exist_ok=True)
        
        # Source: Master Model
        # TODO: This mapping should be centralized in DocumentGenerationService ideally
        if doc_type == "balaustre":
            master_file = "balaustre_template.html"
            subpath = os.path.join("templates", "balaustre")
        elif doc_type == "edital":
             master_file = "edital_template.html"
             # Assuming structure...
             subpath = os.path.join("templates", "edital")
        else:
             # Generic fallback
             master_file = f"{doc_type}_template.html"
             subpath = os.path.join("templates", doc_type)

        master_path = os.path.join(base_storage, "model", subpath, master_file)
        
        if os.path.exists(master_path):
            import shutil
            target_path = os.path.join(local_template_dir, master_file)
            try:
                shutil.copy2(master_path, target_path)
                print(f"DEBUG: Copy-on-Write triggered. Cloned {master_file} to {target_path}")
            except Exception as e:
                print(f"ERROR: Failed to clone master template: {e}")
                # We do NOT raise here, preventing save failure, but logging is critical.
        else:
             print(f"WARNING: Master template not found at {master_path}. Lodge {lodge_id} saving settings without physical base file.")

    # Update specific doc_type
    current_json[doc_type] = settings.model_dump()
    
    # Save back
    lodge.document_settings = current_json
    flag_modified(lodge, "document_settings") # Important for JSON columns in some SQLA versions
    
    db.commit()
    return {"message": "Configurações salvas com sucesso."}


@router.delete("/{lodge_id}/document-settings/{doc_type}/reset")
def reset_lodge_document_settings(
    lodge_id: int,
    doc_type: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """
    Restaura as configurações de documento para o padrão do sistema (Sigma).
    Isso exclui quaisquer personalizações locais (arquivos e configurações) da loja.
    """
    lodge = lodge_service.get_lodge(db, lodge_id)
    if not lodge:
        raise HTTPException(status_code=404, detail="Lodge not found")

    # Verifica permissão: Apenas Webmaster da loja ou SuperAdmin
    user_lodge_id = current_user.get("lodge_id")
    user_type = current_user.get("user_type")
    
    if user_type != "super_admin":
        if user_type != "webmaster" or str(user_lodge_id) != str(lodge_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Apenas o Webmaster pode redefinir configurações de documentos."
            )

    # 1. Update DB: Remove Settings Key
    current_json = dict(lodge.document_settings or {})
    if doc_type in current_json:
        del current_json[doc_type]
        lodge.document_settings = current_json
        flag_modified(lodge, "document_settings")
        db.commit()

    # 2. Delete Physical Template Files
    # Path: storage/lodges/loja_X/templates/{doc_type}/
    if lodge.lodge_number:
        safe_number = "".join(c for c in str(lodge.lodge_number) if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
        folder_name = f"loja_{safe_number}"
    else:
        folder_name = f"loja_id_{lodge.id}"
        
    base_storage = os.path.join("storage", "lodges")
    template_dir = os.path.join(base_storage, folder_name, "templates", doc_type)
    
    try:
        if os.path.exists(template_dir):
            shutil.rmtree(template_dir)
            # Re-create empty dir? No, absence of dir signals "Use Master"
    except Exception as e:
        # Log but don't fail, DB is already updated
        print(f"Erro ao excluir arquivos de template em {template_dir}: {e}")
        
    return {"message": "Configurações restauradas para o padrão do sistema."}
