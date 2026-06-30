import enum

from sqlalchemy import (
    JSON,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    Boolean,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship

from app.shared.base_model import BaseModel, DegreeEnum


class SessionTypeEnum(enum.StrEnum):
    ORDINARY = "Ordinária"
    MAGNA = "Magna"
    EXTRAORDINARY = "Extraordinária"


class SessionSubtypeEnum(enum.StrEnum):
    REGULAR = "Regular"
    ADMINISTRATIVE = "Administrativa"
    FINANCE = "Finanças"
    AFFILIATION_REGULARIZATION = "Filiação e Regularização"
    ELECTORAL = "Eleitoral"
    RITUALISTIC_BANQUET = "Banquete Ritualístico"
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


VALID_SESSION_SUBTYPES = {
    SessionTypeEnum.ORDINARY: {
        SessionSubtypeEnum.REGULAR,
        SessionSubtypeEnum.ADMINISTRATIVE,
        SessionSubtypeEnum.FINANCE,
        SessionSubtypeEnum.ELECTORAL,
        SessionSubtypeEnum.CONFERENCE,
        SessionSubtypeEnum.LECTURE,
        SessionSubtypeEnum.FAMILY_COUNCIL,
        SessionSubtypeEnum.EX_OFFICIO_PLACET,
    },
    SessionTypeEnum.MAGNA: {
        SessionSubtypeEnum.INITIATION,
        SessionSubtypeEnum.ELEVATION,
        SessionSubtypeEnum.EXALTATION,
        SessionSubtypeEnum.INSTALLATION,
        SessionSubtypeEnum.INSTALLATION_WORSHIPFUL,
        SessionSubtypeEnum.RITUALISTIC_BANQUET,
        SessionSubtypeEnum.STANDARD_CONSECRATION,
        SessionSubtypeEnum.LODGE_REGULARIZATION,
        SessionSubtypeEnum.TEMPLE_CONSECRATION,
        SessionSubtypeEnum.LOWTON_ADOPTION,
        SessionSubtypeEnum.MATRIMONIAL_CONSECRATION,
        SessionSubtypeEnum.FUNERAL_POMPS,
        SessionSubtypeEnum.AFFILIATION_REGULARIZATION,
    },
    SessionTypeEnum.EXTRAORDINARY: {
        SessionSubtypeEnum.FESTIVE,
        SessionSubtypeEnum.CIVIC_CULTURAL,
        SessionSubtypeEnum.STATUTE_CHANGE,
        SessionSubtypeEnum.RITE_CHANGE,
        SessionSubtypeEnum.ORIENT_CHANGE,
        SessionSubtypeEnum.DISTINCTIVE_TITLE_CHANGE,
        SessionSubtypeEnum.LODGE_MERGER,
        SessionSubtypeEnum.GENERAL_GM_ELECTION,
        SessionSubtypeEnum.STATE_GM_ELECTION,
        SessionSubtypeEnum.DF_GM_ELECTION,
    },
}


class MasonicSession(BaseModel):
    __tablename__ = "masonic_sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    session_number = Column(Integer, nullable=True)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)

    type = Column(SQLAlchemyEnum(SessionTypeEnum, name="session_type_enum"), nullable=True)
    subtype = Column(SQLAlchemyEnum(SessionSubtypeEnum, name="session_subtype_enum"), nullable=True)
    degree = Column(SQLAlchemyEnum(DegreeEnum, name="degree_enum"), nullable=False, default=DegreeEnum.APPRENTICE)

    status = Column(
        SQLAlchemyEnum(
            "PREVISTA", "AGENDADA", "EM_ANDAMENTO", "REALIZADA", "ENCERRADA", "CANCELADA", "SUPRIMIDA",
            name="session_status_enum"
        ),
        nullable=False,
        default="AGENDADA",
    )
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    lodge = relationship("Lodge", backref="masonic_sessions")

    administration_id = Column(Integer, ForeignKey("administrations.id"), nullable=True)
    administration = relationship("Administration", backref="sessions")

    temporary_role_assignments = Column(JSON, nullable=True)

    is_manually_modified = Column(Boolean, default=False, nullable=False, comment="Sessão teve a data alterada manualmente")

    agenda = Column(Text, nullable=True)
    sent_expedients = Column(Text, nullable=True)
    received_expedients = Column(Text, nullable=True)
    study_director_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    study_director = relationship("Member", foreign_keys=[study_director_id])

    attendances = relationship("SessionAttendance", back_populates="session", cascade="all, delete-orphan")
    balaustre_file_path = Column(String(500), nullable=True)


class CheckInMethodEnum(enum.StrEnum):
    MANUAL = "MANUAL"
    QR_CODE = "QR_CODE"
    APP_VISITOR = "APP_VISITOR"
    TOTEM = "TOTEM"


class TrustLevelEnum(enum.StrEnum):
    VERIFICADO = "Verificado"
    CERTIFICADO = "Certificado"


class SessionAttendance(BaseModel):
    __tablename__ = "session_attendances"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=True)
    attendance_status = Column(String(50), nullable=False)
    guests_count = Column(Integer, nullable=False, default=0)
    check_in_datetime = Column(DateTime(timezone=True), nullable=True)
    check_in_method = Column(
        SQLAlchemyEnum(CheckInMethodEnum, name="check_in_method_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    check_in_latitude = Column(Float, nullable=True)
    check_in_longitude = Column(Float, nullable=True)
    session = relationship("MasonicSession", back_populates="attendances")
    member = relationship("Member", backref="session_attendances")
    visitor = relationship("Visitor", backref="session_attendances")


class Visitor(BaseModel):
    __tablename__ = "visitors"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    cim = Column(String(50), unique=True, nullable=False, index=True)
    degree = Column(
        SQLAlchemyEnum(DegreeEnum, name="visitor_degree_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    cpf = Column(String(14), unique=True, nullable=True)
    origin_lodge_id = Column(Integer, nullable=True)
    manual_lodge_name = Column(String(255), nullable=True)
    manual_lodge_number = Column(String(50), nullable=True)
    manual_lodge_obedience = Column(String(100), nullable=True)
    global_visitor_id = Column(String(36), nullable=True, index=True)
    remarks = Column(Text, nullable=True)
    trust_level = Column(
        SQLAlchemyEnum(TrustLevelEnum, name="visitor_trust_level_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TrustLevelEnum.VERIFICADO,
    )


class Visit(BaseModel):
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True, index=True)
    visit_date = Column(Date, nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    home_lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    visited_lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False)

    member = relationship("Member", backref="visits")
    home_lodge = relationship("Lodge", foreign_keys=[home_lodge_id], backref="home_visits")
    visited_lodge = relationship("Lodge", foreign_keys=[visited_lodge_id], backref="visiting_members")
    session = relationship("MasonicSession", backref="visits")

    __table_args__ = (UniqueConstraint("member_id", "session_id", name="_member_session_visit_uc"),)

class LodgeRecess(BaseModel):
    __tablename__ = 'lodge_recesses'
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey('lodges.id'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    description = Column(String(255), nullable=True)

    lodge = relationship('Lodge', backref='recesses')


class AttendanceAuditLog(BaseModel):
    __tablename__ = "attendance_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False, index=True)
    webmaster_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    target_member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    target_visitor_id = Column(Integer, ForeignKey("visitors.id"), nullable=True)
    action = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    
    session = relationship("MasonicSession")
    webmaster = relationship("Member", foreign_keys=[webmaster_id])
    target_member = relationship("Member", foreign_keys=[target_member_id])
    target_visitor = relationship("Visitor", foreign_keys=[target_visitor_id])


class AbsenceJustificationStatusEnum(enum.StrEnum):
    PENDING = "Pendente"
    APPROVED = "Aprovado"
    REJECTED = "Rejeitado"

class AbsenceJustification(BaseModel):
    __tablename__ = "absence_justifications"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False, index=True)
    justification_text = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    status = Column(
        SQLAlchemyEnum(AbsenceJustificationStatusEnum, name="absence_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AbsenceJustificationStatusEnum.PENDING,
    )
    reviewed_by_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    
    session = relationship("MasonicSession", backref="absence_justifications")
    member = relationship("Member", foreign_keys=[member_id], backref="absence_justifications")
    reviewed_by = relationship("Member", foreign_keys=[reviewed_by_id])
    
    __table_args__ = (UniqueConstraint("session_id", "member_id", name="_member_session_absence_uc"),)
