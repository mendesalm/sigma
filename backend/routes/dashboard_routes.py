from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
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
        models.Member.status == "Active"
    ).count()
    
    # 2. Next Events (limit 5)
    next_events = db.query(models.Event).filter(
        models.Event.lodge_id == lodge_id,
        models.Event.start_time >= datetime.now()
    ).order_by(models.Event.start_time).limit(5).all()
    
    # 3. Next Birthdays (next 30 days)
    # This is tricky in SQL. We'll fetch active members and filter in python for simplicity or use complex SQL
    # Python approach for MVP:
    active_members = db.query(models.Member).join(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.lodge_id == lodge_id,
        models.Member.status == "Active"
    ).all()
    
    upcoming_birthdays = []
    limit_date = today + timedelta(days=30)
    
    for member in active_members:
        if member.birth_date:
            bday_this_year = member.birth_date.replace(year=today.year)
            if bday_this_year < today:
                bday_this_year = member.birth_date.replace(year=today.year + 1)
            
            if today <= bday_this_year <= limit_date:
                upcoming_birthdays.append({
                    "name": member.full_name,
                    "date": bday_this_year,
                    "type": "Membro"
                })
    
    upcoming_birthdays.sort(key=lambda x: x['date'])
    
    # 4. Notices (Active)
    active_notices_count = db.query(models.Notice).filter(
        models.Notice.lodge_id == lodge_id,
        models.Notice.is_active == True,
        or_(models.Notice.expiration_date == None, models.Notice.expiration_date >= today)
    ).count()
    
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
    
    return {
        "total_members": total_members,
        "next_events": next_events,
        "upcoming_birthdays": upcoming_birthdays[:5], # Limit to 5
        "active_notices_count": active_notices_count,
        "next_session": next_session,
        "classifieds_count": classifieds_count,
        "dining_scale": dining_scale
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
        models.Member.status == "Active"
    ).all()
    
    calendar_events = []
    
    # Map Sessions
    for s in sessions:
        calendar_events.append({
            "date": s.session_date.day,
            "title": f"Sessão {s.title}",
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
            calendar_events.append({
                "date": m.birth_date.day,
                "title": f"Aniversário ({m.full_name})",
                "type": "aniversario",
                "full_date": date(year, month, m.birth_date.day)
            })
        # Initiation
        if m.initiation_date and m.initiation_date.month == month:
             calendar_events.append({
                "date": m.initiation_date.day,
                "title": f"Iniciação de {m.full_name}",
                "type": "iniciacao",
                "full_date": date(year, month, m.initiation_date.day)
            })
        # Elevation
        if m.elevation_date and m.elevation_date.month == month:
             calendar_events.append({
                "date": m.elevation_date.day,
                "title": f"Elevação de {m.full_name}",
                "type": "elevacao",
                "full_date": date(year, month, m.elevation_date.day)
            })
        # Exaltation
        if m.exaltation_date and m.exaltation_date.month == month:
             calendar_events.append({
                "date": m.exaltation_date.day,
                "title": f"Exaltação de {m.full_name}",
                "type": "exaltacao",
                "full_date": date(year, month, m.exaltation_date.day)
            })
        
        # Family Birthdays
        for fm in m.family_members:
            if fm.is_deceased:
                continue
                
            if fm.birth_date and fm.birth_date.month == month:
                # Translate relationship type if possible, or use raw value
                rel_type = fm.relationship_type.value if hasattr(fm.relationship_type, "value") else str(fm.relationship_type)
                # Format: Fulana, filha do Ir. Cicrano
                calendar_events.append({
                    "date": fm.birth_date.day,
                    "title": f"Aniversário ({fm.full_name}, {rel_type} do Ir. {m.full_name})",
                    "type": "aniversario_familiar",
                    "full_date": date(year, month, fm.birth_date.day)
                })
            
    # Sort by date
    calendar_events.sort(key=lambda x: x['date'])
    
    return calendar_events
