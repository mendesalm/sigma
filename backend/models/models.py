import enum
import uuid

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
    Table,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import backref, relationship
from database import Base


class BaseModel(Base):
    __abstract__ = True
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# --- ENUMS ---
class ObedienceTypeEnum(str, enum.Enum):
    FEDERAL = "Federal"
    STATE = "Estadual"


class RiteEnum(str, enum.Enum):
    REAA = "Rito Escocês Antigo e Aceito"
    YORK = "Rito York"
    SCHRODER = "Rito Schroder"
    BRAZILIAN = "Rito Brasileiro"
    MODERN = "Rito Moderno"
    ADONHIRAMITE = "Rito Adonhiramita"
    RER = "Rito Escocês Retificado"


class RoleTypeEnum(str, enum.Enum):
    LODGE = "Loja"
    OBEDIENCE = "Obediência"
    SUBOBEDIENCE = "Subobediência"

class RelationshipTypeEnum(str, enum.Enum):
    SPOUSE = "Esposa"
    SON = "Filho"
    DAUGHTER = "Filha"


class DegreeEnum(str, enum.Enum):
    APPRENTICE = "Aprendiz"
    FELLOW = "Companheiro"
    MASTER = "Mestre"
    INSTALLED_MASTER = "Mestre Instalado"


class RegistrationStatusEnum(str, enum.Enum):
    PENDING = "Pendente"
    APPROVED = "Aprovado"
    REJECTED = "Rejeitado"


class ExceptionTypeEnum(str, enum.Enum):
    GRANT = "Concedida"
    REVOKE = "Revogada"


class MemberStatusEnum(str, enum.Enum):
    ACTIVE = "Ativo"
    INACTIVE = "Inativo"
    DISABLED = "Desativado"  # Falecido


class MemberClassEnum(str, enum.Enum):
    REGULAR = "Regular"
    IRREGULAR = "Irregular"
    EMERITUS = "Emérito"
    REMITTED = "Remido"
    HONORARY = "Honorário"


# --- ASSOCIATION TABLES ---
roles_permissions = Table(
    "roles_permissions",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", ForeignKey("permissions.id"), primary_key=True),
)

webmasters_roles = Table(
    "webmasters_roles",
    Base.metadata,
    Column("webmaster_id", ForeignKey("webmasters.id"), primary_key=True),
    Column("role_id", ForeignKey("roles.id"), primary_key=True),
)

obediences_roles_association = Table(
    "obediences_roles_association",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id"), primary_key=True),
    Column("obedience_id", ForeignKey("obediences.id"), primary_key=True),
)

# --- MAIN MODELS ---


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
    roles = relationship("Role", secondary=obediences_roles_association, back_populates="obediences")
    member_associations = relationship(
        "MemberObedienceAssociation", back_populates="obedience", cascade="all, delete-orphan"
    )


class Lodge(BaseModel):
    __tablename__ = "lodges"
    id = Column(Integer, primary_key=True, index=True)
    lodge_name = Column(String(255), nullable=False)
    lodge_title = Column(String(50), nullable=True, default="ARLS")
    lodge_code = Column(String(36), unique=True, index=True, nullable=False)
    lodge_number = Column(String(255))
    foundation_date = Column(Date, nullable=True)
    rite = Column(SQLAlchemyEnum(RiteEnum, values_callable=lambda x: [e.value for e in x]), nullable=True, default=RiteEnum.REAA)
    obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=False)
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
            "Domingo",
            "Segunda-feira",
            "Terça-feira",
            "Quarta-feira",
            "Quinta-feira",
            "Sexta-feira",
            "Sábado",
            name="session_day_enum",
        ),
        nullable=True,
    )
    periodicity = Column(SQLAlchemyEnum("Semanal", "Quinzenal", "Mensal", name="periodicity_enum"), nullable=True)
    session_time = Column(Time, nullable=True)
    obedience = relationship("Obedience", backref="lodges")
    technical_contact_name = Column(String(255), nullable=False)
    technical_contact_email = Column(String(255), nullable=False)
    associations = relationship("MemberLodgeAssociation", back_populates="lodge", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="chk_lodge_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="chk_lodge_longitude"),
        CheckConstraint("user_limit > 0", name="chk_lodge_user_limit"),
    )


