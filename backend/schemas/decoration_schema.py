from datetime import date

from pydantic import BaseModel, Field


# Base schema with common fields
class DecorationBase(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the decoration or honor.")
    award_date: date = Field(..., description="Date the decoration was received.")
    remarks: str | None = Field(None, description="Additional observations or details.")

# Schema for creation (requires member ID)
class DecorationCreate(DecorationBase):
    pass

# Schema for update (all fields are optional)
class DecorationUpdate(DecorationBase):
    title: str | None = Field(None, max_length=255)
    award_date: date | None = None

# Schema for API response
class DecorationResponse(DecorationBase):
    id: int

    class Config:
        from_attributes = True
