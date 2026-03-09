import uuid
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# Importações do projeto
from models import models
from models.models import DocumentStatusEnum
from schemas import document_schema
from utils.path_utils import get_tenant_path

# --- Document Instance Services (Novo Fluxo) ---


def create_or_update_document_instance(
    db: Session,
    lodge_id: int,
    session_id: int | None,
    document_type: str,
    draft_html_content: str,
    current_user_payload: dict,
) -> models.DocumentInstance:
    """
    Cria ou atualiza um Rascunho de Documento (DocumentInstance).
    Não gera PDF físico, apenas salva o HTML no banco.
    """
    user_id = current_user_payload.get("sub")

    # Check if instance already exists for this session/type
    query = db.query(models.DocumentInstance).filter(
        models.DocumentInstance.lodge_id == lodge_id, models.DocumentInstance.document_type == document_type
    )
    if session_id:
        query = query.filter(models.DocumentInstance.session_id == session_id)

    instance = query.first()

    if instance:
        # Se já finalizado, não pode alterar o rascunho
        if instance.status == DocumentStatusEnum.FINALIZED:
            raise HTTPException(status_code=400, detail="Este documento já está finalizado e não pode ser alterado.")

        instance.draft_html_content = draft_html_content
        db.commit()
        db.refresh(instance)
        return instance
    else:
        new_instance = models.DocumentInstance(
            lodge_id=lodge_id,
            session_id=session_id,
            document_type=document_type,
            status=DocumentStatusEnum.DRAFT,
            draft_html_content=draft_html_content,
            created_by_id=user_id,
        )
        db.add(new_instance)
        db.commit()
        db.refresh(new_instance)
        return new_instance


def get_document_instance(db: Session, instance_id: int, current_user_payload: dict) -> models.DocumentInstance:
    lodge_id = current_user_payload.get("lodge_id")
    instance = db.query(models.DocumentInstance).filter(models.DocumentInstance.id == instance_id).first()

    if not instance or instance.lodge_id != lodge_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instância de Documento não encontrada.")

    return instance


def finalize_document_instance(
    db: Session, instance_id: int, final_html_content: str, current_user_payload: dict
) -> models.DocumentInstance:
    """
    Trava o documento no status FINALIZED e salva o HTML resolvido (pós-edição final).
    """
    instance = get_document_instance(db, instance_id, current_user_payload)

    if instance.status == DocumentStatusEnum.FINALIZED:
        raise HTTPException(status_code=400, detail="Documento já finalizado.")

    # TODO: In future phase, require signatures before FINALIZED.
    instance.final_html_content = final_html_content
    instance.status = DocumentStatusEnum.FINALIZED
    db.commit()
    db.refresh(instance)
    return instance


def get_all_document_instances_by_lodge(db: Session, lodge_id: int) -> list[models.DocumentInstance]:
    return (
        db.query(models.DocumentInstance)
        .filter(models.DocumentInstance.lodge_id == lodge_id)
        .order_by(models.DocumentInstance.created_at.desc())
        .all()
    )


# --- MÉTODOS ANTIGOS/LEGADOS (MANTIDOS PARA COMPATIBILIDADE DE UPLOADS EXTERNOS) ---


async def create_document(
    db: Session,
    title: str,
    current_user_payload: dict,
    file=None,
    file_content_bytes: bytes | None = None,
    filename: str | None = None,
    content_type: str | None = None,
    session_id: int | None = None,
) -> models.Document:
    lodge_id = current_user_payload.get("lodge_id")
    user_id = current_user_payload.get("sub")

    if not lodge_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário sem loja.")

    lodge = db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
    tenant_path = get_tenant_path(id_obediencia=lodge.obedience_id, id_loja=lodge_id, resource_type="documents")

    file_to_save_name: str
    file_to_save_content: bytes
    file_to_save_type: str

    if file:
        file_to_save_name = file.filename
        file_to_save_content = await file.read()
        file_to_save_type = file.content_type
        await file.close()
    elif file_content_bytes and filename and content_type:
        file_to_save_name = filename
        file_to_save_content = file_content_bytes
        file_to_save_type = content_type
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Arquivo obrigatório.")

    file_extension = Path(file_to_save_name).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_location = tenant_path / unique_filename

    try:
        with open(file_location, "wb") as buffer:
            buffer.write(file_to_save_content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    db_document_data = document_schema.DocumentCreate(
        title=title,
        file_path=str(file_location),
        file_name=file_to_save_name,
        file_type=file_to_save_type,
        uploaded_by_member_id=user_id,
        session_id=session_id,
    )

    db_document = models.Document(**db_document_data.model_dump(), lodge_id=lodge_id)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


def get_document_by_id(db: Session, document_id: int, current_user_payload: dict) -> models.Document:
    lodge_id = current_user_payload.get("lodge_id")
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document or document.lodge_id != lodge_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado.")
    return document


def delete_document(db: Session, document_id: int, current_user_payload: dict) -> models.Document:
    document_to_delete = get_document_by_id(db, document_id, current_user_payload)
    try:
        file_path = Path(document_to_delete.file_path)
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Aviso: O arquivo físico não pôde ser removido: {e}")

    db.delete(document_to_delete)
    db.commit()
    return document_to_delete