class Role(BaseModel):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    role_type = Column(SQLAlchemyEnum(RoleTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)  # Acts as 'scope'
    level = Column(Integer, nullable=False, default=1)  # 1-9 hierarchy
    base_credential = Column(Integer, nullable=False, default=10)  # Base value for calculation
    applicable_rites = Column(String(255), nullable=True)
    obediences = relationship("Obedience", secondary=obediences_roles_association, back_populates="roles")
    permissions = relationship("Permission", secondary=roles_permissions, back_populates="roles")
    webmasters = relationship("Webmaster", secondary=webmasters_roles, back_populates="roles")

    __table_args__ = (
        CheckConstraint("level >= 1 AND level <= 9", name="chk_role_level"),
    )


class Permission(BaseModel):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255), unique=True, nullable=False)
    description = Column(String(255))
    min_credential = Column(Integer, nullable=False, default=0)  # Minimum credential required
    roles = relationship("Role", secondary=roles_permissions, back_populates="permissions")


class SuperAdmin(BaseModel):
    __tablename__ = "super_admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)


class Webmaster(BaseModel):
    __tablename__ = "webmasters"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=True)
    obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=True)

    lodge = relationship("Lodge", backref=backref("webmasters", cascade="all, delete-orphan"))
    obedience = relationship("Obedience", backref=backref("webmasters", cascade="all, delete-orphan"))

    roles = relationship("Role", secondary=webmasters_roles, back_populates="webmasters")

    __table_args__ = (
        CheckConstraint(
            "(lodge_id IS NOT NULL AND obedience_id IS NULL) OR (lodge_id IS NULL AND obedience_id IS NOT NULL)",
            name="chk_webmaster_single_instance",
        ),
    )


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
    zip_code = Column(String(9), nullable=True)
    phone = Column(String(20), nullable=True)
    place_of_birth = Column(String(100), nullable=True)
    nationality = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)

    education_level = Column(String(255), nullable=True)
    occupation = Column(String(255), nullable=True)
    workplace = Column(String(255), nullable=True)
    profile_picture_path = Column(String(255), nullable=True)
    cim = Column(String(50), unique=True, nullable=True, index=True)
    status = Column(String(50), nullable=True, default="Active")
    degree = Column(SQLAlchemyEnum(DegreeEnum, name="degree_enum", values_callable=lambda x: [e.value for e in x]), nullable=True)
    initiation_date = Column(Date, nullable=True)
    elevation_date = Column(Date, nullable=True)
    exaltation_date = Column(Date, nullable=True)
    affiliation_date = Column(Date, nullable=True)
    regularization_date = Column(Date, nullable=True)
    philosophical_degree = Column(String(100), nullable=True)
    registration_status = Column(
        SQLAlchemyEnum(RegistrationStatusEnum, name="registration_status_enum", values_callable=lambda x: [e.value for e in x]), nullable=False, default=RegistrationStatusEnum.PENDING
    )
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
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
    status = Column(SQLAlchemyEnum(MemberStatusEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=MemberStatusEnum.ACTIVE)
    member_class = Column(SQLAlchemyEnum(MemberClassEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=MemberClassEnum.REGULAR)
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


class MemberPermissionException(BaseModel):
    __tablename__ = "member_permission_exceptions"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=True)
    obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=True)
    exception_type = Column(SQLAlchemyEnum(ExceptionTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)

    member = relationship("Member", backref="permission_exceptions")
    permission = relationship("Permission")
    lodge = relationship("Lodge")
    obedience = relationship("Obedience")

    __table_args__ = (
        CheckConstraint(
            "(lodge_id IS NOT NULL AND obedience_id IS NULL) OR (lodge_id IS NULL AND obedience_id IS NOT NULL)",
            name="chk_exception_single_context",
        ),
        UniqueConstraint(
            "member_id", "permission_id", "lodge_id", "obedience_id", name="_member_permission_context_uc"
        ),
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
    relationship_type = Column(SQLAlchemyEnum(RelationshipTypeEnum, name="relationship_type_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
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
    member = relationship("Member", back_populates="role_history")
    role = relationship("Role")
    lodge = relationship("Lodge")

    __table_args__ = (
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="chk_role_history_dates"),
    )



class SessionTypeEnum(str, enum.Enum):
    ORDINARY = "Ordinária"
    MAGNA = "Magna"
    EXTRAORDINARY = "Extraordinária"


class SessionSubtypeEnum(str, enum.Enum):
    # Ordinárias
    REGULAR = "Regular"
    ADMINISTRATIVE = "Administrativa"
    FINANCE = "Finanças"
    AFFILIATION_REGULARIZATION = "Filiação e Regularização"
    ELECTORAL = "Eleitoral"
    RITUALISTIC_BANQUET = "Banquete Ritualístico"
    
    # Magnas
    INITIATION = "Iniciação"
    ELEVATION = "Elevação"
    EXALTATION = "Exaltação"
    INSTALLATION = "Posse"
    INSTALLATION_WORSHIPFUL = "Instalação"
    STANDARD_CONSECRATION = "Sagração de Estandarte"
    LODGE_REGULARIZATION = "Regularização de Loja"
    TEMPLE_CONSECRATION = "Sagração de Templo"
    LOWTON_ADOPTION = "Adoção de Lowtons"
    MATRIMONIAL_CONSECRATION = "Consagração e Exaltação matrimonial"
    FUNERAL_POMPS = "Pompas Fúnebres"
    CONFERENCE = "Conferência"
    LECTURE = "Palestra"
    FESTIVE = "Festiva"
    CIVIC_CULTURAL = "Cívico-cultural"
    
    # Extraordinárias
    GENERAL_GM_ELECTION = "Eleições de Grão-Mestre Geral e Adjuntos"
    STATE_GM_ELECTION = "Eleição de Grão-Mestre Estadual e Adjuntos"
    DF_GM_ELECTION = "Eleição de Grão Mestre do Distrito Federal e Adjuntos"
    FAMILY_COUNCIL = "Conselho de Família"
    EX_OFFICIO_PLACET = "Concessão de placet ex-officio"
    STATUTE_CHANGE = "Alteração de Estatuto"
    RITE_CHANGE = "Mudança de Rito"
    ORIENT_CHANGE = "Mudança de Oriente"
    DISTINCTIVE_TITLE_CHANGE = "Mudança de Título Distintivo"
    LODGE_MERGER = "Fusão ou Incorporação de Lojas"


# Mapeamento de validação de hierarquia
VALID_SESSION_SUBTYPES = {
    SessionTypeEnum.ORDINARY: {
        SessionSubtypeEnum.REGULAR,
        SessionSubtypeEnum.ADMINISTRATIVE,
        SessionSubtypeEnum.FINANCE,
        SessionSubtypeEnum.AFFILIATION_REGULARIZATION,
        SessionSubtypeEnum.ELECTORAL,
        SessionSubtypeEnum.RITUALISTIC_BANQUET,
    },
    SessionTypeEnum.MAGNA: {
        SessionSubtypeEnum.INITIATION,
        SessionSubtypeEnum.ELEVATION,
        SessionSubtypeEnum.EXALTATION,
        SessionSubtypeEnum.INSTALLATION,
        SessionSubtypeEnum.INSTALLATION_WORSHIPFUL,
        SessionSubtypeEnum.STANDARD_CONSECRATION,
        SessionSubtypeEnum.LODGE_REGULARIZATION,
        SessionSubtypeEnum.TEMPLE_CONSECRATION,
        SessionSubtypeEnum.LOWTON_ADOPTION,
        SessionSubtypeEnum.MATRIMONIAL_CONSECRATION,
        SessionSubtypeEnum.FUNERAL_POMPS,
        SessionSubtypeEnum.CONFERENCE,
        SessionSubtypeEnum.LECTURE,
        SessionSubtypeEnum.FESTIVE,
        SessionSubtypeEnum.CIVIC_CULTURAL,
    },
    SessionTypeEnum.EXTRAORDINARY: {
        SessionSubtypeEnum.GENERAL_GM_ELECTION,
        SessionSubtypeEnum.STATE_GM_ELECTION,
        SessionSubtypeEnum.DF_GM_ELECTION,
        SessionSubtypeEnum.FAMILY_COUNCIL,
        SessionSubtypeEnum.EX_OFFICIO_PLACET,
        SessionSubtypeEnum.STATUTE_CHANGE,
        SessionSubtypeEnum.RITE_CHANGE,
        SessionSubtypeEnum.ORIENT_CHANGE,
        SessionSubtypeEnum.DISTINCTIVE_TITLE_CHANGE,
        SessionSubtypeEnum.LODGE_MERGER,
    },
}


class Administration(Base):
    __tablename__ = "administrations"
    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(255), nullable=False) # Ex: "Exercício Maçônico 2025-2027"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=True)
    
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    lodge = relationship("Lodge", backref="administrations")


class MasonicSession(BaseModel):
    __tablename__ = "masonic_sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    session_number = Column(Integer, nullable=True) # Número sequencial no exercício
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    
    type = Column(SQLAlchemyEnum(SessionTypeEnum, name="session_type_enum"), nullable=True)
    subtype = Column(SQLAlchemyEnum(SessionSubtypeEnum, name="session_subtype_enum"), nullable=True)
    
    status = Column(
        SQLAlchemyEnum("AGENDADA", "EM_ANDAMENTO", "REALIZADA", "ENCERRADA","CANCELADA", name="session_status_enum"),
        nullable=False,
        default="AGENDADA",
    )
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    lodge = relationship("Lodge", backref="masonic_sessions")
    
    administration_id = Column(Integer, ForeignKey("administrations.id"), nullable=True)
    administration = relationship("Administration", backref="sessions")
    
    # Novos campos
    agenda = Column(Text, nullable=True)
    sent_expedients = Column(Text, nullable=True)
    received_expedients = Column(Text, nullable=True)
    study_director_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    study_director = relationship("Member", foreign_keys=[study_director_id])

    attendances = relationship("SessionAttendance", back_populates="session", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="session")  # Relacionamento com Documentos



class CheckInMethodEnum(str, enum.Enum):
    MANUAL = "MANUAL"
    QR_CODE = "QR_CODE"
    APP_VISITOR = "APP_VISITOR"


class SessionAttendance(BaseModel):
    __tablename__ = "session_attendances"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=True)
    attendance_status = Column(String(50), nullable=False)
    check_in_datetime = Column(DateTime(timezone=True), nullable=True)
    check_in_method = Column(SQLAlchemyEnum(CheckInMethodEnum, name="check_in_method_enum", values_callable=lambda x: [e.value for e in x]), nullable=True)
    check_in_latitude = Column(Float, nullable=True)
    check_in_longitude = Column(Float, nullable=True)
    session = relationship("MasonicSession", back_populates="attendances")
    member = relationship("Member", backref="session_attendances")
    visitor = relationship("Visitor", backref="session_attendances")


class Visitor(BaseModel):
    __tablename__ = "visitors"
    id = Column(Integer, primary_key=True, index=True)
    
    # Dados pessoais
    full_name = Column(String(255), nullable=False)
    cim = Column(String(50), unique=True, nullable=False, index=True)  # CIM é obrigatório
    degree = Column(SQLAlchemyEnum(DegreeEnum, name="visitor_degree_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    # Contato
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    cpf = Column(String(14), unique=True, nullable=True)  # CPF é opcional
    
    # Loja de Origem (estruturada ou manual)
    origin_lodge_id = Column(Integer, nullable=True)  # ID da loja se for do Sigma
    manual_lodge_name = Column(String(255), nullable=True)  # Nome manual se não for do Sigma
    manual_lodge_number = Column(String(50), nullable=True)
    manual_lodge_obedience = Column(String(100), nullable=True)
    
    # ID global para sincronização (se vier do banco global)
    global_visitor_id = Column(String(36), nullable=True, index=True)
    
    remarks = Column(Text, nullable=True)


class Calendar(BaseModel):
    __tablename__ = "calendars"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    # Ensuring multitenancy by associating with a lodge
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
    # Ensuring multitenancy by associating with a lodge
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    lodge = relationship("Lodge", backref="events")
    # Link to a specific calendar (optional)
    calendar_id = Column(Integer, ForeignKey("calendars.id"), nullable=True)
    calendar = relationship("Calendar", backref="events")

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="chk_event_dates"),
    )


class FinancialTransaction(BaseModel):
    __tablename__ = "financial_transactions"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # e.g., "debit", "credit"
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    # Ensuring multitenancy by associating with a lodge
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    member = relationship("Member", backref="financial_transactions")
    lodge = relationship("Lodge", backref="financial_transactions")

    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_transaction_amount_positive"),
        CheckConstraint("transaction_type IN ('debit', 'credit')", name="chk_transaction_type"),
    )


