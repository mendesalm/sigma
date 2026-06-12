from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import database
import dependencies
from app.modules.members.schemas import member_role_schema
from models import models
from app.core.logger import logger

router = APIRouter(
    prefix="/members",
    tags=["Member Roles & Permissions"],
)

@router.post(
    "/{member_id}/roles", 
    status_code=status.HTTP_201_CREATED,
    summary="Atribuir Cargo ao Membro",
    description="Atribui um cargo específico a um membro, definindo as datas de início e fim. O Webmaster só pode atuar na sua própria loja/obediência."
)
def assign_role_to_member(
    member_id: int,
    assignment: member_role_schema.MemberRoleAssign,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.require_permission("members:assign_role")),
):
    # Verify target member exists
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        logger.warning("Tentativa de atribuir cargo a membro inexistente", extra={"extra_data": {"member_id": member_id}})
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    # Verify Role exists
    role = db.query(models.Role).filter(models.Role.id == assignment.role_id).first()
    if not role:
        logger.warning("Tentativa de atribuir cargo inexistente", extra={"extra_data": {"role_id": assignment.role_id}})
        raise HTTPException(status_code=404, detail="Cargo não encontrado.")

    # Security Check: Ensure Webmaster/User is assigning role within their allowed context
    if context.user_type == "webmaster":
        if assignment.lodge_id and context.lodge_id != assignment.lodge_id:
            logger.warning("Acesso negado: Webmaster tentou atribuir cargo em outra Loja", extra={"extra_data": {"target_lodge": assignment.lodge_id}})
            raise HTTPException(status_code=403, detail="Não é possível atribuir cargo a outra Loja.")
        if assignment.obedience_id and context.obedience_id != assignment.obedience_id:
            logger.warning("Acesso negado: Webmaster tentou atribuir cargo em outra Obediência", extra={"extra_data": {"target_obedience": assignment.obedience_id}})
            raise HTTPException(status_code=403, detail="Não é possível atribuir cargo a outra Obediência.")

    # Create Association
    if assignment.lodge_id:
        existing = (
            db.query(models.MemberLodgeAssociation)
            .filter(
                models.MemberLodgeAssociation.member_id == member_id,
                models.MemberLodgeAssociation.lodge_id == assignment.lodge_id,
            )
            .first()
        )

        if existing:
            existing.role_id = assignment.role_id
            existing.start_date = assignment.start_date
            existing.end_date = assignment.end_date
            logger.info("Cargo de membro em Loja atualizado", extra={"extra_data": {"member_id": member_id, "lodge_id": assignment.lodge_id}})
        else:
            new_assoc = models.MemberLodgeAssociation(
                member_id=member_id,
                lodge_id=assignment.lodge_id,
                role_id=assignment.role_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
            )
            db.add(new_assoc)
            logger.info("Novo cargo atribuído ao membro em Loja", extra={"extra_data": {"member_id": member_id, "lodge_id": assignment.lodge_id}})

    elif assignment.obedience_id:
        existing = (
            db.query(models.MemberObedienceAssociation)
            .filter(
                models.MemberObedienceAssociation.member_id == member_id,
                models.MemberObedienceAssociation.obedience_id == assignment.obedience_id,
            )
            .first()
        )

        if existing:
            existing.role_id = assignment.role_id
            existing.start_date = assignment.start_date
            existing.end_date = assignment.end_date
            logger.info("Cargo de membro em Obediência atualizado", extra={"extra_data": {"member_id": member_id, "obedience_id": assignment.obedience_id}})
        else:
            new_assoc = models.MemberObedienceAssociation(
                member_id=member_id,
                obedience_id=assignment.obedience_id,
                role_id=assignment.role_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
            )
            db.add(new_assoc)
            logger.info("Novo cargo atribuído ao membro em Obediência", extra={"extra_data": {"member_id": member_id, "obedience_id": assignment.obedience_id}})

    db.commit()
    return {"message": "Role assigned successfully"}


@router.post(
    "/{member_id}/permissions/exceptions", 
    status_code=status.HTTP_201_CREATED,
    summary="Gerenciar Exceção de Permissão",
    description="Permite adicionar ou alterar uma exceção (conceder ou negar pontualmente) de uma permissão para um membro específico."
)
def manage_permission_exception(
    member_id: int,
    exception_data: member_role_schema.MemberPermissionExceptionCreate,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.require_permission("admin:manage_permissions")),
):
    # Verify member
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        logger.warning("Tentativa de gerenciar exceção para membro inexistente", extra={"extra_data": {"member_id": member_id}})
        raise HTTPException(status_code=404, detail="Membro não encontrado.")

    # Verify context security
    if context.user_type == "webmaster":
        if exception_data.lodge_id and context.lodge_id != exception_data.lodge_id:
            logger.warning("Acesso negado: Webmaster tentou gerenciar exceção em outra Loja", extra={"extra_data": {"target_lodge": exception_data.lodge_id}})
            raise HTTPException(status_code=403, detail="Não é possível gerenciar exceções para outra Loja.")
        if exception_data.obedience_id and context.obedience_id != exception_data.obedience_id:
            logger.warning("Acesso negado: Webmaster tentou gerenciar exceção em outra Obediência", extra={"extra_data": {"target_obedience": exception_data.obedience_id}})
            raise HTTPException(status_code=403, detail="Não é possível gerenciar exceções para outra Obediência.")

    # Check if exception already exists
    query = db.query(models.MemberPermissionException).filter(
        models.MemberPermissionException.member_id == member_id,
        models.MemberPermissionException.permission_id == exception_data.permission_id,
    )
    if exception_data.lodge_id:
        query = query.filter(models.MemberPermissionException.lodge_id == exception_data.lodge_id)
    elif exception_data.obedience_id:
        query = query.filter(models.MemberPermissionException.obedience_id == exception_data.obedience_id)

    existing = query.first()

    if existing:
        existing.exception_type = exception_data.exception_type
        logger.info("Exceção de permissão atualizada para membro", extra={"extra_data": {"member_id": member_id, "permission_id": exception_data.permission_id}})
    else:
        new_exception = models.MemberPermissionException(
            member_id=member_id,
            permission_id=exception_data.permission_id,
            exception_type=exception_data.exception_type,
            lodge_id=exception_data.lodge_id,
            obedience_id=exception_data.obedience_id,
        )
        db.add(new_exception)
        logger.info("Exceção de permissão criada para membro", extra={"extra_data": {"member_id": member_id, "permission_id": exception_data.permission_id}})

    db.commit()
    return {"message": "Permission exception updated successfully"}
