import enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship

from app.shared.base_model import BaseModel


class DocumentStatusEnum(enum.StrEnum):
    DRAFT = "DRAFT"
    PENDING_SIGNATURES = "PENDING_SIGNATURES"
    FINALIZED = "FINALIZED"


class GlobalDocumentTemplate(BaseModel):
    __tablename__ = "global_document_templates"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), unique=True, nullable=False)
    html_content = Column(Text, nullable=False)
    header_html = Column(Text, nullable=True)
    footer_html = Column(Text, nullable=True)
    placeholders_schema = Column(JSON, nullable=True)

    page_settings_json = Column(JSON, nullable=True)
    structural_elements_json = Column(JSON, nullable=True)
    element_configs_json = Column(JSON, nullable=True)


class LocalDocumentTemplate(BaseModel):
    __tablename__ = "local_document_templates"
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)
    custom_html_content = Column(Text, nullable=True)
    custom_header = Column(Text, nullable=True)
    custom_footer = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    page_settings_json = Column(JSON, nullable=True)
    structural_elements_json = Column(JSON, nullable=True)
    element_configs_json = Column(JSON, nullable=True)

    lodge = relationship("Lodge", backref="local_document_templates")

    __table_args__ = (UniqueConstraint("lodge_id", "document_type", name="_lodge_document_type_uc"),)


class DocumentInstance(BaseModel):
    __tablename__ = "document_instances"
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=True, index=True)
    document_type = Column(String(50), nullable=False)
    status = Column(
        SQLAlchemyEnum(DocumentStatusEnum, name="document_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DocumentStatusEnum.DRAFT,
    )
    draft_html_content = Column(Text, nullable=True)
    final_html_content = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("members.id"), nullable=True)

    element_text_overrides = Column(
        JSON,
        nullable=True,
        comment='Adequações de texto por elemento: {"assunto": "Texto adequado...", "texto": "<p>..."}',
    )

    lodge = relationship("Lodge", backref="document_instances")
    session = relationship("MasonicSession", backref="document_instances")
    created_by = relationship("Member", backref="created_documents")


class DocumentSignature(BaseModel):
    __tablename__ = "document_signatures"
    id = Column(Integer, primary_key=True, index=True)
    document_instance_id = Column(Integer, ForeignKey("document_instances.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    role = Column(String(100), nullable=False)
    signed_at = Column(DateTime(timezone=True), server_default=func.now())
    digital_hash = Column(String(64), unique=True, nullable=False, index=True)

    document_instance = relationship("DocumentInstance", backref="signatures")
    member = relationship("Member", backref="document_signatures")


class Document(BaseModel):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    document_type = Column(String(50), nullable=True, index=True)
    file_path = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    uploaded_by_member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("masonic_sessions.id"), nullable=True, index=True)

    lodge = relationship("Lodge", backref="documents")
    uploaded_by = relationship("Member", backref="uploaded_documents")
    session = relationship("MasonicSession", back_populates="documents")
