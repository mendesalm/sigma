from datetime import date, timedelta
from sqlalchemy.orm import Session
from models import models

def get_member_attendance_stats(db: Session, member_id: int, period_months: int = 12) -> dict:
    end_date = date.today()
    start_date = end_date - timedelta(days=period_months * 30)

    # Pegar lojas em que o membro está ativo
    associations = db.query(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.member_id == member_id,
        models.MemberLodgeAssociation.status == "Ativo"
    ).all()
    
    if not associations:
        return {"attendance_rate": 0, "achievements": []}
        
    lodge_ids = [a.lodge_id for a in associations]

    # Sessões realizadas nessas lojas
    sessions = (
        db.query(models.MasonicSession)
        .filter(
            models.MasonicSession.lodge_id.in_(lodge_ids),
            models.MasonicSession.session_date >= start_date,
            models.MasonicSession.session_date <= end_date,
            models.MasonicSession.status.in_(["REALIZADA", "ENCERRADA"]),
        )
        .all()
    )

    total_sessions = len(sessions)
    if total_sessions == 0:
         return {"attendance_rate": 0, "achievements": [], "total_sessions": 0, "present_sessions": 0}

    session_ids = [s.id for s in sessions]

    # Presenças do membro
    attendances = (
        db.query(models.SessionAttendance)
        .filter(
            models.SessionAttendance.session_id.in_(session_ids),
            models.SessionAttendance.member_id == member_id,
            models.SessionAttendance.attendance_status.in_(["Presente", "Justificado"])
        )
        .all()
    )

    present_count = len(attendances)
    attendance_rate = (present_count / total_sessions) * 100

    achievements = []
    if attendance_rate == 100:
        achievements.append("Assiduidade Perfeita!")
    elif attendance_rate >= 80:
        achievements.append("Maçom Assíduo")

    return {
        "attendance_rate": round(attendance_rate, 2),
        "total_sessions": total_sessions,
        "present_sessions": present_count,
        "achievements": achievements
    }
