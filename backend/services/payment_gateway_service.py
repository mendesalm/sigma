from typing import Dict, Any, Optional
from schemas.financial_transaction_schema import GatewayProvider

def generate_payment_link(
    provider: GatewayProvider,
    api_key: Optional[str],
    amount: float,
    description: str,
    due_date: str,
    customer_info: Dict[str, Any]
) -> Dict[str, Optional[str]]:
    """
    Wrapper para integrar com Asaas e outros gateways futuros.
    Retorna Dict contendo link e qr_code/linha digitavel.
    """
    if provider == GatewayProvider.ASAAS:
        # Pseudo-implementação do Asaas
        # Numa implementação real faríamos requisição `POST https://sandbox.asaas.com/api/v3/payments`
        return {
            "gateway_id": "pay_mock_12345",
            "gateway_link": "https://sandbox.asaas.com/i/mock_link",
            "gateway_barcode": "00000.00000 00000.000000 00000.000000 0 00000000000000",
            "gateway_pix_qrcode": "00020126440014BR.GOV.BCB.PIX0122mock@asaas.com"
        }
    
    # Adicionar lógica do Iugu, MercadoPago, etc aqui
    return {
        "gateway_id": None,
        "gateway_link": None,
        "gateway_barcode": None,
        "gateway_pix_qrcode": None
    }
