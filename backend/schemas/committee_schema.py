from pydantic import BaseModel
from datetime import date
from typing import List, Optional
from models.models import CommitteeTypeEnum

class CommitteeMemberSchema(BaseModel):
    member_id: int
    role: str

    class Config:
        from_attributes = True

class CommitteeBase(BaseModel):
    name: str
    description: Optional[str] = None
    committee_type: CommitteeTypeEnum
    start_date: date
    end_date: date
    president_id: int

class CommitteeCreate(CommitteeBase):
    member_ids: List[int] = []

class CommitteeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    committee_type: Optional[CommitteeTypeEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    president_id: Optional[int] = None
    member_ids: Optional[List[int]] = None

class CommitteeResponse(CommitteeBase):
    id: int
    lodge_id: int
    members: List[CommitteeMemberSchema] = []
    
    # Helper to include full member objects if needed, but for now let's keep it simple
    # We might want to enrich this in the service or use a nested Member schema
    
    class Config:
        from_attributes = True
