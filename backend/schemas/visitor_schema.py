
from pydantic import BaseModel
from pydantic_settings import SettingsConfigDict


class VisitorBase(BaseModel):
    full_name: str
    email: str | None = None
    phone: str | None = None
    cim: str | None = None
    external_lodge_id: int | None = None

class VisitorCreate(VisitorBase):
    pass

class VisitorResponse(VisitorBase):
    id: int

    model_config = SettingsConfigDict(from_attributes=True)
