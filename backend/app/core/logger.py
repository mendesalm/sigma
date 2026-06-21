import logging
import json
import traceback
import contextvars
from datetime import datetime, timezone

# Variáveis de contexto para amarrar os logs à requisição atual
trace_id_var = contextvars.ContextVar("trace_id", default=None)
tenant_id_var = contextvars.ContextVar("tenant_id", default=None)

class JSONFormatter(logging.Formatter):
    """
    Formatador customizado para garantir que toda saída de log do sistema
    seja um JSON válido, facilitando a ingestão por ferramentas de monitoramento.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "trace_id": trace_id_var.get(),
            "tenant_id": tenant_id_var.get()
        }
        
        # Anexar stack trace se houver exceção
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            log_record["stack_trace"] = traceback.format_exc()
            
        # Adicionar campos extras passados no extra={}
        if hasattr(record, "extra_data"):
            log_record.update(record.extra_data)
            
        return json.dumps(log_record)

def setup_logger(name: str = "sigma_api") -> logging.Logger:
    """
    Configura e retorna o logger principal da aplicação.
    """
    _logger = logging.getLogger(name)
    
    # Evitar duplicação de handlers se já estiver configurado
    if not _logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        _logger.addHandler(handler)
        _logger.setLevel(logging.INFO)
        
    return _logger

# Instância global do logger
logger = setup_logger()
get_logger = logging.getLogger

