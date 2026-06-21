from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_active_user_with_permissions, UserContext, require_permission
from app.modules.sessions.schemas import attendance_schema
from app.modules.sessions.services import absence_service

router = APIRouter(prefix="/absences", tags=["Gestão de Faltas"], responses={404: {"description": "Não encontrado"}})

@router.post(
    "/{session_id}/justifications",
    summary="Enviar Justificativa de Falta",
    description="Permite que um membro envie uma justificativa de falta para uma sessão."
)
def submit_justification(
    session_id: int,
    justification_data: attendance_schema.AbsenceJustificationCreate,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(get_current_active_user_with_permissions)
):
    return absence_service.submit_absence_justification(db, session_id, justification_data, current_user)

@router.get(
    "/{session_id}/justifications",
    summary="Listar Justificativas da Sessão",
    description="Lista as justificativas de falta para uma sessão (Requer permissão manage_attendance)."
)
def list_session_justifications(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(require_permission("manage_attendance"))
):
    return absence_service.get_session_justifications(db, session_id, current_user)

@router.put(
    "/justifications/{justification_id}/status",
    summary="Aprovar/Rejeitar Justificativa",
    description="Atualiza o status de uma justificativa de falta (Requer permissão manage_attendance)."
)
def update_justification_status(
    justification_id: int,
    update_data: attendance_schema.AbsenceJustificationUpdate,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(require_permission("manage_attendance"))
):
    return absence_service.update_justification_status(db, justification_id, update_data, current_user)
