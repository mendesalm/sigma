from sqlalchemy.orm import Session, joinedload

from app.modules.access_control.schemas import role_schema
from models import models


def get_role(db: Session, role_id: int) -> models.Role | None:
    """Busca um Cargo (Role) pelo seu ID, já carregando as permissões associadas."""
    return db.query(models.Role).options(joinedload(models.Role.permissions)).filter(models.Role.id == role_id).first()


def get_role_by_name(db: Session, name: str) -> models.Role | None:
    """Busca um Cargo (Role) pelo seu nome exato."""
    return db.query(models.Role).filter(models.Role.name == name).first()


def get_roles(db: Session, skip: int = 0, limit: int = 100, role_type: str = None) -> list[models.Role]:
    """Retorna uma lista paginada de todos os Cargos, opcionalmente filtrada pelo tipo do cargo."""
    query = db.query(models.Role).options(joinedload(models.Role.permissions))
    if role_type:
        query = query.filter(models.Role.role_type == role_type)
    return query.offset(skip).limit(limit).all()


def create_role(db: Session, role: role_schema.RoleCreate) -> models.Role:
    """Cria um novo cargo e faz a amarração com suas respectivas permissões."""
    role_data = role.model_dump(exclude={"permission_ids"})
    db_role = models.Role(**role_data)

    # Busca as instâncias de permissão pelos IDs e faz o vínculo
    if role.permission_ids:
        permissions = db.query(models.Permission).filter(models.Permission.id.in_(role.permission_ids)).all()
        db_role.permissions = permissions

    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


def update_role(db: Session, role_id: int, role_update: role_schema.RoleUpdate) -> models.Role | None:
    """Atualiza as propriedades e a lista de permissões associadas a um cargo existente."""
    db_role = get_role(db, role_id)
    if not db_role:
        return None

    update_data = role_update.model_dump(exclude_unset=True, exclude={"permission_ids"})
    for key, value in update_data.items():
        setattr(db_role, key, value)

    # Lida com as atualizações das permissões vinculadas
    if role_update.permission_ids is not None:
        permissions = db.query(models.Permission).filter(models.Permission.id.in_(role_update.permission_ids)).all()
        db_role.permissions = permissions

    db.commit()
    db.refresh(db_role)
    return db_role


def delete_role(db: Session, role_id: int) -> models.Role | None:
    """Exclui um cargo definitivamente do banco de dados."""
    db_role = get_role(db, role_id)
    if not db_role:
        return None

    db.delete(db_role)
    db.commit()
    return db_role
