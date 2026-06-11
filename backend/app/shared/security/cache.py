import logging
from typing import Dict, Optional
import threading

logger = logging.getLogger(__name__)

class PermissionCache:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(PermissionCache, cls).__new__(cls)
                cls._instance._permissions: Dict[str, int] = {}
                cls._instance._is_loaded = False
        return cls._instance
        
    def load_all_permissions(self, db_session):
        """
        Carrega todas as permissões do banco de dados para a memória (RAM).
        Deve ser chamado no evento de startup da aplicação FastAPI.
        """
        # Lazy import para evitar import circular
        from models.models import Permission
        
        try:
            permissions = db_session.query(Permission).all()
            new_cache = {}
            for p in permissions:
                new_cache[p.action] = p.min_credential
            
            with self._lock:
                self._permissions = new_cache
                self._is_loaded = True
                
            logger.info(f"Cache de permissões carregado. Total: {len(self._permissions)} permissões.")
        except Exception as e:
            logger.error(f"Erro ao carregar permissões para o cache: {e}")
            raise
            
    def get_min_credential(self, action: str) -> Optional[int]:
        """
        Retorna a credencial mínima de uma ação específica.
        Se o cache ainda não estiver carregado, loga um aviso.
        Retorna None se a ação não for encontrada.
        """
        if not self._is_loaded:
            logger.warning("PermissionCache acessado antes de ser carregado! Retornando None.")
            return None
        return self._permissions.get(action)

# Singleton global instance
permission_cache = PermissionCache()
