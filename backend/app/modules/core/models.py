import enum
import uuid

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Time,
    func,
    Text,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship

from app.shared.base_model import BaseModel, RiteEnum


class ObedienceTypeEnum(enum.StrEnum):
    FEDERAL = "Federal"
    STATE = "Estadual"


class Obedience(BaseModel):
    __tablename__ = "obediences"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    acronym = Column(String(50), unique=True, nullable=True)
    type = Column(SQLAlchemyEnum(ObedienceTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)
    parent_obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=True)
    cnpj = Column(String(18), unique=True, nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    street_address = Column(String(255), nullable=True)
    street_number = Column(String(20), nullable=True)
    address_complement = Column(String(100), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(9), nullable=True)
    technical_contact_name = Column(String(255), nullable=False)
    technical_contact_email = Column(String(255), nullable=False)
    parent_obedience = relationship("Obedience", remote_side=[id], backref="subordinate_obediences")
    roles = relationship("Role", secondary="obediences_roles_association", back_populates="obediences")
    member_associations = relationship(
        "MemberObedienceAssociation", back_populates="obedience", cascade="all, delete-orphan"
    )
    available_modules = Column(
        JSON,
        nullable=True,
        default=lambda: {
            "member_registration": True,
            "session_management": True,
            "session_attendance": True,
            "chancellery": True,
        },
    )
    previous_settings = Column(JSON, nullable=True, comment="Backup de configurações de fábrica")


class Lodge(BaseModel):
    __tablename__ = "lodges"
    id = Column(Integer, primary_key=True, index=True)
    lodge_name = Column(String(255), nullable=False)
    lodge_title = Column(String(50), nullable=True, default="ARLS")
    lodge_code = Column(String(36), unique=True, index=True, nullable=False)
    lodge_number = Column(String(255))
    foundation_date = Column(Date, nullable=True)
    rite = Column(
        SQLAlchemyEnum(RiteEnum, values_callable=lambda x: [e.value for e in x]), nullable=True, default=RiteEnum.REAA
    )
    obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=False)
    subobedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=True)
    cnpj = Column(String(18), unique=True, nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    street_address = Column(String(255), nullable=True)
    street_number = Column(String(20), nullable=True)
    address_complement = Column(String(100), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(9), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    qr_code_id = Column(String(36), unique=True, nullable=True, default=lambda: str(uuid.uuid4()))
    geofence_radius = Column(Integer, default=200, nullable=True)
    custom_domain = Column(String(255), unique=True, nullable=True)
    plan = Column(String(255), nullable=True)
    user_limit = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    status = Column(String(255), nullable=True)
    session_day = Column(
        SQLAlchemyEnum(
            "Domingos",
            "Segundas-feiras",
            "Terças-feiras",
            "Quartas-feiras",
            "Quintas-feiras",
            "Sextas-feiras",
            "Sábados",
            name="session_day_enum",
        ),
        nullable=True,
    )
    periodicity = Column(SQLAlchemyEnum("Semanal", "Quinzenal", "Mensal", name="periodicity_enum"), nullable=True)
    session_time = Column(Time, nullable=True)
    obedience = relationship("Obedience", foreign_keys=[obedience_id], backref="lodges")
    subobedience = relationship("Obedience", foreign_keys=[subobedience_id], backref="sub_lodges")
    associations = relationship("MemberLodgeAssociation", back_populates="lodge", cascade="all, delete-orphan")
    technical_contact_name = Column(String(255), nullable=False)
    technical_contact_email = Column(String(255), nullable=False)
    document_settings = Column(JSON, nullable=True)
    available_modules = Column(
        JSON,
        nullable=True,
        default=lambda: {
            "member_registration": True,
            "session_management": True,
            "session_attendance": True,
            "chancellery": True,
        },
    )
    previous_settings = Column(JSON, nullable=True, comment="Backup de configurações de fábrica")
    auto_schedule_sessions = Column(Boolean, default=False, nullable=False)
    session_weeks = Column(JSON, nullable=True, comment="Ex: [1, 3] para primeira e terceira semana")
    custom_holidays = Column(JSON, nullable=True, default=list)
    checkin_window_start_minutes = Column(Integer, default=120, nullable=False, comment="Minutos antes do início para abrir check-in")
    checkin_window_end_minutes = Column(Integer, default=120, nullable=False, comment="Minutos depois do início para fechar check-in")

    @property
    def formatted_affiliation(self) -> str:
        if self.subobedience and self.obedience:
            return f"Federada ao {self.obedience.name}\nJurisdicionada ao {self.subobedience.name}"
        elif self.obedience:
            return f"Confederada à {self.obedience.name}"
        return ""

    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="chk_lodge_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="chk_lodge_longitude"),
        CheckConstraint("user_limit > 0", name="chk_lodge_user_limit"),
    )


class Administration(BaseModel):
    __tablename__ = "administrations"
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    lodge = relationship("Lodge", backref="administrations")


class SuperAdmin(BaseModel):
    __tablename__ = "super_admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)


class LodgeCreationRequest(BaseModel):
    __tablename__ = "lodge_creation_requests"
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("members.id"), nullable=False, comment="Chanceler que solicitou")
    requested_lodge_name = Column(String(255), nullable=False)
    requested_lodge_number = Column(String(50), nullable=True)
    requested_obedience = Column(String(100), nullable=True)
    status = Column(SQLAlchemyEnum("PENDENTE", "CRIADA", "REJEITADA", name="lodge_creation_status_enum"), default="PENDENTE", nullable=False)
    resolved_lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    requester = relationship("Member", foreign_keys=[requester_id])
    resolved_lodge = relationship("Lodge", foreign_keys=[resolved_lodge_id])


class ImportTemplate(BaseModel):
    __tablename__ = "import_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, comment="Nome do template (ex: Ficha GOB)")
    potency = Column(String(100), nullable=True, comment="Potência associada")
    file_type = Column(String(50), nullable=False, default="PDF", comment="PDF, EXCEL, CSV")
    cim_regex = Column(Text, nullable=True, comment="RegEx para encontrar o CIM")
    name_regex = Column(Text, nullable=True, comment="RegEx para encontrar o Nome")
    email_regex = Column(Text, nullable=True, comment="RegEx para encontrar o E-mail")
    degree_regex = Column(Text, nullable=True, comment="RegEx para encontrar o Grau")
    is_active = Column(Boolean, default=True)
