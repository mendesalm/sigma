from pathlib import Path
import re
from sqlalchemy.orm import Session

from config import settings

# The root path for all stored files, configured in config.py
STORAGE_ROOT = Path(settings.STORAGE_BASE_PATH)

def slugify(value: str) -> str:
    """Converts a string to a URL/path friendly slug."""
    import unicodedata
    value = str(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = value.lower()
    value = re.sub(r'[^\w\s-]', '', value)
    return re.sub(r'[-\s]+', '-', value).strip('-_')

def get_tenant_path(id_obediencia: int, id_loja: int, resource_type: str) -> Path:
    """
    Gera e garante a existência do caminho base para recursos de um tenant específico.
    (Mantido para compatibilidade reversa)
    """
    safe_resource_type = "".join(c for c in resource_type if c.isalnum() or c in ("-", "_")).lower()
    tenant_path = STORAGE_ROOT / "lodges" / str(id_loja) / safe_resource_type
    tenant_path.mkdir(parents=True, exist_ok=True)
    return tenant_path

def get_tenant_path_for_lodge(db: Session, lodge_id: int, resource_type: str) -> Path:
    """
    Gera dinamicamente o caminho da Loja baseado em suas hierarquias.
    Ex: storage/potencias/gob/subpotencias/gob-go/lojas/loja2181/assets
    Implementa "Lazy Loading": as pastas só são criadas quando esta função é chamada.
    """
    from app.modules.core.models import Lodge
    
    lodge = db.query(Lodge).filter(Lodge.id == lodge_id).first()
    if not lodge:
        raise ValueError(f"Loja com id {lodge_id} não encontrada")
        
    potency_slug = "unknown_potency"
    if lodge.obedience:
        potency_slug = slugify(lodge.obedience.acronym or lodge.obedience.name)
        
    subpotency_slug = None
    if lodge.subobedience:
        subpotency_slug = slugify(lodge.subobedience.acronym or lodge.subobedience.name)
        
    if lodge.lodge_number:
        safe_lodge_number = "".join(c for c in lodge.lodge_number if c.isalnum() or c in ("-", "_")).strip().lower()
        lodge_folder = f"loja{safe_lodge_number}"
    else:
        lodge_folder = f"loja_id_{lodge.id}"
        
    safe_resource_type = "".join(c for c in resource_type if c.isalnum() or c in ("-", "_")).lower()
    
    if subpotency_slug:
        tenant_path = STORAGE_ROOT / "potencias" / potency_slug / "subpotencias" / subpotency_slug / "lojas" / lodge_folder / safe_resource_type
    else:
        tenant_path = STORAGE_ROOT / "potencias" / potency_slug / "lojas" / lodge_folder / safe_resource_type
        
    tenant_path.mkdir(parents=True, exist_ok=True)
    return tenant_path
