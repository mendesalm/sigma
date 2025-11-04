from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

# Base schema with common fields
class DecorationBase(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the decoration or honor.")
    award_date: date = Field(..., description="Date the decoration was received.")
    remarks: Optional[str] = Field(None, description="Additional observations or details.")

# Schema for creation (requires member ID)
class DecorationCreate(DecorationBase):
    pass

# Schema for update (all fields are optional)
class DecorationUpdate(DecorationBase):
    title: Optional[str] = Field(None, max_length=255)
    award_date: Optional[date] = None

# Schema for API response
class DecorationResponse(DecorationBase):
    id: int

    class Config:
        from_attributes = True
