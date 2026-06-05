import enum

from sqlalchemy import (
    Column,
    Date,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship

from app.shared.base_model import BaseModel


class CommitteeTypeEnum(enum.StrEnum):
    PERMANENT = "Permanente"
    TEMPORARY = "Temporária"


class Committee(BaseModel):
    __tablename__ = "committees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    committee_type = Column(SQLAlchemyEnum(CommitteeTypeEnum, name="committee_type_enum"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    president_id = Column(Integer, ForeignKey("members.id"), nullable=False)

    lodge = relationship("Lodge", backref="committees")
    president = relationship("Member", foreign_keys=[president_id])
    members = relationship("CommitteeMember", back_populates="committee", cascade="all, delete-orphan")


class CommitteeMember(BaseModel):
    __tablename__ = "committee_members"

    id = Column(Integer, primary_key=True, index=True)
    committee_id = Column(Integer, ForeignKey("committees.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    role = Column(String(50), default="Membro")

    committee = relationship("Committee", back_populates="members")
    member = relationship("Member")
