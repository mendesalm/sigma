from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

class LodgeRecessBase(BaseModel):
    start_date: date = Field(..., description="Data de início do recesso")
    end_date: date = Field(..., description="Data de fim do recesso")
    description: Optional[str] = Field(None, description="Descrição ou motivo do recesso")

class LodgeRecessCreate(LodgeRecessBase):
    pass

class LodgeRecessUpdate(LodgeRecessBase):
    pass

class LodgeRecessResponse(LodgeRecessBase):
    id: int
    lodge_id: int

    class Config:
        from_attributes = True
