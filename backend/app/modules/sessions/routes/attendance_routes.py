from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.modules.sessions.schemas import attendance_schema
from app.modules.sessions.schemas.session_attendance_schema import (
    SessionAttendanceResponse,
    SessionAttendanceWithMemberResponse,
)
from app.modules.sessions.services import attendance_service

# Importações do projeto
from database import get_db
from dependencies import require_permission, UserContext
from models.models import Member

router = APIRouter(
    prefix="/masonic-sessions/{session_id}/attendance",
    tags=["Presença em Sessão"],
    responses={404: {"description": "Não encontrado"}},
)


@router.get(
    "/",
    response_model=list[SessionAttendanceWithMemberResponse],
    summary="Listar Presença da Sessão",
    description="Retorna a lista de todos os membros e seus status de presença para a sessão especificada.",
)
def get_session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(require_permission("manage_attendance")),
):
    return attendance_service.get_attendance_for_session(db=db, session_id=session_id, current_user=current_user)


@router.post(
    "/manual",
    response_model=SessionAttendanceResponse,
    summary="Registrar Presença Manualmente",
    description="Permite que um usuário com a permissão 'manage_attendance' (e.g., Secretário) registre manualmente a presença de um membro na sessão especificada.",
)
def record_member_attendance_manually(
    session_id: int,
    attendance_update: attendance_schema.ManualAttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(require_permission("manage_attendance")),
):
    return attendance_service.record_manual_attendance(
        db=db, session_id=session_id, attendance_update=attendance_update, current_user=current_user
    )


@router.post(
    "/visitor",
    response_model=SessionAttendanceResponse,
    summary="Registrar Presença de Visitante",
    description="Registra a presença de um visitante na sessão especificada.",
)
def record_visitor_attendance(
    session_id: int,
    visitor_data: attendance_schema.VisitorCreate,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(require_permission("manage_attendance")),
):
    return attendance_service.record_visitor_attendance(
        db=db, session_id=session_id, visitor_data=visitor_data, current_user=current_user
    )
