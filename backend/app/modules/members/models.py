import enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship

from app.shared.base_model import BaseModel


class RelationshipTypeEnum(enum.StrEnum):
    SPOUSE = "Esposa"
    SON = "Filho"
    DAUGHTER = "Filha"
    FATHER = "Pai"
    MOTHER = "Mãe"


class RegistrationStatusEnum(enum.StrEnum):
    PENDING = "Pendente"
    APPROVED = "Aprovado"
    REJECTED = "Rejeitado"


class MemberStatusEnum(enum.StrEnum):
    ACTIVE = "Ativo"
    INACTIVE = "Inativo"
    DISABLED = "Desativado"


class MemberClassEnum(enum.StrEnum):
    REGULAR = "Regular"
    IRREGULAR = "Irregular"
    EMERITUS = "Emérito"
    REMITTED = "Remido"
    HONORARY = "Honorário"


class Member(BaseModel):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    cpf = Column(String(14), unique=True, nullable=True, index=True)
    identity_document = Column(String(50), nullable=True)
    birth_date = Column(Date, nullable=True)
    marriage_date = Column(Date, nullable=True)
    street_address = Column(String(255), nullable=True)
    street_number = Column(String(50), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(9), nullable=True)
    phone = Column(String(20), nullable=True)
    place_of_birth = Column(String(100), nullable=True)
    nationality = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)
    education_level = Column(String(255), nullable=True)
    occupation = Column(String(255), nullable=True)
    workplace = Column(String(255), nullable=True)
    profile_picture_path = Column(String(255), nullable=True)
    cim = Column(String(50), unique=False, nullable=True, index=True)
    status = Column(String(50), nullable=True, default="Active")
    degree = Column(Integer, nullable=False, default=1, comment="Grau Maçônico (1 a 33)")
    is_installed = Column(Boolean, nullable=False, default=False, comment="Flag de Mestre Instalado")
    initiation_date = Column(Date, nullable=True)
    elevation_date = Column(Date, nullable=True)
    exaltation_date = Column(Date, nullable=True)
    installation_date = Column(Date, nullable=True)
    affiliation_date = Column(Date, nullable=True)
    regularization_date = Column(Date, nullable=True)
    registration_status = Column(
        SQLAlchemyEnum(
            RegistrationStatusEnum, name="registration_status_enum", values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False,
        default=RegistrationStatusEnum.PENDING,
    )
    last_login = Column(DateTime(timezone=True), nullable=True)

    lodge_associations = relationship("MemberLodgeAssociation", back_populates="member", cascade="all, delete-orphan")
    obedience_associations = relationship(
        "MemberObedienceAssociation", back_populates="member", cascade="all, delete-orphan"
    )
    family_members = relationship("FamilyMember", back_populates="member", cascade="all, delete-orphan")
    decorations = relationship("Decoration", back_populates="member", cascade="all, delete-orphan")
    role_history = relationship("RoleHistory", back_populates="member", cascade="all, delete-orphan")


class MemberLodgeAssociation(BaseModel):
    __tablename__ = "member_lodge_associations"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(
        SQLAlchemyEnum(MemberStatusEnum, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MemberStatusEnum.ACTIVE,
    )
    member_class = Column(
        SQLAlchemyEnum(MemberClassEnum, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MemberClassEnum.REGULAR,
    )
    member = relationship("Member", back_populates="lodge_associations")
    lodge = relationship("Lodge", back_populates="associations")

    __table_args__ = (
        UniqueConstraint("member_id", "lodge_id", name="_member_lodge_uc"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="chk_lodge_assoc_dates"),
    )


class MemberObedienceAssociation(BaseModel):
    __tablename__ = "member_obedience_associations"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    member = relationship("Member", back_populates="obedience_associations")
    obedience = relationship("Obedience", back_populates="member_associations")
    role = relationship("Role")

    __table_args__ = (
        UniqueConstraint("member_id", "obedience_id", name="_member_obedience_uc"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="chk_obedience_assoc_dates"),
    )


class AdministrativeProcess(BaseModel):
    __tablename__ = "administrative_processes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    lodge = relationship("Lodge", backref="administrative_processes")


class Decoration(BaseModel):
    __tablename__ = "decorations"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    award_date = Column(Date, nullable=False)
    remarks = Column(Text, nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    member = relationship("Member", back_populates="decorations")


class FamilyMember(BaseModel):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    relationship_type = Column(
        SQLAlchemyEnum(
            RelationshipTypeEnum, name="relationship_type_enum", values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False,
    )
    birth_date = Column(Date, nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    is_deceased = Column(Boolean, default=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    member = relationship("Member", back_populates="family_members")


class RoleHistory(BaseModel):
    __tablename__ = "role_history"
    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    administration_id = Column(Integer, ForeignKey("administrations.id"), nullable=True)

    member = relationship("Member", back_populates="role_history")
    role = relationship("Role")
    lodge = relationship("Lodge")
    administration = relationship("Administration", backref="role_histories")

    __table_args__ = (CheckConstraint("end_date IS NULL OR end_date >= start_date", name="chk_role_history_dates"),)
