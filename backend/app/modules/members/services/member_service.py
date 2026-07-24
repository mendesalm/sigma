from datetime import date

from sqlalchemy.orm import Session, joinedload

from app.modules.access_control.utils.password_utils import hash_password
from app.modules.members.schemas import member_schema
from models import models
from app.core.logger import logger


def get_members_by_lodge(db: Session, lodge_id: int, skip: int = 0, limit: int = 100) -> list[models.Member]:
    """Busca todos os membros associados a uma loja específica com carregamento rápido otimizado (eager loading)."""
    members = (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.MemberLodgeAssociation.lodge_id == lodge_id)
        .options(joinedload(models.Member.role_history).joinedload(models.RoleHistory.role))
        .order_by(models.Member.full_name)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return members


def get_member_in_lodge(db: Session, member_id: int, lodge_id: int) -> models.Member | None:
    """Busca um membro único caso ele esteja associado à loja especificada."""
    return (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.Member.id == member_id, models.MemberLodgeAssociation.lodge_id == lodge_id)
        .first()
    )


def get_member_by_cim(db: Session, cim: str) -> models.Member | None:
    """Busca um membro através de seu CIM (Cadastro Individual Maçônico)."""
    return db.query(models.Member).filter(models.Member.cim == cim).first()


def create_member_for_lodge(db: Session, member_data: member_schema.MemberCreateWithAssociation) -> models.Member:
    """Cria um novo membro e o associa automaticamente a uma loja (contexto do Webmaster)."""
    password = member_data.password
    lodge_id = member_data.lodge_id
    role_id = member_data.role_id
    status = member_data.status
    member_class = member_data.member_class
    family_members_data = member_data.family_members
    cim = member_data.cim

    # Validação de unicidade de CIM na mesma Potência (Com Pessimistic Locking)
    if cim:
        lodge = db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
        if lodge:
            # Trava a obediência para atualizações concorrentes, serializando a verificação
            db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).with_for_update().first()
            
            existing_cim_member = (
                db.query(models.Member)
                .join(models.MemberObedienceAssociation, models.Member.id == models.MemberObedienceAssociation.member_id)
                .filter(models.Member.cim == cim, models.MemberObedienceAssociation.obedience_id == lodge.obedience_id)
                .first()
            )
            if existing_cim_member:
                logger.warning(f"Tentativa de criar membro com CIM {cim} que já existe na mesma Obediência {lodge.obedience_id}")
                raise ValueError("CIM já cadastrado nesta Potência.")

    member_dict = member_data.model_dump(
        exclude={"password", "lodge_id", "role_id", "family_members", "status", "member_class", "masonic_history", "diplomas"}
    )

    masonic_history_data = getattr(member_data, "masonic_history", None) or []
    
    db_member = models.Member(**member_dict, password_hash=hash_password(password))
    db.add(db_member)
    db.flush()
    
    for event_data in masonic_history_data:
        ev_dict = event_data.model_dump(exclude={"diploma"}) if hasattr(event_data, "model_dump") else event_data
        db_ev = members_models.MasonicEvent(**ev_dict, member_id=db_member.id)
        db.add(db_ev)


    association = models.MemberLodgeAssociation(
        member_id=db_member.id, lodge_id=lodge_id, status=status, member_class=member_class, start_date=date.today()
    )
    db.add(association)

    if role_id:
        role_history = models.RoleHistory(
            member_id=db_member.id, role_id=role_id, lodge_id=lodge_id, start_date=date.today(), end_date=None
        )
        db.add(role_history)

    if family_members_data:
        for fm_data in family_members_data:
            db_family_member = members_models.FamilyMember(**fm_data.model_dump(), member_id=db_member.id)
            db.add(db_family_member)

    db.commit()
    db.refresh(db_member)
    logger.info("Membro criado e associado a loja com sucesso", extra={"extra_data": {"member_id": db_member.id, "lodge_id": lodge_id}})
    return db_member


