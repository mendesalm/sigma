from sqlalchemy import Column, Integer, String
from database import Base

class ExternalLodge(Base):
    """
    Modelo mapeado para a tabela existente 'general_list_of_lodges' no banco oriente_data.
    Esta tabela é somente leitura para o Sigma.
    """
    __tablename__ = "general_list_of_lodges"
    # Se estiver em outro schema, descomente:
    # __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    name = Column(String)
    number = Column(String)
    obedience = Column(String)
    city = Column(String)
    state = Column(String)
    
    # Adicione outros campos conforme existam na tabela real
