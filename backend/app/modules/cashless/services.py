from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext

from .models import CashlessUser, Wallet, WalletTransaction, WalletTransactionTypeEnum, CashlessProfileTypeEnum, MercadoPagoWebhook, WebhookStatusEnum, Order, OrderItem, Product, StockMovement, StockMovementTypeEnum
from .schemas import CashlessUserCreate, ManualTransactionRequest, OrderCreate, WebhookPayload, ProductCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return pwd_context.verify(plain_pin, hashed_pin)

def get_password_hash(pin: str) -> str:
    return pwd_context.hash(pin)


def create_cashless_user_and_wallet(db: Session, user_data: CashlessUserCreate) -> CashlessUser:
    # Check if user already exists
    existing_user = db.query(CashlessUser).filter(CashlessUser.identification_key == user_data.identification_key).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identification key already registered.")

    # Validation: CAIXA and GERENTE must have a PIN
    if user_data.profile_type in [CashlessProfileTypeEnum.CAIXA, CashlessProfileTypeEnum.GERENTE] and not user_data.pin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CAIXA e GERENTE exigem um PIN de segurança.")

    hashed_pin = get_password_hash(user_data.pin) if user_data.pin else None

    # Create CashlessUser
    new_user = CashlessUser(
        name=user_data.name,
        identification_key=user_data.identification_key,
        type=user_data.type,
        profile_type=user_data.profile_type,
        pin=hashed_pin,
        responsible_member_id=user_data.responsible_member_id,
    )
    db.add(new_user)
    db.flush()  # We need the user ID for the wallet

    # Create associated Wallet
    new_wallet = Wallet(
        cashless_user_id=new_user.id,
        balance=0.00,
        allow_negative_balance=False
    )
    db.add(new_wallet)
    
    db.commit()
    db.refresh(new_user)
    return new_user


