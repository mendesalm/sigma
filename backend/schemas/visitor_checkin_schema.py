from pydantic import BaseModel

class VisitorCheckInRequest(BaseModel):
    visitor_id: str # UUID do GlobalVisitor
    latitude: float
    longitude: float
