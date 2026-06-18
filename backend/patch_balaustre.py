import sys
import re

# 1. Update session_routes.py
file_path_1 = r'app/modules/sessions/routes/session_routes.py'
with open(file_path_1, 'r', encoding='utf-8') as f:
    content_1 = f.read()

target_route = '''async def get_balaustre_draft(
    session_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return await session_service.get_balaustre_draft(
        db=db, session_id=session_id, current_user_payload=current_user_payload
    )'''

replacement_route = '''def get_balaustre_draft(
    session_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return session_service.get_balaustre_draft(
        db=db, session_id=session_id, current_user_payload=current_user_payload
    )'''

content_1 = content_1.replace(target_route, replacement_route)

with open(file_path_1, 'w', encoding='utf-8') as f:
    f.write(content_1)


# 2. Update session_service.py
file_path_2 = r'app/modules/sessions/services/session_service.py'
with open(file_path_2, 'r', encoding='utf-8') as f:
    content_2 = f.read()

target_service = '''def get_balaustre_data(db: Session, session_id: int, current_user_payload: dict) -> dict:
    """
    Retorna os dados consolidados da sessão para que o secretário possa redigir o balaústre.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)
    
    # Coletar presenças (membros e visitantes)
    attendances = (
        db.query(models.SessionAttendance)
        .filter(models.SessionAttendance.session_id == session_id, models.SessionAttendance.attendance_status == "Presente")
        .options(joinedload(models.SessionAttendance.member), joinedload(models.SessionAttendance.visitor))
        .all()
    )
    
    present_members = [
        {"name": att.member.full_name, "cim": att.member.cim, "degree": att.member.degree}
        for att in attendances if att.member
    ]
    present_visitors = [
        {"name": att.visitor.full_name, "cim": att.visitor.cim, "lodge": att.visitor.manual_lodge_name}
        for att in attendances if att.visitor
    ]
    
    return {
        "session_id": db_session.id,
        "title": db_session.title,
        "session_date": db_session.session_date.isoformat() if db_session.session_date else None,
        "start_time": db_session.start_time.strftime("%H:%M") if db_session.start_time else None,
        "session_type": db_session.session_type,
        "status": db_session.status,
        "temporary_role_assignments": db_session.temporary_role_assignments,
        "present_members_count": len(present_members),
        "present_visitors_count": len(present_visitors),
        "present_members": present_members,
        "present_visitors": present_visitors,
    }'''

replacement_service = '''def get_balaustre_draft(db: Session, session_id: int, current_user_payload: dict) -> dict:
    """
    Retorna os dados consolidados da sessão organizados para redigir o balaústre nominal.
    Lista membros agrupados por grau, visitantes agrupados por loja e faltas justificadas.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)
    
    # Coletar presenças
    attendances = (
        db.query(models.SessionAttendance)
        .filter(models.SessionAttendance.session_id == session_id, models.SessionAttendance.attendance_status == "Presente")
        .options(joinedload(models.SessionAttendance.member), joinedload(models.SessionAttendance.visitor))
        .all()
    )
    
    # Coletar Faltas Justificadas Aprovadas
    justifications = (
        db.query(models.AbsenceJustification)
        .filter(models.AbsenceJustification.session_id == session_id, models.AbsenceJustification.status == "Aprovado")
        .options(joinedload(models.AbsenceJustification.member))
        .all()
    )

    members_by_degree = {
        "Aprendiz": [],
        "Companheiro": [],
        "Mestre": [],
        "Outros": []
    }
    
    visitors_by_lodge = {}
    present_members_count = 0
    present_visitors_count = 0

    for att in attendances:
        if att.member:
            degree = getattr(att.member, "degree", "Outros") or "Outros"
            if degree in members_by_degree:
                members_by_degree[degree].append(att.member.full_name)
            else:
                members_by_degree["Outros"].append(att.member.full_name)
            present_members_count += 1
        elif att.visitor:
            lodge_name = att.visitor.manual_lodge_name or "Desconhecida"
            if lodge_name not in visitors_by_lodge:
                visitors_by_lodge[lodge_name] = []
            visitors_by_lodge[lodge_name].append(att.visitor.full_name)
            present_visitors_count += 1

    justified_absences = [j.member.full_name for j in justifications if j.member]

    # Ordenar alfabeticamente
    for degree in members_by_degree:
        members_by_degree[degree].sort()
    for lodge in visitors_by_lodge:
        visitors_by_lodge[lodge].sort()
    justified_absences.sort()

    return {
        "session_id": db_session.id,
        "title": db_session.title,
        "session_date": db_session.session_date.isoformat() if db_session.session_date else None,
        "start_time": db_session.start_time.strftime("%H:%M") if db_session.start_time else None,
        "session_type": db_session.session_type,
        "status": db_session.status,
        "temporary_role_assignments": db_session.temporary_role_assignments,
        "present_members_count": present_members_count,
        "present_visitors_count": present_visitors_count,
        "nominal_list": {
            "members_by_degree": members_by_degree,
            "visitors_by_lodge": visitors_by_lodge,
            "justified_absences": justified_absences
        }
    }'''

content_2 = content_2.replace(target_service, replacement_service)

with open(file_path_2, 'w', encoding='utf-8') as f:
    f.write(content_2)
print("success")