class Document(BaseModel):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=True, index=True)  # e.g. BALAUSTRE, EDITAL
    file_path = Column(String(512), nullable=False)  # Path to the stored file
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    # Ensuring multitenancy by associating with a lodge
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    uploaded_by_member_id = Column(Integer, ForeignKey("members.id"), nullable=True)  # Optional: who uploaded it
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=True, index=True)  # Link to a session
    lodge = relationship("Lodge", backref="documents")
    uploaded_by = relationship("Member", backref="uploaded_documents")
    session = relationship("MasonicSession", back_populates="documents")  # Back-populates from MasonicSession


class Visit(BaseModel):
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True, index=True)
    visit_date = Column(Date, nullable=False, index=True)

    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    home_lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)  # Loja de origem do membro
    visited_lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)  # Loja que foi visitada
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False)

    member = relationship("Member", backref="visits")
    home_lodge = relationship("Lodge", foreign_keys=[home_lodge_id], backref="home_visits")
    visited_lodge = relationship("Lodge", foreign_keys=[visited_lodge_id], backref="visiting_members")
    session = relationship("MasonicSession", backref="visits")

    __table_args__ = (UniqueConstraint("member_id", "session_id", name="_member_session_visit_uc"),)


class Notice(BaseModel):
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    expiration_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    lodge = relationship("Lodge", backref="notices")