def get_dynamic_balance(db: Session, user_id: str) -> Decimal:
    wallet = db.query(Wallet).filter(Wallet.cashless_user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found for this user.")

    # Dynamic Ledger SUM calculation
    credit_types = [
        WalletTransactionTypeEnum.CREDITO_PIX,
        WalletTransactionTypeEnum.CREDITO_MAQUININHA,
        WalletTransactionTypeEnum.CREDITO_DINHEIRO,
        WalletTransactionTypeEnum.AJUSTE_CREDITO
    ]
    
    transactions = db.query(WalletTransaction).filter(WalletTransaction.wallet_id == wallet.id).all()
    
    balance = Decimal("0.00")
    for tx in transactions:
        if tx.type in credit_types:
            balance += tx.amount
        else:
            balance -= tx.amount

    return balance


def process_manual_transaction(db: Session, tx_data: ManualTransactionRequest) -> WalletTransaction:
    # 1. Get Wallet
    wallet = db.query(Wallet).filter(Wallet.cashless_user_id == tx_data.usuario_id).first()
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet of the receiving user not found.")
        
    # 2. Get Operator and validate permissions/PIN
    operator = db.query(CashlessUser).filter(CashlessUser.id == tx_data.operador_id).first()
    if not operator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operator not found.")
        
    if operator.profile_type not in [CashlessProfileTypeEnum.CAIXA, CashlessProfileTypeEnum.GERENTE]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas CAIXA ou GERENTE podem processar transações manuais.")
        
    if tx_data.tipo == WalletTransactionTypeEnum.CREDITO_DINHEIRO:
        if not tx_data.pin_seguranca:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN de segurança é obrigatório para entrada de dinheiro.")
        if not operator.pin or not verify_pin(tx_data.pin_seguranca, operator.pin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="PIN inválido.")
            
    # 3. Create Transaction
    new_tx = WalletTransaction(
        wallet_id=wallet.id,
        type=tx_data.tipo,
        amount=tx_data.valor,
        operator_id=operator.id
    )
    
    db.add(new_tx)
    
    db.commit()
    db.refresh(new_tx)
    return new_tx


def process_mercadopago_webhook(db: Session, payload: WebhookPayload) -> MercadoPagoWebhook:
    import json
    
    # 1. Check if event is already processed (Idempotency)
    event_id = str(payload.id) if payload.id else (str(payload.data.get("id")) if payload.data else None)
    if not event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event ID not found in payload.")
        
    existing = db.query(MercadoPagoWebhook).filter(MercadoPagoWebhook.event_id == event_id).first()
    if existing:
        return existing
        
    # 2. Save webhook
    webhook = MercadoPagoWebhook(
        event_id=event_id,
        type=payload.type or payload.action or "unknown",
        status=WebhookStatusEnum.PENDING,
        payload=json.dumps(payload.model_dump())
    )
    db.add(webhook)
    
    # 3. Process if it's a payment
    if payload.type == "payment" or payload.action == "payment.created":
        wallet_id = payload.external_reference or (payload.data and payload.data.get("external_reference"))
        
        if wallet_id:
            wallet = db.query(Wallet).filter(Wallet.id == wallet_id).first()
            if wallet:
                # In a real scenario we'd query MP API to verify the payment and get real amount.
                # Here we assume a valid payment payload
                tx = WalletTransaction(
                    wallet_id=wallet.id,
                    type=WalletTransactionTypeEnum.CREDITO_PIX,
                    amount=Decimal("0.00"),  # Stub value. Real value would come from MP API
                    gateway_id=event_id
                )
                db.add(tx)
                webhook.status = WebhookStatusEnum.PROCESSED
            else:
                webhook.status = WebhookStatusEnum.FAILED
        else:
            webhook.status = WebhookStatusEnum.IGNORED
            
    db.commit()
    return webhook


from sqlalchemy.exc import IntegrityError

def process_order(db: Session, order_data: OrderCreate) -> Order:
    total = Decimal("0.00")
    items_to_create = []
    products_to_update = []
    
    # LOCK WALLET first to prevent deadlocks and concurrent balance consumption
    wallet = db.query(Wallet).with_for_update().filter(Wallet.cashless_user_id == order_data.usuario_id).first()
    if not wallet:
        db.rollback()
        raise HTTPException(status_code=404, detail="Carteira não encontrada para este usuário")
        
    # Order items products by ID to prevent deadlocks when locking multiple products
    sorted_items = sorted(order_data.itens, key=lambda x: x.produto_id)
    
    for item_in in sorted_items:
        # LOCK PRODUCT to prevent concurrent stock consumption
        product = db.query(Product).with_for_update().filter(Product.id == item_in.produto_id).first()
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Produto {item_in.produto_id} não encontrado")
            
        if not product.is_active:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Produto {product.name} inativo")
            
        # e) Ledger de Estoque: subtrair a quantidade
        product.stock -= item_in.quantidade
        
        products_to_update.append((product, item_in.quantidade))
        
        item_total = product.price * item_in.quantidade
        total += item_total
        
        items_to_create.append({
            "product": product,
            "quantity": item_in.quantidade,
            "unit_price": product.price
        })

    # b) Ver se tem saldo
    balance = get_dynamic_balance(db, order_data.usuario_id)
    if balance < total and not wallet.allow_negative_balance:
        db.rollback()
        raise HTTPException(status_code=400, detail="Saldo insuficiente")
        
    try:
        # c) Crie o Pedido
        new_order = Order(
            cashless_user_id=order_data.usuario_id,
            channel=order_data.canal,
            total=total
        )
        db.add(new_order)
        db.flush() # get order id
        
        for item_data in items_to_create:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item_data["product"].id,
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"]
            )
            db.add(order_item)
            
            # f) Insira a movimentação na tabela Movimentacoes_Estoque
            stock_mov = StockMovement(
                product_id=item_data["product"].id,
                type=StockMovementTypeEnum.SAIDA_VENDA,
                quantity=-item_data["quantity"],
                order_id=new_order.id
            )
            db.add(stock_mov)
            
        # d) Insira a saída na tabela Transacoes_Carteira
        tx = WalletTransaction(
            wallet_id=wallet.id,
            type=WalletTransactionTypeEnum.DEBITO_CONSUMO,
            amount=total, 
            order_id=new_order.id
        )
        db.add(tx)
        
        db.commit()
        
    except IntegrityError as e:
        db.rollback()
        # This will catch the CheckConstraint("stock >= 0")
        if "chk_product_stock_non_negative" in str(e).lower():
            raise HTTPException(status_code=400, detail="Estoque insuficiente para um ou mais produtos.")
        raise HTTPException(status_code=400, detail="Erro de integridade ao processar o pedido.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
        
    # g) Alerta de Estoque
    for product, qty in products_to_update:
        if product.stock <= product.min_stock:
            print(f"ALERTA WEBSOCKET: Estoque crítico para o produto {product.name} (Atual: {product.stock})")
            
    db.refresh(new_order)
    return new_order


def list_products(db: Session, active_only: bool = True):
    query = db.query(Product)
    if active_only:
        query = query.filter(Product.is_active == True)
    return query.all()


def create_product(db: Session, product_in: ProductCreate) -> Product:
    new_product = Product(
        name=product_in.name,
        price=product_in.price,
        stock=product_in.stock,
        min_stock=product_in.min_stock,
        is_active=product_in.is_active
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


def get_wallet_transactions(db: Session, user_id: str, limit: int = 50):
    wallet = db.query(Wallet).filter(Wallet.cashless_user_id == user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Carteira não encontrada.")
        
    transactions = db.query(WalletTransaction)\
        .filter(WalletTransaction.wallet_id == wallet.id)\
        .order_by(WalletTransaction.created_at.desc())\
        .limit(limit).all()
        
    return transactions


def get_user_orders(db: Session, user_id: str, limit: int = 50):
    orders = db.query(Order)\
        .filter(Order.cashless_user_id == user_id)\
        .order_by(Order.created_at.desc())\
        .limit(limit).all()
        
    return orders