def associate_member_to_lodge(
    db: Session, member_id: int, association_data: member_schema.MemberAssociateLodge
) -> models.Member:
    """Associa um membro existente a uma loja e atualiza os dados, caso informados."""
    db_member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not db_member:
        logger.warning("Tentativa de associar membro inexistente a loja", extra={"extra_data": {"member_id": member_id}})
        raise ValueError("Membro não encontrado.")

    # [SECURITY] Cross-Tenant Validation: 
    # Garantir que o membro já pertence à Obediência da Loja para qual está sendo importado.
    target_lodge = db.query(models.Lodge).filter(models.Lodge.id == association_data.lodge_id).first()
    if not target_lodge:
        raise ValueError("Loja destino não encontrada.")

    member_obedience = (
        db.query(models.MemberObedienceAssociation)
        .filter(
            models.MemberObedienceAssociation.member_id == member_id,
            models.MemberObedienceAssociation.obedience_id == target_lodge.obedience_id
        )
        .first()
    )
    if not member_obedience:
        logger.warning(f"IDOR Alert: Tentativa de importar membro {member_id} para a loja {target_lodge.id} (Potência divergente).")
        raise ValueError("Membro não pertence a esta Potência e não pode ser importado.")

    existing_association = (
        db.query(models.MemberLodgeAssociation)
        .filter(
            models.MemberLodgeAssociation.member_id == member_id,
            models.MemberLodgeAssociation.lodge_id == association_data.lodge_id,
        )
        .first()
    )

    if existing_association:
        existing_association.status = association_data.status
        existing_association.member_class = association_data.member_class
        logger.info("Associação de membro atualizada", extra={"extra_data": {"member_id": member_id, "lodge_id": association_data.lodge_id}})
    else:
        new_association = models.MemberLodgeAssociation(
            member_id=member_id,
            lodge_id=association_data.lodge_id,
            status=association_data.status,
            member_class=association_data.member_class,
            start_date=date.today(),
        )
        db.add(new_association)
        logger.info("Membro associado a loja", extra={"extra_data": {"member_id": member_id, "lodge_id": association_data.lodge_id}})

    if association_data.member_update:
        update_data = association_data.member_update.model_dump(exclude_unset=True)
        if "password" in update_data:
            if update_data["password"]:
                db_member.password_hash = hash_password(update_data.pop("password"))
            else:
                update_data.pop("password")

        family_members_data = update_data.pop('family_members', None)
        masonic_history_data = update_data.pop('masonic_history', None)
        decorations_data = update_data.pop('decorations', None)

        for key, value in update_data.items():
            setattr(db_member, key, value)

        if family_members_data is not None:
            db.query(members_models.FamilyMember).filter(members_models.FamilyMember.member_id == db_member.id).delete()
            for fm in family_members_data:
                db.add(members_models.FamilyMember(**fm, member_id=db_member.id))

        if masonic_history_data is not None:
            db.query(members_models.MasonicEvent).filter(members_models.MasonicEvent.member_id == db_member.id).delete()
            for mh in masonic_history_data:
                mh_dict = mh.copy()
                mh_dict.pop('diploma', None)
                mh_dict.pop('raw_lodge_name', None)
                db.add(members_models.MasonicEvent(**mh_dict, member_id=db_member.id))
                
        if decorations_data is not None:
            db.query(members_models.Decoration).filter(members_models.Decoration.member_id == db_member.id).delete()
            for dec in decorations_data:
                db.add(members_models.Decoration(**dec, member_id=db_member.id))

    if association_data.role_id:
        active_role = (
            db.query(models.RoleHistory)
            .filter(
                models.RoleHistory.member_id == member_id,
                models.RoleHistory.lodge_id == association_data.lodge_id,
                models.RoleHistory.end_date.is_(None),
            )
            .first()
        )

        if active_role:
            if active_role.role_id != association_data.role_id:
                active_role.end_date = date.today()
                new_role = models.RoleHistory(
                    member_id=member_id,
                    role_id=association_data.role_id,
                    lodge_id=association_data.lodge_id,
                    start_date=date.today(),
                )
                db.add(new_role)
        else:
            new_role = models.RoleHistory(
                member_id=member_id,
                role_id=association_data.role_id,
                lodge_id=association_data.lodge_id,
                start_date=date.today(),
            )
            db.add(new_role)

    db.commit()
    db.refresh(db_member)
    return db_member


