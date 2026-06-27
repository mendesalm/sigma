from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from typing import List
from .schemas import CashlessUserCreate, CashlessUserResponse, BalanceResponse, ManualTransactionRequest, ManualTransactionResponse, OrderCreate, OrderResponse, WebhookPayload, ProductResponse, ProductCreate, WalletTransactionHistoryResponse
from .services import create_cashless_user_and_wallet, get_dynamic_balance, process_manual_transaction, process_order, process_mercadopago_webhook, list_products, create_product, get_wallet_transactions, get_user_orders
from .models import CashlessUser, MercadoPagoWebhook

router = APIRouter(prefix="/cashless", tags=["Cashless"])


@router.post("/usuarios", response_model=CashlessUserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: CashlessUserCreate, db: Session = Depends(get_db)):
    """
    Cria um usuário e sua carteira atrelada na mesma transação.
    """
    user = create_cashless_user_and_wallet(db, user_in)
    return user


@router.get("/usuarios/{usuario_id}/saldo", response_model=BalanceResponse)
def get_user_balance(usuario_id: str, db: Session = Depends(get_db)):
    """
    Retorna os dados do usuário e seu saldo atual calculado dinamicamente no Ledger.
    """
    # Fetch user for response
    user = db.query(CashlessUser).filter(CashlessUser.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    balance = get_dynamic_balance(db, usuario_id)
    return BalanceResponse(user=user, current_balance=balance)


@router.post("/transacoes/manual", response_model=ManualTransactionResponse, status_code=status.HTTP_201_CREATED)
def manual_transaction(tx_in: ManualTransactionRequest, db: Session = Depends(get_db)):
    """
    Insere saldo fisicamente (Dinheiro/Cartão).
    Valida PIN se for Dinheiro e garante que operador é CAIXA ou GERENTE.
    """
    transaction = process_manual_transaction(db, tx_in)
    return transaction


@router.post("/webhooks/mercadopago", status_code=status.HTTP_200_OK)
def mercadopago_webhook(payload: WebhookPayload, db: Session = Depends(get_db)):
    """
    Endpoint público para escutar o Asaas/Mercado Pago.
    Localiza a carteira pelo external_reference/id e injeta o crédito.
    """
    process_mercadopago_webhook(db, payload)
    return {"status": "received"}


@router.post("/pedidos", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """
    Processa o consumo no bar.
    Transação ACID que calcula saldo, baixa estoque e gera movimentações de Ledger.
    """
    order = process_order(db, order_in)
    return order


@router.get("/produtos", response_model=List[ProductResponse])
def get_products(active_only: bool = True, db: Session = Depends(get_db)):
    """Lista todos os produtos ativos para o balcão/app."""
    return list_products(db, active_only)


@router.post("/produtos", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """Cria um novo produto (apenas usuários autorizados)."""
    return create_product(db, product_in)


@router.get("/usuarios/{usuario_id}/transacoes", response_model=List[WalletTransactionHistoryResponse])
def get_transactions(usuario_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Retorna o extrato da carteira (histórico de movimentações) de um usuário."""
    return get_wallet_transactions(db, usuario_id, limit)


@router.get("/usuarios/{usuario_id}/pedidos", response_model=List[OrderResponse])
def get_orders(usuario_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Retorna o histórico de compras/consumo de um usuário."""
    return get_user_orders(db, usuario_id, limit)


