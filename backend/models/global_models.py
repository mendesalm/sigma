import uuid
from sqlalchemy import Column, String, Integer, DateTime, func
from database import Base

class GlobalVisitor(Base):
    """
    Modelo para visitantes globais armazenado no banco oriente_data.
    """
    __tablename__ = "global_visitors"
    # Se necessário especificar schema: __table_args__ = {"schema": "public"}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cim = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    degree = Column(String(50), nullable=False)  # APRENDIZ, COMPANHEIRO, MESTRE, MESTRE_INSTALADO
    
    # Loja de Origem (Pode ser ID de uma loja existente OU dados manuais)
    origin_lodge_id = Column(Integer, nullable=True) 
    manual_lodge_name = Column(String(255), nullable=True)
    manual_lodge_number = Column(String(50), nullable=True)
    manual_lodge_obedience = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
