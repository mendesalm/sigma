import enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    Integer,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import backref, relationship

from app.shared.base_model import BaseModel
from database import Base


class RoleTypeEnum(enum.StrEnum):
    LODGE = "Loja"
    OBEDIENCE = "Obediência"
    SUBOBEDIENCE = "Subobediência"


class ExceptionTypeEnum(enum.StrEnum):
    GRANT = "Concedida"
    REVOKE = "Revogada"


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


class Role(BaseModel):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    role_type = Column(SQLAlchemyEnum(RoleTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)
    level = Column(Integer, nullable=False, default=1)
    base_credential = Column(Integer, nullable=False, default=10)
    applicable_rites = Column(String(255), nullable=True)
    obediences = relationship("Obedience", secondary=obediences_roles_association, back_populates="roles")
    permissions = relationship("Permission", secondary=roles_permissions, back_populates="roles")
    webmasters = relationship("Webmaster", secondary=webmasters_roles, back_populates="roles")

    __table_args__ = (CheckConstraint("level >= 1 AND level <= 9", name="chk_role_level"),)


class Permission(BaseModel):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255), unique=True, nullable=False)
    description = Column(String(255))
    min_credential = Column(Integer, nullable=False, default=0)
    roles = relationship("Role", secondary=roles_permissions, back_populates="permissions")


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


class MemberPermissionException(BaseModel):
    __tablename__ = "member_permission_exceptions"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=True)
    obedience_id = Column(Integer, ForeignKey("obediences.id"), nullable=True)
    exception_type = Column(
        SQLAlchemyEnum(ExceptionTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False
    )

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
