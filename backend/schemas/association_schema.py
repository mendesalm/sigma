from pydantic import BaseModel, Field


# Schemas for MemberLodgeAssociation
class MemberLodgeAssociationBase(BaseModel):
    member_id: int = Field(..., description="ID of the Member to be associated.")
    lodge_id: int = Field(..., description="ID of the Lodge to which the member will be associated.")
    role_id: int = Field(..., description="ID of the Role the member will hold in the lodge.")


class MemberLodgeAssociationCreate(MemberLodgeAssociationBase):
    pass


class MemberLodgeAssociationResponse(MemberLodgeAssociationBase):
    id: int

    class Config:
        from_attributes = True


# Schemas for MemberObedienceAssociation
class MemberObedienceAssociationBase(BaseModel):
    member_id: int = Field(..., description="ID of the Member to be associated.")
    obedience_id: int = Field(..., description="ID of the Obedience to which the member will be associated.")
    role_id: int = Field(..., description="ID of the Role the member will hold in the obedience.")


class MemberObedienceAssociationCreate(MemberObedienceAssociationBase):
    pass


class MemberObedienceAssociationResponse(MemberObedienceAssociationBase):
    id: int

    class Config:
        from_attributes = True
