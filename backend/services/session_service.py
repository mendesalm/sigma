from datetime import date

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from ..config import settings
from ..models import models
from ..schemas import masonic_session_schema
from .document_generation_service import DocumentGenerationService


def _create_attendance_records_task(db_url: str, session_id: int, lodge_id: int):
    """
    Background task to create session attendance records for active members.
    Creates its own database session to ensure thread safety.
    """
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        db_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        if not db_session:
            print(f"Background task: Session {session_id} not found.")
            return

        active_members = (
            db.query(models.MemberLodgeAssociation).filter(models.MemberLodgeAssociation.lodge_id == lodge_id).all()
        )

        existing_attendances = {att.member_id for att in db_session.attendances if att.member_id}
        members_to_add = [assoc.member_id for assoc in active_members if assoc.member_id not in existing_attendances]

        new_attendances = [
            models.SessionAttendance(
                session_id=session_id,
                member_id=member_id,
                attendance_status="Ausente",  # Status inicial
            )
            for member_id in members_to_add
        ]

        if new_attendances:
            db.add_all(new_attendances)
            db.commit()
            print(f"Background task: Created {len(new_attendances)} attendance records for session {session_id}.")
    finally:
        db.close()


# --- Funções de Serviço para Sessões Maçônicas ---


def create_session(
    db: Session, session_data: masonic_session_schema.MasonicSessionCreate, current_user_payload: dict
) -> models.MasonicSession:
    """
    Cria uma nova sessão maçônica associada à loja do usuário.
    Verifica se já existe uma sessão agendada para a mesma data na mesma loja.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Operação não permitida: Usuário não associado a uma loja."
        )

    # Verifica se já existe uma sessão para a mesma data na mesma loja
    existing_session = (
        db.query(models.MasonicSession)
        .filter(
            models.MasonicSession.lodge_id == lodge_id, models.MasonicSession.session_date == session_data.session_date
        )
        .first()
    )

    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe uma sessão agendada para esta data nesta loja."
        )

    db_session = models.MasonicSession(**session_data.model_dump(exclude_unset=True), lodge_id=lodge_id)

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return db_session


def get_session_by_id(db: Session, session_id: int, current_user_payload: dict) -> models.MasonicSession:
    """
    Busca uma sessão pelo ID, garantindo que pertença à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    session = (
        db.query(models.MasonicSession)
        .filter(models.MasonicSession.id == session_id, models.MasonicSession.lodge_id == lodge_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    return session


def get_sessions_by_lodge(
    db: Session,
    current_user_payload: dict,
    start_date: date | None = None,
    end_date: date | None = None,
    status: str | None = None,
) -> list[models.MasonicSession]:
    """
    Lista todas as sessões associadas à loja do usuário, com filtros opcionais.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []

    query = db.query(models.MasonicSession).filter(models.MasonicSession.lodge_id == lodge_id)

    if start_date:
        query = query.filter(models.MasonicSession.session_date >= start_date)
    if end_date:
        query = query.filter(models.MasonicSession.session_date <= end_date)
    if status:
        query = query.filter(models.MasonicSession.status == status)

    return query.all()


def update_session(
    db: Session,
    session_id: int,
    session_update: masonic_session_schema.MasonicSessionUpdate,
    current_user_payload: dict,
) -> models.MasonicSession:
    """
    Atualiza uma sessão existente, garantindo que pertença à loja do usuário.
    Verifica conflitos de data se a data da sessão for alterada.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)  # Valida propriedade

    # Se a data da sessão for atualizada, verifica por conflitos
    if session_update.session_date and session_update.session_date != db_session.session_date:
        existing_session_on_date = (
            db.query(models.MasonicSession)
            .filter(
                models.MasonicSession.lodge_id == db_session.lodge_id,
                models.MasonicSession.session_date == session_update.session_date,
                models.MasonicSession.id != session_id,  # Exclui a própria sessão
            )
            .first()
        )
        if existing_session_on_date:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe outra sessão agendada para esta nova data nesta loja.",
            )

    for key, value in session_update.model_dump(exclude_unset=True).items():
        setattr(db_session, key, value)

    db.commit()
    db.refresh(db_session)
    return db_session


