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
    func,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship

from app.shared.base_model import BaseModel, DegreeEnum


class BookConditionEnum(enum.StrEnum):
    NEW = "Novo"
    GOOD = "Bom"
    FAIR = "Regular"
    POOR = "Ruim"

class ItemStatusEnum(enum.StrEnum):
    AVAILABLE = "Disponível"
    LOANED = "Emprestado"
    RESERVED = "Reservado"
    LOST = "Extraviado"


class LoanStatusEnum(enum.StrEnum):
    ACTIVE = "Ativo"
    RETURNED = "Devolvido"
    LATE = "Atrasado"


class WaitlistStatusEnum(enum.StrEnum):
    WAITING = "Aguardando"
    NOTIFIED = "Notificado"
    FULFILLED = "Atendido"
    CANCELED = "Cancelado"
    EXPIRED = "Expirado"


class PublicationTypeEnum(enum.StrEnum):
    REGULATIONS = "Regulamentos"
    ACTS = "Atos"
    DOCUMENTS = "Documentos"
    BULLETINS = "Boletins"
    ARTICLE = "Artigo"


class PublicationStatusEnum(enum.StrEnum):
    DRAFT = "Rascunho"
    PENDING = "Pendente"
    PUBLISHED = "Publicado"
    REJECTED = "Rejeitado"
    ARCHIVED = "Arquivado"


class Book(BaseModel):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(50), unique=True, nullable=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    publisher = Column(String(255), nullable=True)
    publish_year = Column(Integer, nullable=True)
    pages = Column(Integer, nullable=True)
    cover_url = Column(String(512), nullable=True)
    synopsis = Column(Text, nullable=True)
    required_degree = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint("required_degree >= 1 AND required_degree <= 3", name="chk_book_required_degree"),
    )


class LibraryItem(BaseModel):
    __tablename__ = "library_items"
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    inventory_code = Column(String(100), nullable=True)
    condition = Column(
        SQLAlchemyEnum(BookConditionEnum, name="book_condition_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=BookConditionEnum.GOOD,
    )
    status = Column(
        SQLAlchemyEnum(ItemStatusEnum, name="item_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ItemStatusEnum.AVAILABLE,
    )
    book = relationship("Book", backref="items")
    lodge = relationship("Lodge", backref="library_items")


class Loan(BaseModel):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("library_items.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    loan_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False)
    return_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        SQLAlchemyEnum(LoanStatusEnum, name="loan_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=LoanStatusEnum.ACTIVE,
    )
    item = relationship("LibraryItem", backref="loans")
    member = relationship("Member", backref="loans")

    __table_args__ = (CheckConstraint("due_date > loan_date", name="chk_loan_dates"),)


class Waitlist(BaseModel):
    __tablename__ = "waitlists"
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    request_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(
        SQLAlchemyEnum(WaitlistStatusEnum, name="waitlist_status_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=WaitlistStatusEnum.WAITING,
    )
    notification_date = Column(DateTime(timezone=True), nullable=True)
    expiration_date = Column(DateTime(timezone=True), nullable=True)

    book = relationship("Book", backref="waitlists")
    lodge = relationship("Lodge", backref="waitlists")
    member = relationship("Member", backref="waitlists")


class Publication(BaseModel):
    __tablename__ = "publications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=True)
    type = Column(
        SQLAlchemyEnum(
            PublicationTypeEnum, name="publication_type_enum", values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False,
    )
    status = Column(
        SQLAlchemyEnum(
            PublicationStatusEnum, name="publication_status_enum", values_callable=lambda x: [e.value for e in x]
        ),
        nullable=False,
        default=PublicationStatusEnum.PUBLISHED,
    )
    author_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    valid_until = Column(Date, nullable=True)
    minimum_degree = Column(SQLAlchemyEnum(DegreeEnum, name="degree_enum", create_type=False), nullable=False, default=DegreeEnum.APPRENTICE)

    author = relationship("Member", backref="publications")
    lodge = relationship("Lodge", backref="publications")


class NoticeTypeEnum(enum.StrEnum):
    AVISO = "Aviso"
    NOTICIA = "Notícia"


class Notice(BaseModel):
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    expiration_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    type = Column(
        SQLAlchemyEnum(NoticeTypeEnum, name="notice_type_enum", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=NoticeTypeEnum.AVISO,
    )
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    publication_id = Column(Integer, ForeignKey("publications.id"), nullable=True)

    lodge = relationship("Lodge", backref="notices")
    publication = relationship("Publication", backref="linked_notices")
