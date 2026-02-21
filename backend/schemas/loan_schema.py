from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from models.models import LoanStatusEnum
from schemas.library_item_schema import LibraryItemResponse
from schemas.member_schema import MemberListResponse

class LoanBase(BaseModel):
    item_id: int
    member_id: int
    due_date: datetime

class LoanCreate(BaseModel):
    item_id: int
    member_id: int

class LoanUpdate(BaseModel):
    status: Optional[LoanStatusEnum] = None
    return_date: Optional[datetime] = None

class LoanResponse(LoanBase):
    id: int
    loan_date: datetime
    return_date: Optional[datetime] = None
    status: LoanStatusEnum
    created_at: datetime
    updated_at: Optional[datetime] = None
    item: Optional[LibraryItemResponse] = None
    member: Optional[MemberListResponse] = None

    model_config = ConfigDict(from_attributes=True)
