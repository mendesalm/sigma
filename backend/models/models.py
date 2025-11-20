from sqlalchemy import (Column, Integer, String, Boolean, DateTime, Enum as SQLAlchemyEnum, Time,
                        Text, ForeignKey, func, Date, Table, Float, UniqueConstraint, CheckConstraint)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
import uuid

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# --- ENUMS ---
class ObedienceTypeEnum(str, enum.Enum):
    FEDERAL = "Federal"
    STATE = "State"

class RiteEnum(str, enum.Enum):
    REAA = "REAA"
    YORK = "YORK"
    SCHRODER = "Schroder"
    BRAZILIAN = "Brazilian"
    MODERN = "Modern"

class RoleTypeEnum(str, enum.Enum):
    RITUALISTIC = "Ritualistic"
    OBEDIENCE = "Obedience"

class RelationshipTypeEnum(str, enum.Enum):
    SPOUSE = "Spouse"
    SON = "Son"
    DAUGHTER = "Daughter"

class DegreeEnum(str, enum.Enum):
    APPRENTICE = "Apprentice"
    FELLOW = "Fellow"
    MASTER = "Master"
    INSTALLED_MASTER = "Installed Master"

class RegistrationStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


# --- ASSOCIATION TABLES ---
roles_permissions = Table(
    'roles_permissions',
    Base.metadata,
    Column('role_id', ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', ForeignKey('permissions.id'), primary_key=True)
)

webmasters_roles = Table(
    'webmasters_roles',
    Base.metadata,
    Column('webmaster_id', ForeignKey('webmasters.id'), primary_key=True),
    Column('role_id', ForeignKey('roles.id'), primary_key=True)
)

obediences_roles_association = Table(
    'obediences_roles_association',
    Base.metadata,
    Column('role_id', ForeignKey('roles.id'), primary_key=True),
    Column('obedience_id', ForeignKey('obediences.id'), primary_key=True)
)

# --- MAIN MODELS ---

class Obedience(BaseModel):
    __tablename__ = "obediences"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    acronym = Column(String(50), unique=True, nullable=True)
    type = Column(SQLAlchemyEnum(ObedienceTypeEnum), nullable=False)
    parent_obedience_id = Column(Integer, ForeignKey('obediences.id'), nullable=True)
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
    roles = relationship("Role", secondary=obediences_roles_association, back_populates="obediences")
    member_associations = relationship("MemberObedienceAssociation", back_populates="obedience", cascade="all, delete-orphan")

class Lodge(BaseModel):
    __tablename__ = "lodges"
    id = Column(Integer, primary_key=True, index=True)
    lodge_name = Column(String(255), nullable=False)
    lodge_code = Column(String(32), unique=True, index=True, nullable=False)
    lodge_number = Column(String(255))
    foundation_date = Column(Date, nullable=True)
    rite = Column(SQLAlchemyEnum(RiteEnum), nullable=True)
    obedience_id = Column(Integer, ForeignKey('obediences.id'), nullable=False)
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
    custom_domain = Column(String(255), unique=True)
    plan = Column(String(255))
    user_limit = Column(Integer)
    is_active = Column(Boolean, default=True)
    status = Column(String(255))
    session_day = Column(SQLAlchemyEnum('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', name='session_day_enum'))
    periodicity = Column(SQLAlchemyEnum('Weekly', 'Biweekly', 'Monthly', name='periodicity_enum'))
    session_time = Column(Time)
    obedience = relationship("Obedience", backref="lodges")
    technical_contact_name = Column(String(255), nullable=False)
    technical_contact_email = Column(String(255), nullable=False)
    associations = relationship("MemberLodgeAssociation", back_populates="lodge", cascade="all, delete-orphan")

class Role(BaseModel):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    role_type = Column(SQLAlchemyEnum(RoleTypeEnum), nullable=False)
    applicable_rites = Column(String(255), nullable=True)
    obediences = relationship("Obedience", secondary=obediences_roles_association, back_populates="roles")
    permissions = relationship("Permission", secondary=roles_permissions, back_populates="roles")
    webmasters = relationship("Webmaster", secondary=webmasters_roles, back_populates="roles")

class Permission(BaseModel):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255), unique=True, nullable=False)
    description = Column(String(255))
    roles = relationship("Role", secondary=roles_permissions, back_populates="permissions")

class SuperAdmin(BaseModel):
    __tablename__ = "super_admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

