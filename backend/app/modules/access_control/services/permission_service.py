from sqlalchemy.orm import Session

from app.modules.access_control.schemas import permission_schema
from models import models


def get_permission(db: Session, permission_id: int) -> models.Permission | None:
    """Busca uma permissão pelo ID."""
    return db.query(models.Permission).filter(models.Permission.id == permission_id).first()


def get_permission_by_action(db: Session, action: str) -> models.Permission | None:
    """Busca uma permissão através do nome da sua ação restritiva."""
    return db.query(models.Permission).filter(models.Permission.action == action).first()


def get_permissions(db: Session, skip: int = 0, limit: int = 100) -> list[models.Permission]:
    """Retorna uma lista paginada de todas as permissões cadastradas."""
    return db.query(models.Permission).offset(skip).limit(limit).all()


def create_permission(db: Session, permission: permission_schema.PermissionCreate) -> models.Permission:
    """Cria e insere uma nova permissão no banco de dados."""
    db_permission = models.Permission(**permission.model_dump())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission


def update_permission(
    db: Session, permission_id: int, permission_update: permission_schema.PermissionUpdate
) -> models.Permission | None:
    """Atualiza de forma parcial os dados de uma permissão existente."""
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return None

    update_data = permission_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permission, key, value)

    db.commit()
    db.refresh(db_permission)
    return db_permission


def delete_permission(db: Session, permission_id: int) -> models.Permission | None:
    """Remove definitivamente uma permissão do banco de dados."""
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return None

    db.delete(db_permission)
    db.commit()
    return db_permission
