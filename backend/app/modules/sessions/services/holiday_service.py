import datetime
import holidays
from typing import Optional, List
from sqlalchemy.orm import Session
from app.modules.sessions.models import LodgeRecess

from app.modules.core.models import Lodge

def is_custom_holiday(date: datetime.date, lodge: Lodge) -> tuple[bool, str]:
    """
    Verifica se a data cai em algum feriado customizado da Loja (ex: Feriado Maçônico da obediência).
    """
    if not lodge or not lodge.custom_holidays:
        return False, ""
        
    for ch in lodge.custom_holidays:
        if isinstance(ch, dict) and ch.get("month") == date.month and ch.get("day") == date.day:
            return True, ch.get("name", "Feriado Customizado")
    return False, ""

def is_national_holiday(date: datetime.date) -> bool:
    """
    Verifica se a data é um feriado nacional no Brasil.
    """
    br_holidays = holidays.BR(years=date.year)
    return date in br_holidays

def get_recess_for_date(db: Session, lodge_id: int, date: datetime.date) -> Optional[LodgeRecess]:
    """
    Verifica se a data cai em algum recesso (férias maçônicas) cadastrado pela loja.
    Retorna o objeto LodgeRecess se cair, caso contrário None.
    """
    return db.query(LodgeRecess).filter(
        LodgeRecess.lodge_id == lodge_id,
        LodgeRecess.start_date <= date,
        LodgeRecess.end_date >= date
    ).first()

def should_suppress_session(db: Session, lodge_id: int, date: datetime.date) -> tuple[bool, str]:
    """
    Avalia se uma sessão planejada para esta data deve ser suprimida.
    Retorna (booleano, motivo).
    """
    recess = get_recess_for_date(db, lodge_id, date)
    if recess:
        return True, f"Férias da Loja: {recess.description or 'Sem descrição'}"
    
    if is_national_holiday(date):
        br_holidays = holidays.BR(years=date.year)
        holiday_name = br_holidays.get(date)
        return True, f"Feriado Nacional: {holiday_name}"
        
    lodge = db.query(Lodge).filter(Lodge.id == lodge_id).first()
    is_custom, custom_name = is_custom_holiday(date, lodge)
    if is_custom:
        return True, f"Feriado Maçônico: {custom_name}"
        
    return False, ""
