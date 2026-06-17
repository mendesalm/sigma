from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy import Enum as SQLAlchemyEnum

from app.shared.base_model import BaseModel, DegreeEnum


class Calendar(BaseModel):
    __tablename__ = "calendars"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    lodge = relationship("Lodge", backref="calendars")


class Event(BaseModel):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    is_public = Column(Boolean, default=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    lodge = relationship("Lodge", backref="events")
    calendar_id = Column(Integer, ForeignKey("calendars.id"), nullable=True)
    calendar = relationship("Calendar", backref="events")

    __table_args__ = (CheckConstraint("end_time > start_time", name="chk_event_dates"),)


class Classified(BaseModel):
    __tablename__ = "classifieds"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=True)
    contact_info = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)

    street = Column(String(255), nullable=True)
    number = Column(String(50), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(9), nullable=True)
    category = Column(String(50), nullable=True)

    status = Column(String(50), default="ACTIVE")
    expires_at = Column(DateTime(timezone=True), nullable=False)

    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)

    lodge = relationship("Lodge", backref="classifieds")
    member = relationship("Member", backref="classifieds")
    photos = relationship("ClassifiedPhoto", back_populates="classified", cascade="all, delete-orphan")


class ClassifiedPhoto(BaseModel):
    __tablename__ = "classified_photos"
    id = Column(Integer, primary_key=True, index=True)
    classified_id = Column(Integer, ForeignKey("classifieds.id"), nullable=False)
    image_path = Column(String(512), nullable=False)
    classified = relationship("Classified", back_populates="photos")


class DiningScale(BaseModel):
    __tablename__ = "dining_scales"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    position = Column(String(50), nullable=False)

    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)

    lodge = relationship("Lodge", backref="dining_scales")
    member = relationship("Member", backref="dining_scales")


class EntityMessage(BaseModel):
    __tablename__ = "entity_messages"
    id = Column(Integer, primary_key=True, index=True)
    sender_obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=True)
    sender_lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=True)
    recipient_obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=True)
    recipient_lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(50), default="UNREAD") # UNREAD, READ, ARCHIVED
    minimum_degree = Column(SQLAlchemyEnum(DegreeEnum, name="degree_enum", create_type=False), nullable=False, default=DegreeEnum.APPRENTICE)

    sender_obedience = relationship("Obedience", foreign_keys=[sender_obedience_id])
    sender_lodge = relationship("Lodge", foreign_keys=[sender_lodge_id])
    recipient_obedience = relationship("Obedience", foreign_keys=[recipient_obedience_id])
    recipient_lodge = relationship("Lodge", foreign_keys=[recipient_lodge_id])
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")


class MessageAttachment(BaseModel):
    __tablename__ = "message_attachments"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("entity_messages.id"), nullable=False)
    file_url = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)

    message = relationship("EntityMessage", back_populates="attachments")
