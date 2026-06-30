import httpx
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class EvolutionAPIClient:
    def __init__(self):
        self.base_url = os.getenv("EVOLUTION_API_URL", "http://evolution_api:8080")
        self.api_key = os.getenv("EVOLUTION_API_KEY", "sigma_secret_key_123")
        self.instance_name = os.getenv("EVOLUTION_INSTANCE_NAME", "sigma_central")
        self.headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }

    async def send_message(self, remote_jid: str, text: str, delay: int = 1000) -> bool:
        """
        Envia uma mensagem de texto via Evolution API.
        
        Args:
            remote_jid: O número de destino com o sufixo (ex: 5511999999999@s.whatsapp.net ou 120363@g.us para grupos)
            text: O conteúdo da mensagem
            delay: Tempo simulado de digitação
        """
        url = f"{self.base_url}/message/sendText/{self.instance_name}"
        payload = {
            "number": remote_jid,
            "text": text,
            "delay": delay
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                logger.info(f"Mensagem enviada com sucesso para {remote_jid}")
                return True
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem via Evolution API: {e}")
            return False
            
    async def reply_message(self, remote_jid: str, text: str, message_id: str, delay: int = 1000, mentions: Optional[list[str]] = None) -> bool:
        """
        Envia uma mensagem de texto respondendo a uma mensagem específica ("bump").
        """
        url = f"{self.base_url}/message/sendText/{self.instance_name}"
        options = {
            "quoted": {
                "key": {
                    "id": message_id
                }
            }
        }
        
        if mentions:
            options["mentions"] = {
                "everyOne": False,
                "mentioned": mentions
            }
            
        payload = {
            "number": remote_jid,
            "text": text,
            "delay": delay,
            "options": options
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                logger.info(f"Resposta enviada com sucesso para {remote_jid}")
                return True
        except Exception as e:
            logger.error(f"Erro ao enviar resposta via Evolution API: {e}")
            return False

evolution_client = EvolutionAPIClient()
