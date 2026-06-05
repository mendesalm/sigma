from datetime import datetime

from pydantic import BaseModel


class EventBase(BaseModel):
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    is_public: bool = False
    calendar_id: int | None = None  # Optional link to a specific calendar


class EventCreate(EventBase):
    pass


class EventUpdate(EventBase):
    pass


class EventInDB(EventBase):
    id: int
    lodge_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
