from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Importações do projeto
from ..database import get_db
from ..dependencies import get_session_manager, require_permission
from ..models.models import Member
from ..schemas import attendance_schema
from ..schemas.session_attendance_schema import SessionAttendanceResponse, SessionAttendanceWithMemberResponse
from ..services import attendance_service

router = APIRouter(
    prefix="/masonic-sessions/{session_id}/attendance",
    tags=["Presença em Sessão"],
    responses={404: {"description": "Não encontrado"}}
)

@router.get(
    "/",
    response_model=list[SessionAttendanceWithMemberResponse],
    summary="Listar Presença da Sessão",
    description="Retorna a lista de todos os membros e seus status de presença para a sessão especificada."
)
def get_session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    current_member: Member = Depends(require_permission("manage_attendance"))
):
    return attendance_service.get_attendance_for_session(db=db, session_id=session_id, current_member=current_member)


@router.post(
    "/manual",
    response_model=SessionAttendanceResponse,
    summary="Registrar Presença Manualmente",
    description="Permite que um usuário com a permissão 'manage_attendance' (e.g., Secretário) registre manualmente a presença de um membro na sessão especificada."
)
def record_member_attendance_manually(
    session_id: int,
    attendance_update: attendance_schema.ManualAttendanceUpdate,
    db: Session = Depends(get_db),
    current_member: Member = Depends(require_permission("manage_attendance"))
):
    return attendance_service.record_manual_attendance(
        db=db,
        session_id=session_id,
        attendance_update=attendance_update,
        current_member=current_member
    )

@router.post(
    "/visitor",
    response_model=SessionAttendanceResponse,
    summary="Registrar Presença de Visitante",
    description="Registra a presença de um visitante na sessão especificada."
)
def record_visitor_attendance(
    session_id: int,
    visitor_data: attendance_schema.VisitorCreate,
    db: Session = Depends(get_db),
    current_member: Member = Depends(require_permission("manage_attendance"))
):
    return attendance_service.record_visitor_attendance(
        db=db,
        session_id=session_id,
        visitor_data=visitor_data,
        current_member=current_member
    )
