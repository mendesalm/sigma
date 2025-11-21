from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import models
from ..schemas import calendar_schema, event_schema

# --- Funções de Serviço para Calendário ---

def create_calendar(
    db: Session,
    calendar_data: calendar_schema.CalendarCreate,
    current_user_payload: dict
) -> models.Calendar:
    """
    Cria um novo calendário associado à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operação não permitida: Usuário não associado a uma loja."
        )

    db_calendar = models.Calendar(**calendar_data.model_dump(), lodge_id=lodge_id)
    db.add(db_calendar)
    db.commit()
    db.refresh(db_calendar)
    return db_calendar

def get_calendar_by_id(
    db: Session,
    calendar_id: int,
    current_user_payload: dict
) -> models.Calendar:
    """
    Busca um calendário pelo ID, garantindo que pertença à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    calendar = db.query(models.Calendar).filter(
        models.Calendar.id == calendar_id,
        models.Calendar.lodge_id == lodge_id
    ).first()

    if not calendar:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendário não encontrado.")
    return calendar

def get_calendars_by_lodge(
    db: Session,
    current_user_payload: dict
) -> list[models.Calendar]:
    """
    Lista todos os calendários associados à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []
    return db.query(models.Calendar).filter(models.Calendar.lodge_id == lodge_id).all()

def update_calendar(
    db: Session,
    calendar_id: int,
    calendar_update: calendar_schema.CalendarUpdate,
    current_user_payload: dict
) -> models.Calendar:
    """
    Atualiza um calendário existente, garantindo que pertença à loja do usuário.
    """
    db_calendar = get_calendar_by_id(db, calendar_id, current_user_payload) # Valida propriedade

    for key, value in calendar_update.model_dump(exclude_unset=True).items():
        setattr(db_calendar, key, value)

    db.commit()
    db.refresh(db_calendar)
    return db_calendar

def delete_calendar(
    db: Session,
    calendar_id: int,
    current_user_payload: dict
) -> models.Calendar:
    """
    Apaga um calendário existente, garantindo que pertença à loja do usuário.
    """
    db_calendar = get_calendar_by_id(db, calendar_id, current_user_payload) # Valida propriedade
    db.delete(db_calendar)
    db.commit()
    return db_calendar

# --- Funções de Serviço para Eventos ---

def create_event(
    db: Session,
    event_data: event_schema.EventCreate,
    current_user_payload: dict
) -> models.Event:
    """
    Cria um novo evento associado à loja do usuário. Se um calendar_id for fornecido,
    verifica se o calendário também pertence à mesma loja.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operação não permitida: Usuário não associado a uma loja."
        )

    # Verifica se o calendar_id fornecido pertence à mesma loja
    if event_data.calendar_id:
        calendar = get_calendar_by_id(db, event_data.calendar_id, current_user_payload)
        if calendar.lodge_id != lodge_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Calendário especificado não pertence à loja do usuário."
            )

    db_event = models.Event(**event_data.model_dump(), lodge_id=lodge_id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_event_by_id(
    db: Session,
    event_id: int,
    current_user_payload: dict
) -> models.Event:
    """
    Busca um evento pelo ID, garantindo que pertença à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.lodge_id == lodge_id
    ).first()

    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado.")
    return event

def get_events_by_lodge(
    db: Session,
    current_user_payload: dict,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> list[models.Event]:
    """
    Lista todos os eventos associados à loja do usuário, opcionalmente filtrando por data.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []

    query = db.query(models.Event).filter(models.Event.lodge_id == lodge_id)

    if start_date:
        query = query.filter(models.Event.start_time >= start_date)
    if end_date:
        query = query.filter(models.Event.end_time <= end_date)

    return query.all()

def update_event(
    db: Session,
    event_id: int,
    event_update: event_schema.EventUpdate,
    current_user_payload: dict
) -> models.Event:
    """
    Atualiza um evento existente, garantindo que pertença à loja do usuário.
    """
    db_event = get_event_by_id(db, event_id, current_user_payload) # Valida propriedade

    # Se o calendar_id for atualizado, verifica se o novo calendário pertence à mesma loja
    if event_update.calendar_id is not None and event_update.calendar_id != db_event.calendar_id:
        calendar = get_calendar_by_id(db, event_update.calendar_id, current_user_payload)
        if calendar.lodge_id != db_event.lodge_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Novo calendário especificado não pertence à loja do evento."
            )

    for key, value in event_update.model_dump(exclude_unset=True).items():
        setattr(db_event, key, value)

    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(
    db: Session,
    event_id: int,
    current_user_payload: dict
) -> models.Event:
    """
    Apaga um evento existente, garantindo que pertença à loja do usuário.
    """
    db_event = get_event_by_id(db, event_id, current_user_payload) # Valida propriedade
    db.delete(db_event)
    db.commit()
    return db_event
