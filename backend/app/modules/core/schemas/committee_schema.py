from datetime import date

from pydantic import BaseModel

from models.models import CommitteeTypeEnum


class CommitteeMemberSchema(BaseModel):
    member_id: int
    role: str

    class Config:
        from_attributes = True


class CommitteeBase(BaseModel):
    name: str
    description: str | None = None
    committee_type: CommitteeTypeEnum
    start_date: date
    end_date: date
    president_id: int


class CommitteeCreate(CommitteeBase):
    member_ids: list[int] = []


class CommitteeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    committee_type: CommitteeTypeEnum | None = None
    start_date: date | None = None
    end_date: date | None = None
    president_id: int | None = None
    member_ids: list[int] | None = None


class CommitteeResponse(CommitteeBase):
    id: int
    lodge_id: int
    members: list[CommitteeMemberSchema] = []

    # Helper to include full member objects if needed, but for now let's keep it simple
    # We might want to enrich this in the service or use a nested Member schema

    class Config:
        from_attributes = True
