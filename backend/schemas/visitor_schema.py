from pydantic import BaseModel
from typing import Optional
from pydantic_settings import SettingsConfigDict

class VisitorBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    cim: Optional[str] = None
    external_lodge_id: Optional[int] = None

class VisitorCreate(VisitorBase):
    pass

class VisitorResponse(VisitorBase):
    id: int

    model_config = SettingsConfigDict(from_attributes=True)