def _start_session_internal(
    db: Session, db_session: models.MasonicSession, background_tasks: BackgroundTasks
) -> models.MasonicSession:
    """
    Lógica interna e centralizada para iniciar uma sessão.
    Muda o status e dispara a criação dos registros de presença em background.
    """
    if db_session.status != "AGENDADA":
        print(
            f"Tentativa de iniciar sessão {db_session.id} que não está 'AGENDADA'. Status atual: {db_session.status}."
        )
        return db_session

    db_session.status = "EM_ANDAMENTO"
    db.commit()
    db.refresh(db_session)

    # Dispara a criação de registros de presença em background
    background_tasks.add_task(
        _create_attendance_records_task, settings.DATABASE_URL, db_session.id, db_session.lodge_id
    )

    return db_session


def start_session(
    db: Session, session_id: int, current_user_payload: dict, background_tasks: BackgroundTasks
) -> models.MasonicSession:
    """
    Inicia uma sessão maçônica (chamado via API).
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)
    return _start_session_internal(db, db_session, background_tasks)


def start_scheduled_session(db: Session, session_id: int) -> models.MasonicSession | None:
    """
    Inicia uma sessão maçônica (chamado pelo agendador).
    Não levanta exceção HTTP, apenas retorna ou loga o erro.
    """
    db_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not db_session:
        print(f"Agendador: Sessão {session_id} não encontrada para iniciar.")
        return None

    # O agendador precisa de sua própria instância de BackgroundTasks
    background_tasks = BackgroundTasks()
    return _start_session_internal(db, db_session, background_tasks)


def end_session(
    db: Session, session_id: int, current_user_payload: dict, background_tasks: BackgroundTasks
) -> models.MasonicSession:
    """
    Finaliza uma sessão maçônica, mudando seu status para 'REALIZADA'.
    Dispara a geração do Balaústre/Ata em background.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)

    if db_session.status != "EM_ANDAMENTO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sessão não pode ser finalizada. Status atual: {db_session.status}.",
        )

    db_session.status = "REALIZADA"
    db.commit()
    db.refresh(db_session)

    # Dispara a geração do Balaústre em background
    doc_gen_service = DocumentGenerationService()
    background_tasks.add_task(doc_gen_service.generate_balaustre_pdf_task, session_id, current_user_payload)

    return db_session


def cancel_session(db: Session, session_id: int, current_user_payload: dict) -> models.MasonicSession:
    """
    Cancela uma sessão maçônica, mudando seu status para 'CANCELADA'.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)

    if db_session.status == "REALIZADA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Sessão já realizada não pode ser cancelada."
        )

    db_session.status = "CANCELADA"
    db.commit()
    db.refresh(db_session)
    return db_session


def delete_session(db: Session, session_id: int, current_user_payload: dict) -> None:
    """
    Deleta uma sessão maçônica.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)  # Valida propriedade
    db.delete(db_session)
    db.commit()
    return None


async def generate_session_document(
    db: Session, session_id: int, document_type: str, current_user_payload: dict, background_tasks: BackgroundTasks
) -> dict[str, str]:
    """
    Dispara a geração de um documento específico para uma sessão em background.
    """
    session = get_session_by_id(db, session_id, current_user_payload)  # Garante acesso à sessão

    doc_gen_service = DocumentGenerationService()

    if document_type.upper() == "BALAUSTRE":
        background_tasks.add_task(doc_gen_service.generate_balaustre_pdf_task, session_id, current_user_payload)
        return {"message": "Geração do Balaústre iniciada em background."}
    elif document_type.upper() == "EDITAL":
        background_tasks.add_task(doc_gen_service.generate_edital_pdf_task, session_id, current_user_payload)
        return {"message": "Geração do Edital iniciada em background."}
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de documento inválido.")
