from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import database
import dependencies
from app.modules.core.schemas import obedience_schema
from app.modules.core.services import obedience_service

router = APIRouter(
    prefix="/obediences",
    tags=["Obediences"],
)

# Dependency to check for super admin role
# Dependency to check for super admin role
# Now using shared dependency


@router.post("/", response_model=obedience_schema.ObedienceResponse, status_code=status.HTTP_201_CREATED)
def create_obedience(
    obedience: obedience_schema.ObedienceCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Create a new obedience. Only accessible by super admins."""
    return obedience_service.create_obedience(db=db, obedience=obedience)


@router.get("/", response_model=list[obedience_schema.ObedienceResponse])
def read_obediences(
    skip: int = 0, limit: int = 100, only_top_level: bool = False, parent_id: int | None = None, db: Session = Depends(database.get_db)
):
    """Retrieve all obediences. Publicly accessible."""
    obediences = obedience_service.get_obediences(db, skip=skip, limit=limit, only_top_level=only_top_level, parent_id=parent_id)
    return obediences


@router.get("/{obedience_id}", response_model=obedience_schema.ObedienceResponse)
def read_obedience(obedience_id: int, db: Session = Depends(database.get_db)):
    """Retrieve a single obedience by ID. Publicly accessible."""
    db_obedience = obedience_service.get_obedience(db, obedience_id=obedience_id)
    if db_obedience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obedience not found")
    return db_obedience


@router.put("/{obedience_id}", response_model=obedience_schema.ObedienceResponse)
def update_obedience(
    obedience_id: int,
    obedience: obedience_schema.ObedienceUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Update an obedience. Only accessible by super admins."""
    db_obedience = obedience_service.update_obedience(db, obedience_id=obedience_id, obedience_update=obedience)
    if db_obedience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obedience not found")
    return db_obedience


@router.delete("/{obedience_id}", response_model=obedience_schema.ObedienceResponse)
def delete_obedience(
    obedience_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Delete an obedience. Only accessible by super admins."""
    db_obedience = obedience_service.delete_obedience(db, obedience_id=obedience_id)
    if db_obedience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obedience not found")
    return db_obedience


@router.post("/{obedience_id}/settings/reset")
def reset_obedience_settings(
    obedience_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """
    Realiza o reset das configurações da Obediência para os padrões de fábrica.
    Faz backup do estado atual em 'previous_settings' para permitir reversão.
    Acesso restrito a Webmaster da Obediência e Super Admin.
    """
    obedience = obedience_service.get_obedience(db, obedience_id)
    if not obedience:
        raise HTTPException(status_code=404, detail="Obedience not found")

    user_type = current_user.get("user_type")
    user_obedience_id = current_user.get("obedience_id")

    if user_type != "super_admin":
        if user_type != "webmaster" or str(user_obedience_id) != str(obedience_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso restrito: Apenas o Webmaster da obediência pode realizar o reset.",
            )

    # Check if already at factory settings
    factory_modules = {
        "member_registration": True,
        "session_management": True,
        "session_attendance": True,
        "chancellery": True,
    }

    is_modules_factory = obedience.available_modules == factory_modules or obedience.available_modules is None

    if is_modules_factory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A obediência já está com as configurações de fábrica. O reset foi cancelado para proteger o backup anterior."
        )

    # Backup current settings
    backup = {
        "available_modules": obedience.available_modules,
    }
    obedience.previous_settings = backup

    # Reset settings
    obedience.available_modules = {
        "member_registration": True,
        "session_management": True,
        "session_attendance": True,
        "chancellery": True,
    }

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(obedience, "available_modules")
    flag_modified(obedience, "previous_settings")

    db.commit()
    return {"message": "Configurações resetadas com sucesso. Em caso de acidente, contate o Suporte para restaurar."}


@router.post("/{obedience_id}/settings/restore_previous")
def restore_previous_obedience_settings(
    obedience_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """
    Restaura as configurações de fábrica a partir do backup feito no último reset.
    Acesso EXCLUSIVO a Super Admins.
    """
    obedience = obedience_service.get_obedience(db, obedience_id)
    if not obedience:
        raise HTTPException(status_code=404, detail="Obedience not found")

    if not obedience.previous_settings:
        raise HTTPException(status_code=400, detail="Não há configurações anteriores para restaurar.")

    previous = obedience.previous_settings
    if "available_modules" in previous:
        obedience.available_modules = previous["available_modules"]

    obedience.previous_settings = None # Clear backup after restore

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(obedience, "available_modules")
    flag_modified(obedience, "previous_settings")

    db.commit()
    return {"message": "Configurações restauradas para a versão anterior com sucesso."}
