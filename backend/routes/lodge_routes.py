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
