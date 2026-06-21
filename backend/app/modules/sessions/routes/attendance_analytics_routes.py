from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_active_user_with_permissions, UserContext, require_permission
from app.modules.sessions.services import attendance_service, attendance_analytics_service

router = APIRouter(prefix="/analytics/attendance", tags=["Dashboards de Assiduidade"], responses={404: {"description": "Não encontrado"}})

@router.get(
    "/lodge/{lodge_id}",
    summary="Estatísticas da Loja",
    description="Retorna a média de presença das últimas sessões da loja."
)
def lodge_attendance_dashboard(
    lodge_id: int,
    period_months: int = 12,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(require_permission("view_reports"))
):
    return attendance_service.get_lodge_attendance_stats(db, lodge_id, period_months)

@router.get(
    "/member",
    summary="Estatísticas Individuais (Gamificação)",
    description="Retorna a assiduidade do membro logado."
)
def member_attendance_dashboard(
    period_months: int = 12,
    db: Session = Depends(get_db),
    current_user: UserContext = Depends(get_current_active_user_with_permissions)
):
    return attendance_analytics_service.get_member_attendance_stats(db, current_user.user.id, period_months)
