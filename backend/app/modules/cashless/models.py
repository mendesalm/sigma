import enum
import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.shared.base_model import BaseModel


class CashlessUserTypeEnum(enum.StrEnum):
    MEMBER = "Membro"
    EXTERNAL = "Externo"


class CashlessProfileTypeEnum(enum.StrEnum):
    CLIENTE = "Cliente"
    CAIXA = "Caixa"
    GERENTE = "Gerente"


class CashlessUser(BaseModel):
    __tablename__ = "cashless_users"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    identification_key = Column(String(50), unique=True, index=True, nullable=False, comment="CIM para Membros, CPF para Externos")
    type = Column(SQLAlchemyEnum(CashlessUserTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=CashlessUserTypeEnum.EXTERNAL)
    profile_type = Column(SQLAlchemyEnum(CashlessProfileTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=CashlessProfileTypeEnum.CLIENTE)
    pin = Column(String(255), nullable=True, comment="Senha numérica para Caixas/Gerentes")
    responsible_member_id = Column(Integer, ForeignKey("members.id"), nullable=True, comment="Maçom responsável (Anfitrião) pelo consumo deste usuário")
    
    responsible_member = relationship("Member", foreign_keys=[responsible_member_id])
    wallet = relationship("Wallet", back_populates="cashless_user", uselist=False, cascade="all, delete-orphan")


class Wallet(BaseModel):
    __tablename__ = "cashless_wallets"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    cashless_user_id = Column(String(36), ForeignKey("cashless_users.id"), unique=True, nullable=False)
    balance = Column(Numeric(10, 2), nullable=False, default=0.00, comment="Saldo atual. Atualizado via trigger ou sum dinâmico")
    allow_negative_balance = Column(Boolean, nullable=False, default=False, comment="Permite Pós-Pago (Fatura) se True")
    
    cashless_user = relationship("CashlessUser", back_populates="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade="all, delete-orphan")


class WalletTransactionTypeEnum(enum.StrEnum):
    CREDITO_PIX = "Crédito PIX"
    CREDITO_MAQUININHA = "Crédito Maquininha"
    CREDITO_DINHEIRO = "Crédito Dinheiro"
    DEBITO_CONSUMO = "Débito Consumo"
    DEBITO_CASHOUT = "Débito Cashout"
    AJUSTE_CREDITO = "Ajuste Crédito"
    AJUSTE_DEBITO = "Ajuste Débito"


class WalletTransaction(BaseModel):
    __tablename__ = "cashless_wallet_transactions"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String(36), ForeignKey("cashless_wallets.id"), nullable=False, index=True)
    type = Column(SQLAlchemyEnum(WalletTransactionTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    gateway_id = Column(String(255), nullable=True, comment="ID da transação no Mercado Pago, se aplicável")
    order_id = Column(String(36), ForeignKey("cashless_orders.id"), nullable=True, comment="Pedido associado ao consumo")
    operator_id = Column(String(36), ForeignKey("cashless_users.id"), nullable=True, comment="Quem operou a transação (Caixa)")
    
    wallet = relationship("Wallet", back_populates="transactions")
    order = relationship("Order", back_populates="wallet_transactions", foreign_keys=[order_id])
    operator = relationship("CashlessUser", foreign_keys=[operator_id])


class WebhookStatusEnum(enum.StrEnum):
    PENDING = "Pendente"
    PROCESSED = "Processado"
    FAILED = "Falhou"
    IGNORED = "Ignorado"


class MercadoPagoWebhook(BaseModel):
    __tablename__ = "cashless_mercadopago_webhooks"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(255), unique=True, index=True, nullable=False, comment="ID único do evento na API do MP")
    type = Column(String(100), nullable=False, comment="Tipo do evento (ex: payment.created)")
    status = Column(SQLAlchemyEnum(WebhookStatusEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=WebhookStatusEnum.PENDING)
    payload = Column(Text, nullable=True, comment="JSON completo recebido")


class Product(BaseModel):
    __tablename__ = "cashless_products"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    min_stock = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    
    stock_movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("stock >= 0", name="chk_product_stock_non_negative"),
    )


class StockMovementTypeEnum(enum.StrEnum):
    ENTRADA_COMPRA = "Entrada Compra"
    ENTRADA_AJUSTE = "Entrada Ajuste"
    SAIDA_VENDA = "Saída Venda"
    QUEBRA = "Quebra"
    PERDA = "Perda"
    CORTESIA = "Cortesia"


class StockMovement(BaseModel):
    __tablename__ = "cashless_stock_movements"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), ForeignKey("cashless_products.id"), nullable=False, index=True)
    type = Column(SQLAlchemyEnum(StockMovementTypeEnum, values_callable=lambda x: [e.value for e in x]), nullable=False)
    quantity = Column(Integer, nullable=False)
    order_id = Column(String(36), ForeignKey("cashless_orders.id"), nullable=True)
    operator_id = Column(String(36), ForeignKey("cashless_users.id"), nullable=True, comment="Quem registrou a movimentação")
    reason = Column(String(255), nullable=True)
    
    product = relationship("Product", back_populates="stock_movements")
    order = relationship("Order", foreign_keys=[order_id])
    operator = relationship("CashlessUser", foreign_keys=[operator_id])


class OrderChannelEnum(enum.StrEnum):
    APP_AUTOATENDIMENTO = "App Autoatendimento"
    PDV_BALCAO = "PDV Balcão"


class OrderStatusEnum(enum.StrEnum):
    CRIADO = "Criado"
    AGUARDANDO_RETIRADA = "Aguardando Retirada"
    ENTREGUE = "Entregue"
    CANCELADO = "Cancelado"


class Order(BaseModel):
    __tablename__ = "cashless_orders"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    cashless_user_id = Column(String(36), ForeignKey("cashless_users.id"), nullable=False, index=True)
    channel = Column(SQLAlchemyEnum(OrderChannelEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=OrderChannelEnum.PDV_BALCAO)
    status = Column(SQLAlchemyEnum(OrderStatusEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=OrderStatusEnum.CRIADO)
    total = Column(Numeric(10, 2), nullable=False, default=0.00)
    
    cashless_user = relationship("CashlessUser", foreign_keys=[cashless_user_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    wallet_transactions = relationship("WalletTransaction", back_populates="order")


class OrderItem(BaseModel):
    __tablename__ = "cashless_order_items"
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("cashless_orders.id"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("cashless_products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