class PublicationTypeEnum(str, enum.Enum):
    REGULATIONS = "Regulamentos"
    ACTS = "Atos"
    DOCUMENTS = "Documentos"
    BULLETINS = "Boletins"
    ARTICLE = "Artigos"


class PublicationStatusEnum(str, enum.Enum):
    DRAFT = "Rascunho"
    PENDING = "Pendente"
    PUBLISHED = "Publicado"
    REJECTED = "Rejeitado"
    ARCHIVED = "Arquivado"


class Publication(BaseModel):
    __tablename__ = "publications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True) # Description/Observations
    file_path = Column(String(512), nullable=False) # Path to PDF file
    file_size = Column(Integer, nullable=True) # Size in bytes
    
    type = Column(SQLAlchemyEnum(PublicationTypeEnum, name="publication_type_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    status = Column(SQLAlchemyEnum(PublicationStatusEnum, name="publication_status_enum", values_callable=lambda x: [e.value for e in x]), nullable=False, default=PublicationStatusEnum.PUBLISHED)
    
    author_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(Date, nullable=True)
    
    author = relationship("Member", backref="publications")
    lodge = relationship("Lodge", backref="publications")


class Classified(BaseModel):
    __tablename__ = "classifieds"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=True)
    contact_info = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    
    # Endereço
    street = Column(String(255), nullable=True)
    number = Column(String(50), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(9), nullable=True)
    
    status = Column(String(50), default="ACTIVE")  # ACTIVE, EXPIRED
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
    position = Column(String(50), nullable=False)  # e.g., "3º", "4º"
    
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    
    lodge = relationship("Lodge", backref="dining_scales")
    member = relationship("Member", backref="dining_scales")


class DocumentTemplate(BaseModel):
    __tablename__ = "document_templates"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), unique=True, nullable=False)  # 'BALAUSTRE', 'EDITAL'
    content = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class DocumentSignature(BaseModel):
    __tablename__ = "document_signatures"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, unique=True)
    signature_hash = Column(String(64), unique=True, nullable=False, index=True) # SHA256
    signed_at = Column(DateTime(timezone=True), server_default=func.now())
    signed_by_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    
    document = relationship("Document", backref=backref("signature", uselist=False))
    signed_by = relationship("Member")


class CommitteeTypeEnum(str, enum.Enum):
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
    
    # Relationships
    lodge = relationship("Lodge", backref="committees")
    president = relationship("Member", foreign_keys=[president_id])
    members = relationship("CommitteeMember", back_populates="committee", cascade="all, delete-orphan")


class CommitteeMember(BaseModel):
    __tablename__ = "committee_members"

    id = Column(Integer, primary_key=True, index=True)
    committee_id = Column(Integer, ForeignKey("committees.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    role = Column(String(50), default="Membro") # Presidente, Membro

    committee = relationship("Committee", back_populates="members")
    member = relationship("Member")

