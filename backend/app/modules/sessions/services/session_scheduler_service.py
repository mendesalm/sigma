import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
from dateutil.rrule import rrule, WEEKLY, MONTHLY, MO, TU, WE, TH, FR, SA, SU
from app.modules.core.models import Lodge
from app.modules.sessions.models import MasonicSession, SessionTypeEnum, SessionSubtypeEnum
from app.modules.sessions.services.holiday_service import should_suppress_session

def generate_annual_sessions_for_lodge(db: Session, lodge: Lodge, year: int) -> int:
    """
    Gera sessões projetadas (PREVISTA/SUPRIMIDA) para uma loja para todo o ano especificado.
    Utiliza dateutil.rrule para lidar com recorrências complexas (ex: 1ª e 3ª sexta).
    Retorna o número de sessões criadas.
    """
    if not lodge.auto_schedule_sessions:
        return 0

    if not lodge.session_day or not lodge.periodicity:
        return 0

    # Mapeamento do Enum para constantes do dateutil
    weekday_map = {
        "Domingos": SU,
        "Segundas-feiras": MO,
        "Terças-feiras": TU,
        "Quartas-feiras": WE,
        "Quintas-feiras": TH,
        "Sextas-feiras": FR,
        "Sábados": SA,
    }
    
    target_weekday = weekday_map.get(lodge.session_day)
    if target_weekday is None:
        return 0

    # 1. Apagar todas as sessões PREVISTAS do ano que NÃO foram modificadas manualmente
    start_of_year = datetime.date(year, 1, 1)
    end_of_year = datetime.date(year, 12, 31)
    
    db.query(MasonicSession).filter(
        MasonicSession.lodge_id == lodge.id,
        MasonicSession.status == "PREVISTA",
        MasonicSession.is_manually_modified == False,
        MasonicSession.session_date >= start_of_year,
        MasonicSession.session_date <= end_of_year
    ).delete(synchronize_session=False)
    db.commit()

    # 2. Configurar a regra de recorrência (RRULE)
    dtstart = datetime.datetime(year, 1, 1)
    until = datetime.datetime(year, 12, 31)
    
    # Lista de instâncias do dia da semana (ex: [FR(1), FR(3)])
    # Se session_weeks for None ou vazio, assumimos que aplica em todas as semanas (WEEKLY)
    # ou para Mensal usamos a 1ª semana como fallback.
    session_weeks = lodge.session_weeks or []
    
    if lodge.periodicity == "Semanal":
        # Toda semana naquele dia
        rule = rrule(WEEKLY, dtstart=dtstart, until=until, byweekday=target_weekday)
    else:
        # Quinzenal ou Mensal utilizam a especificação de semanas.
        # Ex: session_weeks = [1, 3] -> 1ª e 3ª semanas do mês
        if not session_weeks:
            # Fallback se a loja for Mensal/Quinzenal mas não selecionou semanas
            # Vamos gerar na 1ª e 3ª se for quinzenal, ou 1ª se for mensal
            if lodge.periodicity == "Quinzenal":
                byweekday_params = [target_weekday(1), target_weekday(3)]
            else:
                byweekday_params = [target_weekday(1)]
        else:
            byweekday_params = [target_weekday(wk) for wk in session_weeks]
            
        rule = rrule(MONTHLY, dtstart=dtstart, until=until, byweekday=byweekday_params)

    # 3. Gerar as datas
    generated_dates = [dt.date() for dt in rule]
    
    sessions_created = 0
    for current_date in generated_dates:
        # Determine status baseado em feriados e recessos
        is_suppressed, reason = should_suppress_session(db, lodge.id, current_date)
        status = "SUPRIMIDA" if is_suppressed else "PREVISTA"
        
        # Check if any session already exists on this date to prevent duplicates
        # We must respect manually modified sessions that might have fallen on this date
        existing = db.query(MasonicSession).filter(
            MasonicSession.lodge_id == lodge.id,
            MasonicSession.session_date == current_date
        ).first()

        if not existing:
            title_prefix = "Sessão Ordinária" if not is_suppressed else "Sessão Suprimida"
            session_title = f"{title_prefix} - {current_date.strftime('%d/%m/%Y')}"
            
            new_session = MasonicSession(
                title=session_title,
                session_date=current_date,
                start_time=lodge.session_time,
                type=SessionTypeEnum.ORDINARY,
                subtype=SessionSubtypeEnum.REGULAR,
                status=status,
                lodge_id=lodge.id,
                agenda=f"Sessão projetada automaticamente. {reason}" if is_suppressed else "Sessão projetada automaticamente."
            )
            db.add(new_session)
            sessions_created += 1

    db.commit()
    return sessions_created

def confirm_monthly_sessions(db: Session, lodge_id: int, start_date: datetime.date, end_date: datetime.date):
    """
    Confirma sessões PREVISTA para AGENDADA em um intervalo (geralmente um mês).
    """
    sessions = db.query(MasonicSession).filter(
        MasonicSession.lodge_id == lodge_id,
        MasonicSession.status == "PREVISTA",
        MasonicSession.session_date >= start_date,
        MasonicSession.session_date <= end_date
    ).all()
    
    for session in sessions:
        session.status = "AGENDADA"
        # Reset agenda if it was "Sessão projetada..."
        if session.agenda and "projetada" in session.agenda:
            session.agenda = ""
            
    db.commit()
    return len(sessions)
