from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
import calendar

from database import get_db
from models import models
from dependencies import get_current_user_payload

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
):
    lodge_id = payload.get("lodge_id")
    
    if not lodge_id:
        raise HTTPException(status_code=400, detail="User is not associated with any lodge context")
    
    today = date.today()
    
    # 1. Total Active Members
    total_members = db.query(models.Member).join(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.lodge_id == lodge_id,
        models.MemberLodgeAssociation.status == models.MemberStatusEnum.ACTIVE
    ).count()
    
    # 2. Next Events (limit 5)
    next_events = db.query(models.Event).filter(
        models.Event.lodge_id == lodge_id,
        models.Event.start_time >= datetime.now()
    ).order_by(models.Event.start_time).limit(5).all()
    
    # 3. Upcoming Birthdays & Anniversaries (Next 30 days)
    active_members = db.query(models.Member).join(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.lodge_id == lodge_id,
        models.MemberLodgeAssociation.status == models.MemberStatusEnum.ACTIVE
    ).options(joinedload(models.Member.family_members)).all()
    
    upcoming_birthdays = []
    limit_date = today + timedelta(days=30)
    
    def get_next_occurrence(date_obj, reference_date):
        if not date_obj:
            return None
        try:
            this_year = date_obj.replace(year=reference_date.year)
        except ValueError:
            this_year = date_obj.replace(year=reference_date.year, day=28)
            
        if this_year < reference_date:
            try:
                this_year = date_obj.replace(year=reference_date.year + 1)
            except ValueError:
                this_year = date_obj.replace(year=reference_date.year + 1, day=28)
        return this_year

    for member in active_members:
        # Member Birthday
        bday = get_next_occurrence(member.birth_date, today)
        if bday and today <= bday <= limit_date:
            upcoming_birthdays.append({
                "name": member.full_name,
                "date": bday,
                "type": "aniversario"
            })
            
        # Wedding Anniversary
        wedding_day = get_next_occurrence(member.marriage_date, today)
        if wedding_day and today <= wedding_day <= limit_date:
            upcoming_birthdays.append({
                "name": member.full_name,
                "date": wedding_day,
                "type": "casamento"
            })

        # Masonic Anniversaries
        initiation = get_next_occurrence(member.initiation_date, today)
        if initiation and today <= initiation <= limit_date:
             upcoming_birthdays.append({
                "name": member.full_name,
                "date": initiation,
                "type": "iniciacao"
            })
            
        elevation = get_next_occurrence(member.elevation_date, today)
        if elevation and today <= elevation <= limit_date:
             upcoming_birthdays.append({
                "name": member.full_name,
                "date": elevation,
                "type": "elevacao"
            })
            
        exaltation = get_next_occurrence(member.exaltation_date, today)
        if exaltation and today <= exaltation <= limit_date:
             upcoming_birthdays.append({
                "name": member.full_name,
                "date": exaltation,
                "type": "exaltacao"
            })

        # Family Birthdays
        for fm in member.family_members:
            if fm.is_deceased:
                continue
            fm_bday = get_next_occurrence(fm.birth_date, today)
            if fm_bday and today <= fm_bday <= limit_date:
                rel_type = fm.relationship_type.value if hasattr(fm.relationship_type, "value") else str(fm.relationship_type)
                upcoming_birthdays.append({
                    "name": f"{fm.full_name} ({rel_type} do Ir. {member.full_name})",
                    "date": fm_bday,
                    "type": "aniversario_familiar"
                })

    upcoming_birthdays.sort(key=lambda x: x['date'])
    
    # 4. Notices (Active)
    active_notices_query = db.query(models.Notice).filter(
        models.Notice.lodge_id == lodge_id,
        models.Notice.is_active == True,
        or_(models.Notice.expiration_date == None, models.Notice.expiration_date >= today)
    ).order_by(models.Notice.created_at.desc()) # Order by most recent
    
    active_notices_count = active_notices_query.count()
    active_notices_list = active_notices_query.limit(5).all()
    
    active_notices_data = []
    for n in active_notices_list:
        active_notices_data.append({
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "date_posted": n.created_at,
            "expiration_date": n.expiration_date,
            "lodge_id": n.lodge_id
        })
    
    # 5. Next Session
    next_session = db.query(models.MasonicSession).filter(
        models.MasonicSession.lodge_id == lodge_id,
        models.MasonicSession.session_date >= today,
        models.MasonicSession.status != 'CANCELADA'
    ).order_by(models.MasonicSession.session_date).first()
    
    # 6. Classifieds Count
    classifieds_count = db.query(models.Classified).filter(
        models.Classified.lodge_id == lodge_id,
        models.Classified.status == 'Ativo'
    ).count()
    
    # 7. Dining Scale (Next ones)
    dining_scale_records = db.query(models.DiningScale).join(models.Member).filter(
        models.DiningScale.lodge_id == lodge_id,
        models.DiningScale.date >= today
    ).order_by(models.DiningScale.date).limit(5).all()
    
    dining_scale = []
    for ds in dining_scale_records:
        dining_scale.append({
            "position": ds.position,
            "name": ds.member.full_name,
            "date": ds.date
        })
    
    
    # 8. Lodge Members Stats (New Widget)
    ms_apprentices = 0
    ms_fellows = 0
    ms_masters = 0
    members_list_data = []

    for m in active_members:
        # Count degrees
        deg = m.degree.value if hasattr(m.degree, "value") else str(m.degree)
        if deg == "Aprendiz":
            ms_apprentices += 1
        elif deg == "Companheiro":
            ms_fellows += 1
        elif deg in ["Mestre", "Mestre Instalado"]:
            ms_masters += 1
        
        # Prepare list item
        members_list_data.append({
            "id": m.id,
            "full_name": m.full_name,
            "cim": m.cim,
            "email": m.email,
            "phone": m.phone,
            "profile_picture_path": m.profile_picture_path,
            "degree": deg
        })

    # Sort members list alphabetically
    members_list_data.sort(key=lambda x: x['full_name'])

    lodge_members_stats = {
        "total": len(active_members),
        "masters": ms_masters,
        "fellows": ms_fellows,
        "apprentices": ms_apprentices,
        "members_list": members_list_data
    }

    # 9. Lodge Info (For "Minha Loja" Widget)
    lodge = db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
    
    lodge_info = {}
    if lodge:
        # Determine Potência and Subpotência
        # Logic: If obedience has a parent, Parent is Potência, Obedience is Jurisdicionada (Subpotência).
        # If no parent, Obedience is Potência.
        
        potencia = ""
        subpotencia = ""
        
        if lodge.obedience:
            if lodge.obedience.parent_obedience:
                potencia = lodge.obedience.parent_obedience.name
                subpotencia = lodge.obedience.name
            else:
                potencia = lodge.obedience.name
                subpotencia = "" # Or maybe repeat? Let's leave empty for now or maybe "Jurisdicionada à [Potencia]" redundancy.
                # User request says: "Federada ao {Potencia} e Jurisdicionada ao {Subpotencia}"
                # If only one, maybe allow frontend to handle or just duplicate.
                # Let's try to be smart: If no parent, it is THE Potencia. Subpotencia might not apply or be same.
                
        # Format Session Day/Time
        session_day_str = lodge.session_day.value if hasattr(lodge.session_day, "value") else str(lodge.session_day)
        session_time_str = lodge.session_time.strftime("%H:%M") if lodge.session_time else ""
        
        # Rite value
        rite_str = lodge.rite.value if hasattr(lodge.rite, "value") else str(lodge.rite)

        # Address Composite
        address_parts = []
        if lodge.street_address: address_parts.append(lodge.street_address)
        if lodge.street_number: address_parts.append(lodge.street_number)
        if lodge.neighborhood: address_parts.append(lodge.neighborhood)
        if lodge.city: address_parts.append(lodge.city)
        if lodge.state: address_parts.append(lodge.state)
        if lodge.zip_code: address_parts.append(f"CEP {lodge.zip_code}")
        
        full_address = ", ".join(filter(None, address_parts))

        lodge_info = {
            "name": lodge.lodge_name,
            "number": lodge.lodge_number,
            "rite": rite_str,
            "session_day": session_day_str,
            "session_time": session_time_str,
            "potencia": potencia,
            "subpotencia": subpotencia,
            "foundation_date": lodge.foundation_date.strftime("%d/%m/%Y") if lodge.foundation_date else "",
            "address": full_address,
            "email": lodge.email,
            "cnpj": lodge.cnpj,
            "id": lodge.id
        }

    return {
        "total_members": total_members,
        "next_events": next_events,
        "upcoming_birthdays": upcoming_birthdays[:5], # Limit to 5
        "active_notices_count": active_notices_count,
        "active_notices": active_notices_data,
        "next_session": next_session,
        "classifieds_count": classifieds_count,
        "dining_scale": dining_scale,
        "lodge_members_stats": lodge_members_stats,
        "lodge_info": lodge_info
    }

