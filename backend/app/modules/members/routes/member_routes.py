from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

import database
import dependencies
from app.modules.members.schemas import member_schema
from app.modules.members.services import member_service
from app.shared.security.abac import verify_resource_ownership
from models.models import Lodge, Member, MemberLodgeAssociation, RoleHistory
from app.modules.audit.services.audit_service import log_action
from app.core.logger import logger

router = APIRouter(
    prefix="/members",
    tags=["Lodge Members"],
)


@router.get(
    "/check-cim/{cim}",
    response_model=member_schema.MemberResponse,
    summary="Verificar Existência de CIM",
    description="Procura um maçom pelo seu Cadastro Individual Maçônico (CIM). Útil para validações de registro.",
)
def check_cim(
    cim: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Check if a member with the given CIM exists in the same Obedience as the user."""
    context = dependencies.UserContext(current_user)
    
    # Restringir busca à obediência do usuário atual (Webmaster ou Membro logado)
    obedience_id = None
    if context.user_type == "webmaster":
        obedience_id = context.get_obedience_id(db)
    elif context.user_type == "member":
        obedience_id = context.get_obedience_id(db) # Se logado numa loja específica

    # Se não conseguirmos determinar a obediência, buscamos globalmente (apenas para super admins)
    if obedience_id:
        member = (
            db.query(models.Member)
            .join(models.MemberObedienceAssociation, models.Member.id == models.MemberObedienceAssociation.member_id)
            .filter(models.Member.cim == cim, models.MemberObedienceAssociation.obedience_id == obedience_id)
            .first()
        )
    else:
        member = member_service.get_member_by_cim(db, cim)

    if not member:
        logger.warning(f"CIM {cim} não encontrado na base ou fora do escopo da obediência {obedience_id}")
        raise HTTPException(status_code=404, detail="Membro não encontrado.")
    return member


@router.post(
    "/{member_id}/associate",
    response_model=member_schema.MemberResponse,
    summary="Associar Membro à Loja",
    description="Vincula um membro existente a uma loja com um status e classe específicos.",
)
def associate_member(
    member_id: int,
    association_data: member_schema.MemberAssociateLodge,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Associate an existing member with a lodge."""
    user_type = current_user.get("user_type")

    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
            logger.warning("Acesso negado: Webmaster sem loja associada", extra={"extra_data": {"user_id": current_user.get("user_id")}})
            raise HTTPException(status_code=403, detail="Webmaster não associado a uma loja.")
        if association_data.lodge_id != lodge_id:
            logger.warning("Acesso negado: Tentativa de associar a outra loja", extra={"extra_data": {"target_lodge": association_data.lodge_id}})
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Você só pode associar membros à sua própria loja."
            )
    elif user_type != "super_admin":
        raise HTTPException(status_code=403, detail="Não autorizado.")

    try:
        result = member_service.associate_member_to_lodge(db=db, member_id=member_id, association_data=association_data)
        log_action(
            db=db,
            user_id=current_user.get("user_id"),
            user_type=user_type,
            action="ASSOCIATE_MEMBER_TO_LODGE",
            resource_type="MEMBER",
            resource_id=member_id,
            details={"lodge_id": association_data.lodge_id},
            ip_address=request.client.host if request.client else None
        )
        return result
    except ValueError as e:
        logger.warning("Erro de validação ao associar membro", extra={"extra_data": {"error": str(e)}})
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Erro inesperado ao associar membro", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/",
    response_model=member_schema.MemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Novo Membro",
    description="Cadastra um novo membro no sistema e o associa automaticamente a uma loja (para Webmasters).",
)
def create_member(
    member: member_schema.MemberCreateWithAssociation,
    request: Request,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.require_permission("members:create")),
):
    """Create a new member. Webmasters can only create for their lodge."""
    if context.user_type == "webmaster":
        if not context.lodge_id:
            logger.warning("Acesso negado: Webmaster sem loja associada")
            raise HTTPException(status_code=403, detail="Webmaster não associado a uma loja.")
        if member.lodge_id != context.lodge_id:
            logger.warning("Acesso negado: Tentativa de criar membro para outra loja")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Você só pode criar membros para sua própria loja."
            )
    elif context.user_type != "super_admin":
        raise HTTPException(status_code=403, detail="Não autorizado.")

    try:
        new_member = member_service.create_member_for_lodge(db=db, member_data=member)
        log_action(
            db=db,
            user_id=context.user.id,
            user_type=context.user_type,
            action="CREATE_MEMBER",
            resource_type="MEMBER",
            resource_id=new_member.id,
            details={"email": new_member.email, "lodge_id": member.lodge_id},
            ip_address=request.client.host if request.client else None
        )
        return new_member
    except ValueError as e:
        logger.warning("Erro de validação ao criar membro", extra={"extra_data": {"error": str(e)}})
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except IntegrityError as e:
        error_msg = str(e.orig)
        logger.warning("Conflito de integridade ao criar membro", extra={"extra_data": {"error": error_msg}})
        if "ix_members_email" in error_msg or "UNIQUE constraint failed: members.email" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado.")
        if "ix_members_cpf" in error_msg or "UNIQUE constraint failed: members.cpf" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CPF já cadastrado.")
        if "ix_members_cim" in error_msg or "UNIQUE constraint failed: members.cim" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CIM já cadastrado.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.get(
    "/",
    response_model=list[member_schema.MemberListResponse],
    summary="Listar Membros",
    description="Retorna uma lista paginada e simplificada de membros. Webmasters veem apenas os de sua loja.",
)
def read_members(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Retrieve members. SuperAdmins see all, Webmasters and Members see their lodge's."""
    user_type = current_user.get("user_type")

    if user_type == "super_admin":
        members = (
            db.query(Member)
            .options(joinedload(Member.role_history).joinedload(RoleHistory.role))
            .offset(skip)
            .limit(limit)
            .all()
        )
    elif user_type == "webmaster":
        obedience_id = current_user.get("obedience_id") or current_user.get("potencia_id")
        lodge_id = current_user.get("lodge_id")
        
        if obedience_id:
            members = (
                db.query(Member)
                .join(models.MemberObedienceAssociation, Member.id == models.MemberObedienceAssociation.member_id)
                .filter(models.MemberObedienceAssociation.obedience_id == obedience_id)
                .options(joinedload(Member.role_history).joinedload(RoleHistory.role))
                .offset(skip)
                .limit(limit)
                .all()
            )
        elif lodge_id:
            members = member_service.get_members_by_lodge(db, lodge_id=lodge_id, skip=skip, limit=limit)
        else:
            members = (
                db.query(Member)
                .options(joinedload(Member.role_history).joinedload(RoleHistory.role))
                .offset(skip)
                .limit(limit)
                .all()
            )
    elif user_type == "member":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
            raise HTTPException(status_code=403, detail="Usuário não associado a um contexto de loja.")

        members = member_service.get_members_by_lodge(db, lodge_id=lodge_id, skip=skip, limit=limit)
    else:
        raise HTTPException(status_code=403, detail="Não autorizado.")

    # Convert to list response with computed active_role
    result = []
    for member in members:
        member_dict = {
            "id": member.id,
            "full_name": member.full_name,
            "email": member.email,
            "cim": member.cim,
            "degree": member.degree,
            "status": member.status,
            "registration_status": member.registration_status,
            "profile_picture_path": member.profile_picture_path,
            "phone": member.phone,
            "birth_date": member.birth_date,
            "active_role": None,
        }

        # Find active role (where end_date is None)
        if member.role_history:
            active_role_entry = next((rh for rh in member.role_history if rh.end_date is None), None)
            if active_role_entry and active_role_entry.role:
                member_dict["active_role"] = active_role_entry.role.name

        result.append(member_dict)

    return result


@router.get(
    "/{member_id}",
    response_model=member_schema.MemberResponse,
    summary="Obter Detalhes do Membro",
    description="Retorna o cadastro completo de um membro específico. Membros podem acessar os próprios dados.",
)
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
        obedience_id = current_user.get("obedience_id") or current_user.get("potencia_id")
        lodge_id = current_user.get("lodge_id")
        
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")
            
        if obedience_id:
            # For obedience level, just verify the member belongs to the obedience
            assoc = db.query(models.MemberObedienceAssociation).filter(
                models.MemberObedienceAssociation.member_id == member_id,
                models.MemberObedienceAssociation.obedience_id == obedience_id
            ).first()
            if not assoc:
                raise HTTPException(status_code=404, detail="Member not found in this obedience")
        elif lodge_id:
            db_member_lodge = member_service.get_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id)
            if db_member_lodge is None:
                raise HTTPException(status_code=404, detail="Member not found in this lodge")
        else:
            # If a generic global webmaster, allow viewing any member (or enforce something else)
            pass
            
        return db_member
    elif user_type == "member":
        # ABAC Ownership verification
        verify_resource_ownership(current_user, member_id)

        db_member = db.query(Member).filter(Member.id == member_id).first()
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found")
        return db_member
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.put(
    "/{member_id}",
    response_model=member_schema.MemberResponse,
    summary="Atualizar Dados do Membro",
    description="Altera as informações cadastrais de um membro (perfil pessoal, maçônico, endereço).",
)
def update_member(
    member_id: int,
    member: member_schema.MemberUpdate,
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Update a member."""
    user_type = current_user.get("user_type")

    if user_type == "super_admin":
        # For SuperAdmin, we need a generic update service or reuse existing logic if appropriate
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")

        from app.modules.access_control.utils.password_utils import hash_password

        update_data = member.model_dump(exclude_unset=True)
        if "password" in update_data:
            db_member.password_hash = hash_password(update_data.pop("password"))

        family_members_data = update_data.pop('family_members', None)
        masonic_history_data = update_data.pop('masonic_history', None)
        decorations_data = update_data.pop('decorations', None)

        for key, value in update_data.items():
            setattr(db_member, key, value)
            
        import app.modules.members.models as members_models
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
        log_action(
            db=db,
            user_id=current_user.get("user_id"),
            user_type=user_type,
            action="UPDATE_MEMBER",
            resource_type="MEMBER",
            resource_id=member_id,
            details={"updated_by": "super_admin"},
            ip_address=request.client.host if request.client else None
        )
        return db_member

    elif user_type == "webmaster":
        obedience_id = current_user.get("obedience_id") or current_user.get("potencia_id")
        lodge_id = current_user.get("lodge_id")
        
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")

        if obedience_id:
            assoc = db.query(models.MemberObedienceAssociation).filter(
                models.MemberObedienceAssociation.member_id == member_id,
                models.MemberObedienceAssociation.obedience_id == obedience_id
            ).first()
            if not assoc:
                raise HTTPException(status_code=404, detail="Member not found in this obedience")
        elif lodge_id:
            db_member_lodge = member_service.get_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id)
            if db_member_lodge is None:
                raise HTTPException(status_code=404, detail="Member not found in this lodge")
                
        # Apply updates
        from app.modules.access_control.utils.password_utils import hash_password

        update_data = member.model_dump(exclude_unset=True)
        if "password" in update_data:
            db_member.password_hash = hash_password(update_data.pop("password"))

        family_members_data = update_data.pop('family_members', None)
        masonic_history_data = update_data.pop('masonic_history', None)
        decorations_data = update_data.pop('decorations', None)

        for key, value in update_data.items():
            setattr(db_member, key, value)
            
        import app.modules.members.models as members_models
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
            
        log_action(
            db=db,
            user_id=current_user.get("user_id"),
            user_type=user_type,
            action="UPDATE_MEMBER",
            resource_type="MEMBER",
            resource_id=member_id,
            details={"updated_by": "webmaster"},
            ip_address=request.client.host if request.client else None
        )
        return db_member
    elif user_type == "member":
        # ABAC Ownership verification
        verify_resource_ownership(current_user, member_id)

        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")

        from app.modules.access_control.utils.password_utils import hash_password

        update_data = member.model_dump(exclude_unset=True)
        
        # Security Fix: Filter out fields that are not in MemberSelfUpdate
        from app.modules.members.schemas.member_schema import MemberSelfUpdate

        self_update_data = MemberSelfUpdate(**member.model_dump(exclude_unset=True))
        
        for key, value in self_update_data.model_dump(exclude_unset=True).items():
            if key == "password":
                db_member.password_hash = hash_password(value)
                continue
            setattr(db_member, key, value)
            
        db.commit()
        db.refresh(db_member)
        
        log_action(
            db=db,
            user_id=current_user.get("user_id"),
            user_type=user_type,
            action="SELF_UPDATE_MEMBER",
            resource_type="MEMBER",
            resource_id=member_id,
            details={"updated_fields": list(self_update_data.model_dump(exclude_unset=True).keys())},
            ip_address=request.client.host if request.client else None
        )
        
        return db_member

    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.delete(
    "/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir ou Desassociar Membro",
    description="Desvincula um membro da Loja (se for Webmaster) ou exclui fisicamente (se for SuperAdmin).",
)
def delete_member_association(
    member_id: int,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.require_permission("members:delete")),
):
    """Disassociate a member (Webmaster) or Delete member (SuperAdmin)."""
    if context.user_type == "super_admin":
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")
        db.delete(db_member)
        db.commit()
        return

    elif context.user_type == "webmaster":
        if not context.lodge_id:
            raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        deleted_association = member_service.delete_member_association(db, member_id=member_id, lodge_id=context.lodge_id)
        if deleted_association is None:
            raise HTTPException(status_code=404, detail="Member association not found in this lodge")
        return
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.post(
    "/{member_id}/roles",
    response_model=member_schema.RoleHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar Cargo ao Histórico",
    description="Registra a posse de um membro em um cargo (ex: Venerável Mestre, Orador) com suas datas.",
)
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


@router.delete(
    "/{member_id}/roles/{role_history_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover Histórico de Cargo",
    description="Apaga um registro de histórico de cargo previamente associado a um membro.",
)
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


import os

from fastapi import File, UploadFile


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
                        "path": "/storage/lodges/loja_2181/profile_pictures/272875.jpg",
                    }
                }
            },
        },
        400: {
            "description": "Membro não possui CIM cadastrado",
            "content": {
                "application/json": {"example": {"detail": "Member must have a CIM to upload profile picture"}}
            },
        },
        403: {
            "description": "Usuário não autorizado para esta operação",
            "content": {"application/json": {"example": {"detail": "Webmaster not associated with a lodge"}}},
        },
        404: {
            "description": "Membro não encontrado",
            "content": {"application/json": {"example": {"detail": "Member not found in this lodge"}}},
        },
    },
    tags=["Lodge Members"],
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
        db.query(Lodge).filter(Lodge.id == lodge_id).first()

    elif user_type == "super_admin":
        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")

        # Get lodge code from member's association
        association = db.query(MemberLodgeAssociation).filter(MemberLodgeAssociation.member_id == member_id).first()
        if association:
            db.query(Lodge).filter(Lodge.id == association.lodge_id).first()
        else:
            pass
    elif user_type == "member":
        # ABAC Ownership verification
        verify_resource_ownership(current_user, member_id)

        db_member = db.query(Member).filter(Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")

        # Get lodge code (similar to super_admin logic)
        association = db.query(MemberLodgeAssociation).filter(MemberLodgeAssociation.member_id == member_id).first()
        if association:
            db.query(Lodge).filter(Lodge.id == association.lodge_id).first()
        else:
            pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Validate that member has a CIM
    if not db_member.cim:
        raise HTTPException(status_code=400, detail="Member must have a CIM to upload profile picture")

    # Validate image file
    from app.shared.utils.image_validator import validate_image

    try:
        file_contents = await validate_image(file)
    except HTTPException as e:
        # Re-raise validation errors
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao validar imagem: {str(e)}")

    # Define file location using new structure
    # Structure: storage/lodges/loja_{lodge_number}/profile_pictures/{cim}.ext
    from pathlib import Path

    BACKEND_DIR = Path(__file__).parent.parent
    # PROJECT_ROOT = BACKEND_DIR.parent  # Go up to sigma/ directory
    STORAGE_DIR = BACKEND_DIR / "storage" / "lodges"

    # Get lodge to access lodge_number
    if user_type == "webmaster":
        lodge_for_upload = db.query(Lodge).filter(Lodge.id == lodge_id).first()
    else:
        # For super_admin, get lodge from member's association
        association = db.query(MemberLodgeAssociation).filter(MemberLodgeAssociation.member_id == member_id).first()
        if association:
            lodge_for_upload = db.query(Lodge).filter(Lodge.id == association.lodge_id).first()
        else:
            lodge_for_upload = None

    if not lodge_for_upload:
        raise HTTPException(status_code=400, detail="Cannot determine lodge for member")

    # Use lodge_number for directory name (e.g., loja_2181)
    lodge_number = lodge_for_upload.lodge_number if lodge_for_upload.lodge_number else str(lodge_for_upload.id)
    directory = STORAGE_DIR / f"loja_{lodge_number}" / "users" / "profile_pictures"
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
    # Store path relative to storage mount: /storage/lodges/loja_{lodge_number}/users/profile_pictures/{cim}.ext
    relative_path = f"/storage/lodges/loja_{lodge_number}/users/profile_pictures/{new_filename}"

    # Update using service or direct DB update (since we already have the object)
    db_member.profile_picture_path = relative_path
    db.commit()
    db.refresh(db_member)

    return {"filename": new_filename, "path": relative_path}


from pydantic import BaseModel


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post(
    "/{member_id}/change-password",
    status_code=status.HTTP_200_OK,
    summary="Alterar Senha do Membro",
    description="Permite que o membro atualize sua própria senha mediante fornecimento da senha atual.",
)
def change_member_password(
    member_id: int,
    password_data: ChangePasswordRequest,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Change password for a member. Members can only change their own password."""
    user_type = current_user.get("user_type")

    # ABAC Ownership verification
    if user_type not in ["super_admin", "webmaster"]:
        verify_resource_ownership(current_user, member_id)

    # Get the member
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Validate current password
    from app.modules.access_control.utils.password_utils import hash_password, verify_password

    if not verify_password(password_data.current_password, db_member.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Update password
    db_member.password_hash = hash_password(password_data.new_password)
    db.commit()

    db.commit()

    return {"message": "Password changed successfully"}

from typing import List
from app.modules.members.schemas.import_schemas import ImportPreviewResponse, ImportConfirmRequest
from app.modules.members.services.import_service import process_upload_files

@router.post(
    "/import/preview",
    response_model=ImportPreviewResponse,
    summary="Pré-visualizar Importação",
    description="Recebe arquivos PDF ou Excel e retorna as linhas extraídas e validadas.",
)
async def preview_import(
    files: List[UploadFile] = File(...),
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.get_current_active_user_with_permissions),
):
    user_type = context.user_type
    allowed_roles = ["Secretário", "Secretário Adjunto", "Chanceler", "Chanceler Adjunto", "Venerável Mestre"]
    
    if user_type not in ["super_admin", "webmaster"]:
        if user_type == "member":
            # Check active roles from DB
            from datetime import date
            active_roles = [
                rh.role.name for rh in context.user.role_history 
                if (rh.end_date is None or rh.end_date >= date.today()) and rh.role
            ]
            if not any(role in allowed_roles for role in active_roles):
                raise HTTPException(status_code=403, detail="Não autorizado")
        else:
            raise HTTPException(status_code=403, detail="Não autorizado")
        
    return await process_upload_files(db, files)

@router.post(
    "/import/confirm",
    status_code=status.HTTP_200_OK,
    summary="Confirmar Importação",
    description="Salva os membros validados no banco de dados com status pré-cadastrado.",
)
def confirm_import(
    request_data: ImportConfirmRequest,
    request: Request,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.get_current_active_user_with_permissions),
):
    user_type = context.user_type
    allowed_roles = ["Secretário", "Secretário Adjunto", "Chanceler", "Chanceler Adjunto", "Venerável Mestre"]

    if user_type not in ["super_admin", "webmaster"]:
        if user_type == "member":
            from datetime import date
            active_roles = [
                rh.role.name for rh in context.user.role_history
                if (rh.end_date is None or rh.end_date >= date.today()) and rh.role
            ]
            if not any(role in allowed_roles for role in active_roles):
                raise HTTPException(status_code=403, detail="Não autorizado")
        else:
            raise HTTPException(status_code=403, detail="Não autorizado")

    lodge_id = context.lodge_id

    saved_count = 0
    from app.modules.members.models import RegistrationStatusEnum, MasonicEvent, MemberLodgeAssociation, Member, FamilyMember, Decoration
    from app.modules.access_control.utils.password_utils import hash_password
    import secrets

    for row in request_data.rows:
        if row.is_valid:
            existing = None
            if row.cim:
                existing = member_service.get_member_by_cim(db, row.cim)
            if not existing and row.email:
                existing = db.query(Member).filter(Member.email == row.email).first()

            if existing:
                # Update existing member
                if row.name: existing.full_name = row.name
                if row.email: existing.email = row.email
                if row.degree: existing.degree = row.degree
                if row.cpf: existing.cpf = row.cpf
                if row.marital_status: existing.marital_status = row.marital_status
                if row.father_name: existing.father_name = row.father_name
                if row.mother_name: existing.mother_name = row.mother_name
                if row.blood_type: existing.blood_type = row.blood_type
                if getattr(row, "birth_date", None): existing.birth_date = row.birth_date
                if getattr(row, "place_of_birth", None): existing.place_of_birth = row.place_of_birth
                if getattr(row, "education_level", None): existing.education_level = row.education_level
                if getattr(row, "occupation", None): existing.occupation = row.occupation
                if getattr(row, "phone", None): existing.phone = row.phone
                if getattr(row, "zip_code", None): existing.zip_code = row.zip_code
                if getattr(row, "street_address", None): existing.street_address = row.street_address
                if getattr(row, "neighborhood", None): existing.neighborhood = row.neighborhood
                if getattr(row, "city", None): existing.city = row.city
                
                db.flush()
                # Recreate masonic history
                if row.masonic_history:
                    db.query(MasonicEvent).filter(MasonicEvent.member_id == existing.id).delete()
                    for ev in row.masonic_history:
                        db_ev = MasonicEvent(
                            member_id=existing.id,
                            event_type=ev.get("event_type"),
                            session_date=ev.get("session_date"),
                            entry_date=ev.get("entry_date"),
                            process_number=ev.get("process_number"),
                            registry_number=ev.get("registry_number"),
                            placet_number=ev.get("placet_number"),
                            quit_placet_number=ev.get("quit_placet_number"),
                            # Missing lodge_id mapping, but we don't strictly need it right now for raw import
                        )
                        db.add(db_ev)

                # Ensure the member is associated with the lodge
                if lodge_id:
                    assoc = db.query(MemberLodgeAssociation).filter(
                        MemberLodgeAssociation.member_id == existing.id,
                        MemberLodgeAssociation.lodge_id == lodge_id
                    ).first()
                    if not assoc:
                        new_assoc = MemberLodgeAssociation(
                            member_id=existing.id,
                            lodge_id=lodge_id,
                        )
                        db.add(new_assoc)
                        
                m_id = existing.id
                
                # Save Family Members
                if hasattr(row, 'family_members') and row.family_members:
                    db.query(FamilyMember).filter(FamilyMember.member_id == m_id).delete()
                    for fm in row.family_members:
                        db_fm = FamilyMember(
                            member_id=m_id,
                            relationship_type=fm.get("relationship_type"),
                            full_name=fm.get("full_name"),
                            birth_date=fm.get("birth_date"),
                            phone=fm.get("phone")
                        )
                        db.add(db_fm)

                # Save Decorations
                if hasattr(row, 'decorations') and row.decorations:
                    db.query(Decoration).filter(Decoration.member_id == m_id).delete()
                    for dec in row.decorations:
                        db_dec = Decoration(
                            member_id=m_id,
                            title=dec.get("title"),
                            award_date=dec.get("award_date"),
                            remarks=dec.get("remarks")
                        )
                        db.add(db_dec)
                        
                db.commit()
                saved_count += 1
            else:
                # Create new member
                new_member = Member(
                    tenant_id=context.tenant_id,
                    cim=row.cim,
                    full_name=row.name,
                    email=row.email,
                    cpf=row.cpf,
                    degree=row.degree,
                    marital_status=row.marital_status,
                    father_name=row.father_name,
                    mother_name=row.mother_name,
                    blood_type=row.blood_type,
                    birth_date=getattr(row, "birth_date", None),
                    place_of_birth=getattr(row, "place_of_birth", None),
                    education_level=getattr(row, "education_level", None),
                    occupation=getattr(row, "occupation", None),
                    phone=getattr(row, "phone", None),
                    zip_code=getattr(row, "zip_code", None),
                    street_address=getattr(row, "street_address", None),
                    neighborhood=getattr(row, "neighborhood", None),
                    city=getattr(row, "city", None),
                    password_hash=hash_password(secrets.token_urlsafe(16)),
                    registration_status=RegistrationStatusEnum.PENDING
                )
                db.add(new_member)
                db.flush()
                
                if row.masonic_history:
                    for ev in row.masonic_history:
                        db_ev = MasonicEvent(
                            member_id=new_member.id,
                            event_type=ev.get("event_type"),
                            session_date=ev.get("session_date"),
                            entry_date=ev.get("entry_date"),
                            process_number=ev.get("process_number"),
                            registry_number=ev.get("registry_number"),
                            placet_number=ev.get("placet_number"),
                            quit_placet_number=ev.get("quit_placet_number"),
                        )
                        db.add(db_ev)

                if lodge_id:
                    new_assoc = MemberLodgeAssociation(
                        member_id=new_member.id,
                        lodge_id=lodge_id,
                    )
                    db.add(new_assoc)

                m_id = new_member.id
                
                # Save Family Members
                if hasattr(row, 'family_members') and row.family_members:
                    for fm in row.family_members:
                        db_fm = FamilyMember(
                            member_id=m_id,
                            relationship_type=fm.get("relationship_type"),
                            full_name=fm.get("full_name"),
                            birth_date=fm.get("birth_date"),
                            phone=fm.get("phone")
                        )
                        db.add(db_fm)

                # Save Decorations
                if hasattr(row, 'decorations') and row.decorations:
                    for dec in row.decorations:
                        db_dec = Decoration(
                            member_id=m_id,
                            title=dec.get("title"),
                            award_date=dec.get("award_date"),
                            remarks=dec.get("remarks")
                        )
                        db.add(db_dec)

                db.commit()
                db.refresh(new_member)
                saved_count += 1

    return {"message": f"{saved_count} membros importados/atualizados com sucesso."}
