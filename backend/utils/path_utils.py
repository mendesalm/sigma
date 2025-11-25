from pathlib import Path
from ..config import settings

# The root path for all stored files, configured in config.py
STORAGE_ROOT = Path(settings.STORAGE_BASE_PATH)

def get_tenant_path(id_obediencia: int, id_loja: int, resource_type: str) -> Path:
    """
    Gera e garante a existência do caminho base para recursos de um tenant específico.

    Args:
        id_obediencia (int): O ID da Obediência.
        id_loja (int): O ID da Loja.
        resource_type (str): O tipo de recurso (ex: 'documents', 'images').

    Returns:
        Path: O objeto Path para o diretório de recursos do tenant.
    """
    # Garante que o resource_type seja seguro para nomes de diretórios
    safe_resource_type = "".join(c for c in resource_type if c.isalnum() or c in ('-', '_')).lower()

    tenant_path = STORAGE_ROOT / str(id_obediencia) / str(id_loja) / safe_resource_type
    tenant_path.mkdir(parents=True, exist_ok=True) # Cria o diretório se não existir
    return tenant_path
