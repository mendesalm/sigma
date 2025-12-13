from .balaustre_strategy import BalaustreStrategy
from sqlalchemy.orm import Session
from models import models

class ElectoralBalaustreStrategy(BalaustreStrategy):
    """
    Estratégia especializada para Atas de Eleição (Sessões Eleitorais).
    Herda da estratégia de Balaústre padrão mas injeta texto específico de eleição.
    """
    
    def get_document_type_key(self) -> str:
        return 'balaustre_eleitoral' # Will fallback to 'balaustre' settings if not found

    async def collect_data(self, db: Session, main_entity_id: int, **kwargs) -> dict:
        # Reusing parent logic to gather basic session data (officers, date, open/close times)
        context = await super().collect_data(db, main_entity_id, **kwargs)
        
        # Override or Augment Custom Text for Election
        # We check if 'custom_text' was passed (draft). If not, we generate the Default Election Text.
        if not kwargs.get('custom_text'):
            context['custom_text'] = self._generate_electoral_text(context)
            
        return context

    def _generate_electoral_text(self, context: dict) -> str:
        """
        Gera o texto padrão para uma sessão eleitoral.
        """
        # Retrieving vars from context populated by parent
        veneravel = context.get('Veneravel')
        orador = context.get('Orador')
        
        text = (
            f"<p><strong>ABERTURA:</strong> A sessão foi aberta ritualisticamente pelo Venerável Mestre {veneravel}, "
            f"com a finalidade específica de realizar a Eleição da Administração para o próximo período.</p>"
            f"<p><strong>LEITURA DA LEI ELEITORAL:</strong> O Irmão Orador {orador} procedeu à leitura dos artigos pertinentes do Regulamento Geral "
            f"que regem as eleições em Loja.</p>"
            f"<p><strong>NOMEAÇÃO DOS ESCRUTINADORES:</strong> O Venerável Mestre nomeou os Irmãos [Nome 1] e [Nome 2] para servirem como escrutinadores, "
            f"os quais ocuparam seus lugares ao lado do Altar.</p>"
            f"<p><strong>VOTAÇÃO:</strong> Procedeu-se à votação nominal e secreta, onde os Irmãos depositaram seus votos na Urna apropriada.</p>"
            f"<p><strong>APURAÇÃO:</strong> Aberta a urna e contados os votos, verificou-se o seguinte resultado:</p>"
            f"<ul>"
            f"<li>Venerável Mestre: [Nome] - [X] votos</li>"
            f"<li>1º Vigilante: [Nome] - [X] votos</li>"
            f"<li>2º Vigilante: [Nome] - [X] votos</li>"
            f"</ul>"
            f"<p><strong>PROCLAMAÇÃO:</strong> O Venerável Mestre proclamou os eleitos e declarou encerrado o processo eleitoral.</p>"
            f"<p>Nada mais havendo a tratar, a sessão foi encerrada às {context.get('Encerramento', 'XX:XX')}.</p>"
        )
        return text
