from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

# Importações do projeto
from database import get_db
from dependencies import get_current_user_payload
from schemas import masonic_session_schema, session_attendance_schema
from services import session_service

router = APIRouter(
    prefix="/masonic-sessions", tags=["Sessões Maçônicas"], responses={404: {"description": "Não encontrado"}}
)


@router.post(
    "/",
    response_model=masonic_session_schema.MasonicSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Nova Sessão Maçônica",
    description="Agenda uma nova sessão maçônica para a loja do usuário autenticado.",
)
def create_new_masonic_session(
    session_data: masonic_session_schema.MasonicSessionCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return session_service.create_session(db=db, session_data=session_data, current_user_payload=current_user_payload)


@router.get(
    "/",
    response_model=list[masonic_session_schema.MasonicSessionResponse],
    summary="Listar Sessões Maçônicas da Loja",
    description="Retorna uma lista de todas as sessões maçônicas associadas à loja do usuário, com filtros opcionais.",
)
def list_masonic_sessions(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
    start_date: date | None = Query(None, description="Data de início para filtrar sessões."),
    end_date: date | None = Query(None, description="Data de fim para filtrar sessões."),
    session_status: str | None = Query(
        None, description="Filtrar sessões por status (AGENDADA, EM_ANDAMENTO, REALIZADA, CANCELADA)."
    ),
):
    return session_service.get_sessions_by_lodge(
        db=db,
        current_user_payload=current_user_payload,
        start_date=start_date,
        end_date=end_date,
        status=session_status,
    )


@router.get(
    "/{session_id}",
    response_model=masonic_session_schema.MasonicSessionResponse,
    summary="Obter Sessão Maçônica por ID",
    description="Retorna uma sessão maçônica específica pelo seu ID, garantindo que pertença à loja do usuário.",
)
def get_masonic_session(
    session_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    return session_service.get_session_by_id(db=db, session_id=session_id, current_user_payload=current_user_payload)


@router.put(
    "/{session_id}",
    response_model=masonic_session_schema.MasonicSessionResponse,
    summary="Atualizar Sessão Maçônica",
    description="Atualiza uma sessão maçônica existente, garantindo que pertença à loja do usuário.",
)
def update_masonic_session(
    session_id: int,
    session_update: masonic_session_schema.MasonicSessionUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return session_service.update_session(
        db=db, session_id=session_id, session_update=session_update, current_user_payload=current_user_payload
    )


@router.post(
    "/{session_id}/start",
    response_model=masonic_session_schema.MasonicSessionResponse,
    summary="Iniciar Sessão Maçônica",
    description="Muda o status de uma sessão de 'AGENDADA' para 'EM_ANDAMENTO', permitindo o registro de presenças.",
)
def start_masonic_session(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return session_service.start_session(
        db=db, session_id=session_id, current_user_payload=current_user_payload, background_tasks=background_tasks
    )


@router.post(
    "/{session_id}/end",
    response_model=masonic_session_schema.MasonicSessionResponse,
    summary="Finalizar Sessão Maçônica",
    description="Muda o status de uma sessão de 'EM_ANDAMENTO' para 'REALIZADA'. Dispara a geração automática do Balaústre.",
)
def end_masonic_session(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return session_service.end_session(
        db=db, session_id=session_id, current_user_payload=current_user_payload, background_tasks=background_tasks
    )


@router.post(
    "/{session_id}/cancel",
    response_model=masonic_session_schema.MasonicSessionResponse,
    summary="Cancelar Sessão Maçônica",
    description="Muda o status de uma sessão para 'CANCELADA'.",
)
def cancel_masonic_session(
    session_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    return session_service.cancel_session(db=db, session_id=session_id, current_user_payload=current_user_payload)


@router.post(
    "/{session_id}/generate-balaustre",
    summary="Gerar Balaústre (PDF) da Sessão",
    description="Dispara a geração do Balaústre da sessão em segundo plano e salva como documento.",
)
async def generate_balaustre_for_session(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return await session_service.generate_session_document(
        db=db,
        session_id=session_id,
        document_type="BALAUSTRE",
        current_user_payload=current_user_payload,
        background_tasks=background_tasks,
    )


@router.post(
    "/{session_id}/generate-edital",
    summary="Gerar Edital (PDF) de Convocação da Sessão",
    description="Dispara a geração do Edital de Convocação da sessão em segundo plano e salva como documento.",
)
async def generate_edital_for_session(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return await session_service.generate_session_document(
        db=db,
        session_id=session_id,
        document_type="EDITAL",
        current_user_payload=current_user_payload,
        background_tasks=background_tasks,
    )


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Sessão Maçônica",
    description="Exclui uma sessão maçônica existente, garantindo que pertença à loja do usuário.",
)
def delete_masonic_session(
    session_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    session_service.delete_session(db=db, session_id=session_id, current_user_payload=current_user_payload)
    return {"message": "Sessão excluída com sucesso."}


# --- Rotas de Presença ---

@router.get(
    "/{session_id}/attendance",
    response_model=list[session_attendance_schema.SessionAttendanceWithMemberResponse],
    summary="Listar Presença da Sessão",
    description="Retorna a lista de presença de uma sessão específica.",
)
def get_session_attendance_list(
    session_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    return session_service.get_session_attendance(db=db, session_id=session_id, current_user_payload=current_user_payload)


@router.post(
    "/{session_id}/attendance/manual",
    response_model=session_attendance_schema.SessionAttendanceResponse,
    summary="Atualizar Presença Manualmente",
    description="Atualiza o status de presença de um membro manualmente.",
)
def update_manual_attendance_status(
    session_id: int,
    attendance_data: dict, # Expects member_id and attendance_status
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return session_service.update_manual_attendance(
        db=db,
        session_id=session_id,
        member_id=attendance_data["member_id"],
        status=attendance_data["attendance_status"],
        current_user_payload=current_user_payload
    )


@router.post(
    "/{session_id}/attendance/visitor",
    response_model=session_attendance_schema.SessionAttendanceResponse,
    summary="Registrar Presença de Visitante",
    description="Registra a presença de um visitante na sessão.",
)
def register_visitor_attendance_record(
    session_id: int,
    visitor_data: dict,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return session_service.register_visitor_attendance(
        db=db,
        session_id=session_id,
        visitor_data=visitor_data,
        current_user_payload=current_user_payload
    )
