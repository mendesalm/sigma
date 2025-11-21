from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# Importações do projeto
from ..database import get_db
from ..dependencies import get_current_user_payload
from ..schemas import calendar_schema, event_schema
from ..services import event_service

router = APIRouter(
    prefix="/events",
    tags=["Eventos e Calendários"],
    responses={404: {"description": "Não encontrado"}}
)

# --- Endpoints de Calendário ---

@router.post(
    "/calendars",
    response_model=calendar_schema.CalendarInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Novo Calendário",
    description="Cria um novo calendário associado à loja do usuário autenticado."
)
def create_new_calendar(
    calendar_data: calendar_schema.CalendarCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return event_service.create_calendar(db=db, calendar_data=calendar_data, current_user_payload=current_user_payload)

@router.get(
    "/calendars",
    response_model=list[calendar_schema.CalendarInDB],
    summary="Listar Calendários da Loja",
    description="Retorna uma lista de todos os calendários associados à loja do usuário autenticado."
)
def list_calendars(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return event_service.get_calendars_by_lodge(db=db, current_user_payload=current_user_payload)

@router.get(
    "/calendars/{calendar_id}",
    response_model=calendar_schema.CalendarInDB,
    summary="Obter Calendário por ID",
    description="Retorna um calendário específico pelo seu ID, garantindo que pertença à loja do usuário."
)
def get_calendar(
    calendar_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return event_service.get_calendar_by_id(db=db, calendar_id=calendar_id, current_user_payload=current_user_payload)

@router.put(
    "/calendars/{calendar_id}",
    response_model=calendar_schema.CalendarInDB,
    summary="Atualizar Calendário",
    description="Atualiza um calendário existente, garantindo que pertença à loja do usuário."
)
def update_existing_calendar(
    calendar_id: int,
    calendar_update: calendar_schema.CalendarUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return event_service.update_calendar(db=db, calendar_id=calendar_id, calendar_update=calendar_update, current_user_payload=current_user_payload)

@router.delete(
    "/calendars/{calendar_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Calendário",
    description="Exclui um calendário existente, garantindo que pertença à loja do usuário."
)
def delete_existing_calendar(
    calendar_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    event_service.delete_calendar(db=db, calendar_id=calendar_id, current_user_payload=current_user_payload)
    return {"message": "Calendário excluído com sucesso."}

# --- Endpoints de Evento ---

@router.post(
    "/",
    response_model=event_schema.EventInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Novo Evento",
    description="Cria um novo evento associado à loja do usuário autenticado. Pode ser associado a um calendário existente."
)
def create_new_event(
    event_data: event_schema.EventCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return event_service.create_event(db=db, event_data=event_data, current_user_payload=current_user_payload)

@router.get(
    "/",
    response_model=list[event_schema.EventInDB],
    summary="Listar Eventos da Loja",
    description="Retorna uma lista de todos os eventos associados à loja do usuário autenticado, com filtros opcionais de data."
)
def list_events(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
    start_date: datetime | None = Query(None, description="Data de início para filtrar eventos."),
    end_date: datetime | None = Query(None, description="Data de fim para filtrar eventos.")
):
    return event_service.get_events_by_lodge(
        db=db,
        current_user_payload=current_user_payload,
        start_date=start_date,
        end_date=end_date
    )

@router.get(
    "/{event_id}",
    response_model=event_schema.EventInDB,
    summary="Obter Evento por ID",
    description="Retorna um evento específico pelo seu ID, garantindo que pertença à loja do usuário."
)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return event_service.get_event_by_id(db=db, event_id=event_id, current_user_payload=current_user_payload)

@router.put(
    "/{event_id}",
    response_model=event_schema.EventInDB,
    summary="Atualizar Evento",
    description="Atualiza um evento existente, garantindo que pertença à loja do usuário."
)
def update_existing_event(
    event_id: int,
    event_update: event_schema.EventUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return event_service.update_event(db=db, event_id=event_id, event_update=event_update, current_user_payload=current_user_payload)

@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Evento",
    description="Exclui um evento existente, garantindo que pertença à loja do usuário."
)
def delete_existing_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    event_service.delete_event(db=db, event_id=event_id, current_user_payload=current_user_payload)
    return {"message": "Evento excluído com sucesso."}
