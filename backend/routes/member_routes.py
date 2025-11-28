from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import database, dependencies
from models.models import Member, Lodge, MemberLodgeAssociation, RoleHistory
from schemas import member_schema
from services import member_service

router = APIRouter(
    prefix="/members",
    tags=["Lodge Members"],
)


@router.post("/", response_model=member_schema.MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    member: member_schema.MemberCreateWithAssociation,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Create a new member. Webmasters can only create for their lodge."""
    user_type = current_user.get("user_type")
    
    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        if member.lodge_id != lodge_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You can only create members for your own lodge."
            )
    elif user_type != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        return member_service.create_member_for_lodge(db=db, member_data=member)
    except IntegrityError as e:
        if "ix_members_email" in str(e.orig):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
        if "ix_members_cpf" in str(e.orig):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CPF already registered.")
        if "ix_members_cim" in str(e.orig):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CIM already registered.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e.orig))


@router.get("/", response_model=list[member_schema.MemberResponse])
def read_members(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Retrieve members. SuperAdmins see all, Webmasters see their lodge's."""
    user_type = current_user.get("user_type")

    if user_type == "super_admin":
        members = db.query(Member).offset(skip).limit(limit).all()
        return members
    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        members = member_service.get_members_by_lodge(db, lodge_id=lodge_id, skip=skip, limit=limit)
        return members
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/{member_id}", response_model=member_schema.MemberResponse)
def read_member(
    member_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Retrieve a specific member."""
    user_type = current_user.get("user_type")
    
    if user_type == "super_admin":
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found")
        return db_member
    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        db_member = member_service.get_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id)
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found in this lodge")
        return db_member
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.put("/{member_id}", response_model=member_schema.MemberResponse)
def update_member(
    member_id: int,
    member: member_schema.MemberUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Update a member."""
    user_type = current_user.get("user_type")
    
    if user_type == "super_admin":
        # For SuperAdmin, we need a generic update service or reuse existing logic if appropriate
        # For now, let's assume we can use the same service but we need to be careful about lodge association checks
        # Ideally we should have a generic update_member service. 
        # But member_service.update_member_in_lodge checks for lodge association.
        
        # Let's fetch the member first
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")
            
        # Update logic similar to update_member_in_lodge but without lodge check
        from utils.password_utils import hash_password
        update_data = member.model_dump(exclude_unset=True)
        if "password" in update_data:
            db_member.password_hash = hash_password(update_data.pop("password"))

        for key, value in update_data.items():
            setattr(db_member, key, value)

        db.commit()
        db.refresh(db_member)
        return db_member

    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        db_member = member_service.update_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id, member_update=member)
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found in this lodge")
        return db_member
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member_association(
    member_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Disassociate a member (Webmaster) or Delete member (SuperAdmin)."""
    user_type = current_user.get("user_type")
    
    if user_type == "super_admin":
        # SuperAdmin deletes the member entirely? Or just association?
        # For now, let's implement full delete for SuperAdmin
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")
        db.delete(db_member)
        db.commit()
        return

    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        deleted_association = member_service.delete_member_association(db, member_id=member_id, lodge_id=lodge_id)
        if deleted_association is None:
            raise HTTPException(status_code=404, detail="Member association not found in this lodge")
        return
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.post("/{member_id}/roles", response_model=member_schema.RoleHistoryResponse, status_code=status.HTTP_201_CREATED)
def add_role_history(
    member_id: int,
    role_data: member_schema.RoleHistoryCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Add a role history entry for a member."""
    user_type = current_user.get("user_type")
    
    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        
        # Verify member belongs to lodge
        member = member_service.get_member_in_lodge(db, member_id, lodge_id)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found in this lodge")
            
        return member_service.add_role_to_member(db, member_id, lodge_id, role_data)
        
    elif user_type == "super_admin":
        # For SuperAdmin, we need to know which lodge context. 
        # Ideally, the frontend should pass lodge_id, but RoleHistoryCreate doesn't have it.
        # We can assume the member's primary lodge or require lodge_id in the request.
        # For simplicity, let's look up the member's lodge association.
        # WARNING: This might be ambiguous if member has multiple lodges.
        # For now, let's fetch the first lodge association.
        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
            
        association = db.query(MemberLodgeAssociation).filter(MemberLodgeAssociation.member_id == member_id).first()
        if not association:
             raise HTTPException(status_code=400, detail="Member has no lodge association")
             
        return member_service.add_role_to_member(db, member_id, association.lodge_id, role_data)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.delete("/{member_id}/roles/{role_history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role_history(
    member_id: int,
    role_history_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Delete a role history entry."""
    user_type = current_user.get("user_type")
    
    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
             
        success = member_service.delete_role_history(db, member_id, role_history_id, lodge_id)
        if not success:
            raise HTTPException(status_code=404, detail="Role history entry not found or not accessible")
            
    elif user_type == "super_admin":
        # SuperAdmin can delete any, but service requires lodge_id.
        # We need to find the lodge_id for this role_history entry.
        role_history = db.query(RoleHistory).filter(RoleHistory.id == role_history_id).first()
        if not role_history:
             raise HTTPException(status_code=404, detail="Role history entry not found")
             
        success = member_service.delete_role_history(db, member_id, role_history_id, role_history.lodge_id)
        if not success:
             raise HTTPException(status_code=404, detail="Failed to delete role history")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


from fastapi import File, UploadFile
import shutil
import os

@router.post(
    "/{member_id}/photo",
    status_code=status.HTTP_200_OK,
    summary="Upload de Foto de Perfil",
    description="""
    ## Upload de Foto de Perfil do Membro
    
    Faz upload da foto de perfil de um membro, salvando em estrutura isolada por loja.
    
    ### 📋 Requisitos
    
    - ✅ Membro deve ter **CIM** cadastrado
    - ✅ Usuário autenticado com permissões adequadas
    - ✅ Arquivo no formato de imagem (jpg, png, gif, etc.)
    
    ### 🔐 Permissões
    
    - **Webmaster**: Pode fazer upload **apenas** para membros de sua loja
    - **SuperAdmin**: Pode fazer upload para **qualquer** membro
    
    ### 📁 Estrutura de Armazenamento
    
    ```
    storage/lodges/loja_{{lodge_number}}/profile_pictures/{{cim}}.ext
    ```
    
    **Exemplo**:
    ```
    storage/lodges/loja_2181/profile_pictures/272875.jpg
    ```
    
    ### 🔄 Funcionamento
    
    1. Valida se o membro possui CIM
    2. Determina a loja do contexto (Webmaster) ou do membro (SuperAdmin)
    3. Busca o `lodge_number` da loja
    4. Cria diretório se não existir
    5. Salva arquivo com nome `{cim}.{extensão}`
    6. Atualiza `member.profile_picture_path` no banco de dados
    
    ### ⚠️ Observações
    
    - O arquivo substitui a foto anterior (mesmo nome)
    - O caminho é armazenado relativo: `/storage/lodges/loja_{number}/profile_pictures/{cim}.ext`
    - A URL pública é: `http://api.url/storage/lodges/loja_{number}/profile_pictures/{cim}.ext`
    """,
    response_description="Informações do arquivo salvo",
    responses={
        200: {
            "description": "Upload realizado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "filename": "272875.jpg",
                        "path": "/storage/lodges/loja_2181/profile_pictures/272875.jpg"
                    }
                }
            }
        },
        400: {
            "description": "Membro não possui CIM cadastrado",
            "content": {
                "application/json": {
                    "example": {"detail": "Member must have a CIM to upload profile picture"}
                }
            }
        },
        403: {
            "description": "Usuário não autorizado para esta operação",
            "content": {
                "application/json": {
                    "example": {"detail": "Webmaster not associated with a lodge"}
                }
            }
        },
        404: {
            "description": "Membro não encontrado",
            "content": {
                "application/json": {
                    "example": {"detail": "Member not found in this lodge"}
                }
            }
        }
    },
    tags=["Lodge Members"]
)
async def upload_profile_picture(
    member_id: int,
    file: UploadFile = File(..., description="Arquivo de imagem da foto de perfil"),
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Upload a profile picture for a member."""
    user_type = current_user.get("user_type")
    
    # Check authorization
    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        
        # Verify member belongs to the lodge
        db_member = member_service.get_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id)
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found in this lodge")
        
        # Get lodge code
        lodge = db.query(Lodge).filter(Lodge.id == lodge_id).first()
        lodge_code = lodge.lodge_code if lodge else f"lodge_{lodge_id}"
            
    elif user_type == "super_admin":
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Get lodge code from member's association
        association = db.query(MemberLodgeAssociation).filter(
            MemberLodgeAssociation.member_id == member_id
        ).first()
        if association:
            lodge = db.query(Lodge).filter(Lodge.id == association.lodge_id).first()
            lodge_code = lodge.lodge_code if lodge else "unknown_lodge"
        else:
            lodge_code = "unknown_lodge"
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Validate that member has a CIM
    if not db_member.cim:
        raise HTTPException(status_code=400, detail="Member must have a CIM to upload profile picture")
    
    # Validate image file
    from utils.image_validator import validate_image
    
    try:
        file_contents = await validate_image(file)
    except HTTPException as e:
        # Re-raise validation errors
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erro ao validar imagem: {str(e)}"
        )
    
    # Define file location using new structure
    # Structure: storage/lodges/loja_{lodge_number}/profile_pictures/{cim}.ext
    from pathlib import Path
    BACKEND_DIR = Path(__file__).parent.parent
    PROJECT_ROOT = BACKEND_DIR.parent  # Go up to sigma/ directory
    STORAGE_DIR = PROJECT_ROOT / "storage" / "lodges"
    
    # Get lodge to access lodge_number
    if user_type == "webmaster":
        lodge_for_upload = db.query(Lodge).filter(Lodge.id == lodge_id).first()
    else:
        # For super_admin, get lodge from member's association
        association = db.query(MemberLodgeAssociation).filter(
            MemberLodgeAssociation.member_id == member_id
        ).first()
        if association:
            lodge_for_upload = db.query(Lodge).filter(Lodge.id == association.lodge_id).first()
        else:
            lodge_for_upload = None
        
    if not lodge_for_upload:
        raise HTTPException(status_code=400, detail="Cannot determine lodge for member")
    
    # Use lodge_number for directory name (e.g., loja_2181)
    lodge_number = lodge_for_upload.lodge_number if lodge_for_upload.lodge_number else str(lodge_for_upload.id)
    directory = STORAGE_DIR / f"loja_{lodge_number}" / "profile_pictures"
    directory.mkdir(parents=True, exist_ok=True)
    
    # Get file extension
    file_extension = os.path.splitext(file.filename)[1]
    # Use CIM as filename instead of member_id
    new_filename = f"{db_member.cim}{file_extension}"
    file_path = directory / new_filename
    
    # Save file using validated contents
    with open(file_path, "wb") as buffer:
        buffer.write(file_contents)
        
    # Update member profile_picture_path in DB
    # Store path relative to storage mount: /storage/lodges/loja_{lodge_number}/profile_pictures/{cim}.ext
    relative_path = f"/storage/lodges/loja_{lodge_number}/profile_pictures/{new_filename}"
    
    # Update using service or direct DB update (since we already have the object)
    db_member.profile_picture_path = relative_path
    db.commit()
    db.refresh(db_member)
    
    return {"filename": new_filename, "path": relative_path}

