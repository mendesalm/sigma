from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional, List
from .session_attendance_schema import SessionAttendanceResponse
from .document_schema import DocumentInDB  # Adicionada importação
from pydantic_settings import SettingsConfigDict

class MasonicSessionBase(BaseModel):
    title: str
    session_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: str = 'AGENDADA'

class MasonicSessionCreate(MasonicSessionBase):
    pass

class MasonicSessionUpdate(BaseModel):
    title: Optional[str] = None
    session_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = None

class MasonicSessionResponse(MasonicSessionBase):
    id: int
    lodge_id: int
    attendances: List[SessionAttendanceResponse] = []
    documents: List[DocumentInDB] = []  # Adicionado relacionamento

    model_config = SettingsConfigDict(from_attributes=True)