@router.get("/calendar")
def get_calendar_events(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
):
    lodge_id = payload.get("lodge_id")
    
    if not lodge_id:
        raise HTTPException(status_code=400, detail="User is not associated with any lodge context")
    
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)
    
    # 1. Sessions
    sessions = db.query(models.MasonicSession).filter(
        models.MasonicSession.lodge_id == lodge_id,
        models.MasonicSession.session_date.between(start_date, end_date)
    ).all()
    
    # 2. Events
    events = db.query(models.Event).filter(
        models.Event.lodge_id == lodge_id,
        func.date(models.Event.start_time).between(start_date, end_date)
    ).all()
    
    # 3. Birthdays and Masonic Dates (Initiation, Elevation, Exaltation)
    active_members = db.query(models.Member).join(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.lodge_id == lodge_id,
        models.MemberLodgeAssociation.status == models.MemberStatusEnum.ACTIVE
    ).options(joinedload(models.Member.family_members)).all()
    
    calendar_events = []
    
    # Map Sessions
    for s in sessions:
        calendar_events.append({
            "date": s.session_date.day,
            "title": s.title,
            "type": "sessao",
            "full_date": s.session_date
        })
        
    # Map Events
    for e in events:
        calendar_events.append({
            "date": e.start_time.day,
            "title": e.title,
            "type": "evento",
            "full_date": e.start_time.date()
        })
        
    # Map Member Dates
    for m in active_members:
        # Birthday
        if m.birth_date and m.birth_date.month == month:
            day = m.birth_date.day
            try:
                event_date = date(year, month, day)
                calendar_events.append({
                    "date": day,
                    "title": f"Aniversário ({m.full_name})",
                    "type": "aniversario",
                    "full_date": event_date
                })
            except ValueError:
                if month == 2 and day == 29:
                     calendar_events.append({
                        "date": 28,
                        "title": f"Aniversário ({m.full_name})",
                        "type": "aniversario",
                        "full_date": date(year, month, 28)
                    })

        # Wedding Anniversary
        if m.marriage_date and m.marriage_date.month == month:
            day = m.marriage_date.day
            try:
                event_date = date(year, month, day)
                calendar_events.append({
                    "date": day,
                    "title": f"Casamento ({m.full_name})",
                    "type": "casamento",
                    "full_date": event_date
                })
            except ValueError:
                 if month == 2 and day == 29:
                     calendar_events.append({
                        "date": 28,
                        "title": f"Casamento ({m.full_name})",
                        "type": "casamento",
                        "full_date": date(year, month, 28)
                    })

        # Masonic Birthdays (Initiation, Elevation, Exaltation)
        if m.initiation_date and m.initiation_date.month == month:
             calendar_events.append({
                "date": m.initiation_date.day,
                "title": f"Iniciação de {m.full_name}",
                "type": "iniciacao", # Frontend can group this under 'maconico'
                "full_date": date(year, month, m.initiation_date.day)
            })
        
        if m.elevation_date and m.elevation_date.month == month:
             calendar_events.append({
                "date": m.elevation_date.day,
                "title": f"Elevação de {m.full_name}",
                "type": "elevacao", # Frontend can group this under 'maconico'
                "full_date": date(year, month, m.elevation_date.day)
            })
        
        if m.exaltation_date and m.exaltation_date.month == month:
             calendar_events.append({
                "date": m.exaltation_date.day,
                "title": f"Exaltação de {m.full_name}",
                "type": "exaltacao", # Frontend can group this under 'maconico'
                "full_date": date(year, month, m.exaltation_date.day)
            })
        
        # Family Birthdays
        for fm in m.family_members:
            if fm.is_deceased:
                continue
                
            if fm.birth_date and fm.birth_date.month == month:
                rel_type = fm.relationship_type.value if hasattr(fm.relationship_type, "value") else str(fm.relationship_type)
                calendar_events.append({
                    "date": fm.birth_date.day,
                    "title": f"Aniversário ({fm.full_name}, {rel_type} do Ir. {m.full_name})",
                    "type": "aniversario_familiar",
                    "full_date": date(year, month, fm.birth_date.day)
                })
            
    # Sort by date
    calendar_events.sort(key=lambda x: x['date'])
    
    return calendar_events