@router.post(
    "/{member_id}/lodge-associations",
    response_model=member_schema.MemberLodgeAssociationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adicionar Associação de Loja",
)
def add_lodge_association(
    member_id: int,
    assoc_data: member_schema.MemberLodgeAssociationCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    if current_user.get("user_type") not in ["super_admin", "webmaster"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    # Check if lodge exists
    from app.modules.core.models import Lodge
    lodge = db.query(Lodge).filter(Lodge.id == assoc_data.lodge_id).first()
    if not lodge:
        raise HTTPException(status_code=404, detail="Lodge not found")
        
    # Check if association already exists
    existing = db.query(MemberLodgeAssociation).filter(
        MemberLodgeAssociation.member_id == member_id,
        MemberLodgeAssociation.lodge_id == assoc_data.lodge_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Member is already associated with this lodge")
        
    new_assoc = MemberLodgeAssociation(
        member_id=member_id,
        lodge_id=assoc_data.lodge_id,
        start_date=assoc_data.start_date,
        end_date=assoc_data.end_date,
        status=assoc_data.status,
        member_class=assoc_data.member_class
    )
    
    db.add(new_assoc)
    db.commit()
    db.refresh(new_assoc)
    return new_assoc


@router.put(
    "/{member_id}/lodge-associations/{lodge_id}",
    response_model=member_schema.MemberLodgeAssociationResponse,
    summary="Atualizar Associação de Loja",
)
def update_lodge_association(
    member_id: int,
    lodge_id: int,
    assoc_data: member_schema.MemberLodgeAssociationUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    if current_user.get("user_type") not in ["super_admin", "webmaster"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assoc = db.query(MemberLodgeAssociation).filter(
        MemberLodgeAssociation.member_id == member_id,
        MemberLodgeAssociation.lodge_id == lodge_id
    ).first()
    
    if not assoc:
        raise HTTPException(status_code=404, detail="Association not found")
        
    update_data = assoc_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(assoc, key, value)
        
    db.commit()
    db.refresh(assoc)
    return assoc


@router.delete(
    "/{member_id}/lodge-associations/{lodge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover Associação de Loja",
)
def remove_lodge_association(
    member_id: int,
    lodge_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    if current_user.get("user_type") not in ["super_admin", "webmaster"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    assoc = db.query(MemberLodgeAssociation).filter(
        MemberLodgeAssociation.member_id == member_id,
        MemberLodgeAssociation.lodge_id == lodge_id
    ).first()
    
    if not assoc:
        raise HTTPException(status_code=404, detail="Association not found")
        
    db.delete(assoc)
    db.commit()
    return