class Webmaster(BaseModel):
    __tablename__ = 'webmasters'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

    lodge_id = Column(Integer, ForeignKey('lodges.id'), nullable=True)
    obedience_id = Column(Integer, ForeignKey('obediences.id'), nullable=True)

    lodge = relationship('Lodge', backref='webmasters')
    obedience = relationship('Obedience', backref='webmasters')

    roles = relationship("Role", secondary=webmasters_roles, back_populates="webmasters")

    __table_args__ = (
        CheckConstraint(
            '(lodge_id IS NOT NULL AND obedience_id IS NULL) OR (lodge_id IS NULL AND obedience_id IS NOT NULL)',
            name='chk_webmaster_single_instance'
        ),
    )

class Member(BaseModel):
    __tablename__ = 'members'
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
    zip_code = Column(String(9), nullable=True)
    phone = Column(String(20), nullable=True)
    place_of_birth = Column(String(100), nullable=True)
    nationality = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)
    fathers_name = Column(String(255), nullable=True)
    mothers_name = Column(String(255), nullable=True)
    education_level = Column(String(255), nullable=True)
    occupation = Column(String(255), nullable=True)
    workplace = Column(String(255), nullable=True)
    profile_picture_path = Column(String(255), nullable=True)
    cim = Column(String(50), unique=True, nullable=True, index=True)
    status = Column(String(50), nullable=True, default='Active')
    degree = Column(SQLAlchemyEnum(DegreeEnum, name='degree_enum'), nullable=True)
    initiation_date = Column(Date, nullable=True)
    elevation_date = Column(Date, nullable=True)
    exaltation_date = Column(Date, nullable=True)
    affiliation_date = Column(Date, nullable=True)
    regularization_date = Column(Date, nullable=True)
    philosophical_degree = Column(String(100), nullable=True)
    registration_status = Column(SQLAlchemyEnum(RegistrationStatusEnum, name='registration_status_enum'), nullable=False, default='Pending')
    last_login = Column(DateTime(timezone=True), nullable=True)
    lodge_associations = relationship("MemberLodgeAssociation", back_populates="member", cascade="all, delete-orphan")
    obedience_associations = relationship("MemberObedienceAssociation", back_populates="member", cascade="all, delete-orphan")

class MemberLodgeAssociation(BaseModel):
    __tablename__ = 'member_lodge_associations'
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey('members.id'), nullable=False)
    lodge_id = Column(Integer, ForeignKey('lodges.id'), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    member = relationship("Member", back_populates="lodge_associations")
    lodge = relationship("Lodge", back_populates="associations")
    role = relationship("Role")
    __table_args__ = (UniqueConstraint('member_id', 'lodge_id', name='_member_lodge_uc'),)


class MemberObedienceAssociation(BaseModel):
    __tablename__ = 'member_obedience_associations'
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey('members.id'), nullable=False)
    obedience_id = Column(Integer, ForeignKey('obediences.id'), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    member = relationship("Member", back_populates="obedience_associations")
    obedience = relationship("Obedience", back_populates="member_associations")
    role = relationship("Role")
    __table_args__ = (UniqueConstraint('member_id', 'obedience_id', name='_member_obedience_uc'),)


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
    member = relationship("Member", backref="decorations")

class FamilyMember(BaseModel):
    __tablename__ = "family_members"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    relationship_type = Column(SQLAlchemyEnum(RelationshipTypeEnum, name='relationship_type_enum'), nullable=False)
    birth_date = Column(Date, nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    is_deceased = Column(Boolean, default=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    member = relationship("Member", backref="family_members")

class RoleHistory(BaseModel):
    __tablename__ = "role_history"
    id = Column(Integer, primary_key=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    member = relationship("Member", backref="role_history")
    role = relationship("Role", backref="member_role_history")

class MasonicSession(BaseModel):
    __tablename__ = "masonic_sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    lodge = relationship("Lodge", backref="masonic_sessions")
    attendances = relationship("SessionAttendance", back_populates="session", cascade="all, delete-orphan")

class SessionAttendance(BaseModel):
    __tablename__ = "session_attendances"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=True)
    attendance_status = Column(String(50), nullable=False)
    check_in_datetime = Column(DateTime(timezone=True), nullable=True)
    session = relationship("MasonicSession", back_populates="attendances")
    member = relationship("Member", backref="session_attendances")
    visitor = relationship("Visitor", backref="session_attendances")

class Visitor(BaseModel):
    __tablename__ = "visitors"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    cpf = Column(String(14), unique=True, nullable=True)
    origin_lodge = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
