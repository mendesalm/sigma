from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base
from config.settings import settings

# Cria o engine do SQLAlchemy usando a URL do arquivo de configuração
engine = create_engine(settings.DATABASE_URL)

# Cria uma fábrica de sessões
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependência do FastAPI para obter a sessão do banco de dados
def get_db():
    """
    Cria e fornece uma sessão de banco de dados por requisição.
    Garante que a sessão seja sempre fechada após o uso.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
