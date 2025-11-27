from datetime import date, time

from pydantic import BaseModel
from pydantic_settings import SettingsConfigDict

from .document_schema import DocumentInDB  # Adicionada importação
from .session_attendance_schema import SessionAttendanceResponse


class MasonicSessionBase(BaseModel):
    title: str
    session_date: date
    start_time: time | None = None
    end_time: time | None = None
    status: str = "AGENDADA"


class MasonicSessionCreate(MasonicSessionBase):
    pass


class MasonicSessionUpdate(BaseModel):
    title: str | None = None
    session_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    status: str | None = None


class MasonicSessionResponse(MasonicSessionBase):
    id: int
    lodge_id: int
    attendances: list[SessionAttendanceResponse] = []
    documents: list[DocumentInDB] = []  # Adicionado relacionamento

    model_config = SettingsConfigDict(from_attributes=True)
