from pydantic import BaseModel


class ManualAttendanceUpdate(BaseModel):
    member_id: int
    attendance_status: str  # Ex: "Presente", "Justificado", "Ausente"
    reason: str | None = None  # Obrigatório apenas se sessão estiver ENCERRADA (Webmaster)


class VisitorCreate(BaseModel):
    full_name: str
    cim: str
    degree: str

    # Loja de Origem
    origin_lodge_id: int | None = None
    manual_lodge_name: str | None = None
    manual_lodge_number: str | None = None
    manual_lodge_obedience: str | None = None

    remarks: str | None = None
    reason: str | None = None  # Obrigatório se alterado/criado por Webmaster após encerramento


class QrCheckInRequest(BaseModel):
    user_id: int
    lodge_id: int
    latitude: float
    longitude: float


class TotemCheckInRequest(BaseModel):
    jwt_token: str
    lodge_id: int

from datetime import datetime

class TotemBulkItem(BaseModel):
    jwt_token: str
    timestamp_local: datetime

class TotemBulkRequest(BaseModel):
    lodge_id: int
    check_ins: list[TotemBulkItem]

class AbsenceJustificationCreate(BaseModel):
    justification_text: str
    attachment_url: str | None = None

class AbsenceJustificationUpdate(BaseModel):
    status: str # APPROVED or REJECTED
