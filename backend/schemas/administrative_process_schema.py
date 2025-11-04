from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Assuming a simple structure for the administrative process
class AdministrativeProcessBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: str = Field(..., max_length=50)
    lodge_id: int = Field(..., description="ID of the lodge to which the process belongs.")

class AdministrativeProcessCreate(AdministrativeProcessBase):
    pass

class AdministrativeProcessUpdate(AdministrativeProcessBase):
    title: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)

class AdministrativeProcessResponse(AdministrativeProcessBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Allows the model to be created from object attributes (ORM)
