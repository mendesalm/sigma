from pydantic import BaseModel

class VisitorCheckInRequest(BaseModel):
    visitor_id: int # ID do Visitor (Sigma DB)
    latitude: float
    longitude: float
