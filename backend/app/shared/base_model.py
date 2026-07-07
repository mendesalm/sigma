import enum

from sqlalchemy import Column, DateTime, func

from database import Base


class BaseModel(Base):
    __abstract__ = True
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Common Enums that are used across multiple modules
class RiteEnum(enum.StrEnum):
    REAA = "Rito Escocês Antigo e Aceito"
    YORK = "Rito York"
    SCHRODER = "Rito Schroder"
    BRAZILIAN = "Rito Brasileiro"
    MODERN = "Rito Moderno"
    ADONHIRAMITE = "Rito Adonhiramita"
    RER = "Rito Escocês Retificado"