def update_member_in_lodge(
    db: Session, member_id: int, lodge_id: int, member_update: member_schema.MemberUpdate
) -> models.Member | None:
    """Atualiza as informações cadastrais de um membro, garantindo que pertença à loja informada."""
    db_member = get_member_in_lodge(db, member_id, lodge_id)
    if not db_member:
        return None

    update_data = member_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        db_member.password_hash = hash_password(update_data.pop("password"))

    family_members_data = update_data.pop('family_members', None)
    masonic_history_data = update_data.pop('masonic_history', None)
    decorations_data = update_data.pop('decorations', None)

    for key, value in update_data.items():
        setattr(db_member, key, value)

    if family_members_data is not None:
        db.query(members_models.FamilyMember).filter(members_models.FamilyMember.member_id == db_member.id).delete()
        for fm in family_members_data:
            db.add(members_models.FamilyMember(**fm, member_id=db_member.id))

    if masonic_history_data is not None:
        db.query(members_models.MasonicEvent).filter(members_models.MasonicEvent.member_id == db_member.id).delete()
        for mh in masonic_history_data:
            mh_dict = mh.copy()
            mh_dict.pop('diploma', None)
                mh_dict.pop('raw_lodge_name', None)
            db.add(members_models.MasonicEvent(**mh_dict, member_id=db_member.id))
            
    if decorations_data is not None:
        db.query(members_models.Decoration).filter(members_models.Decoration.member_id == db_member.id).delete()
        for dec in decorations_data:
            db.add(members_models.Decoration(**dec, member_id=db_member.id))

    db.commit()
    db.refresh(db_member)
    logger.info("Membro atualizado via Loja", extra={"extra_data": {"member_id": member_id, "lodge_id": lodge_id}})
    return db_member


def delete_member_association(db: Session, member_id: int, lodge_id: int) -> models.MemberLodgeAssociation | None:
    """Desvincula um membro de uma loja específica, sem excluir o membro em si."""
    association = (
        db.query(models.MemberLodgeAssociation)
        .filter(
            models.MemberLodgeAssociation.member_id == member_id, models.MemberLodgeAssociation.lodge_id == lodge_id
        )
        .first()
    )

    if not association:
        return None

    db.delete(association)
    db.commit()
    logger.info("Associação de membro removida", extra={"extra_data": {"member_id": member_id, "lodge_id": lodge_id}})
    return association


def add_role_to_member(
    db: Session, member_id: int, lodge_id: int, role_data: member_schema.RoleHistoryCreate
) -> models.RoleHistory:
    """Registra uma nova atribuição de cargo ao histórico do membro na loja."""
    role_history = models.RoleHistory(
        member_id=member_id,
        lodge_id=lodge_id,
        role_id=role_data.role_id,
        start_date=role_data.start_date,
        end_date=role_data.end_date,
    )
    db.add(role_history)
    db.commit()
    db.refresh(role_history)
    logger.info("Cargo adicionado ao histórico do membro", extra={"extra_data": {"member_id": member_id, "role_id": role_data.role_id}})
    return role_history


def delete_role_history(db: Session, member_id: int, role_history_id: int, lodge_id: int) -> bool:
    """Apaga um registro de histórico de cargo do membro."""
    role_history = (
        db.query(models.RoleHistory)
        .filter(
            models.RoleHistory.id == role_history_id,
            models.RoleHistory.member_id == member_id,
            models.RoleHistory.lodge_id == lodge_id,
        )
        .first()
    )

    if not role_history:
        return False

    db.delete(role_history)
    db.commit()
    logger.info("Cargo removido do histórico do membro", extra={"extra_data": {"member_id": member_id, "role_history_id": role_history_id}})
    return True
