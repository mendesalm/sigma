from decimal import Decimal
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from .models import CashlessUserTypeEnum, CashlessProfileTypeEnum, WalletTransactionTypeEnum, OrderChannelEnum


class CashlessUserCreate(BaseModel):
    name: str = Field(..., max_length=255)
    identification_key: str = Field(..., max_length=50, description="CIM ou CPF")
    type: CashlessUserTypeEnum = CashlessUserTypeEnum.EXTERNAL
    profile_type: CashlessProfileTypeEnum = CashlessProfileTypeEnum.CLIENTE
    pin: Optional[str] = Field(None, max_length=255, description="Obrigatório se for CAIXA ou GERENTE")
    responsible_member_id: Optional[int] = Field(None, description="Obrigatório para visitantes/externos, aponta para members.id")


class CashlessUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    identification_key: str
    type: CashlessUserTypeEnum
    profile_type: CashlessProfileTypeEnum
    responsible_member_id: Optional[int]


class BalanceResponse(BaseModel):
    user: CashlessUserResponse
    current_balance: Decimal


class ManualTransactionRequest(BaseModel):
    usuario_id: str = Field(..., description="ID do usuário recebedor")
    operador_id: str = Field(..., description="ID do Caixa ou Gerente")
    tipo: WalletTransactionTypeEnum = Field(..., description="Ex: Crédito Dinheiro, Crédito Maquininha")
    valor: Decimal = Field(..., gt=0, description="Valor positivo da transação")
    pin_seguranca: Optional[str] = Field(None, description="Obrigatório para transações manuais no balcão")


class ManualTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    wallet_id: str
    type: WalletTransactionTypeEnum
    amount: Decimal
    operator_id: Optional[str]


class OrderItemCreate(BaseModel):
    produto_id: str = Field(..., description="ID do produto")
    quantidade: int = Field(..., gt=0, description="Quantidade comprada")


class OrderCreate(BaseModel):
    usuario_id: str = Field(..., description="ID do usuário comprando (CashlessUser)")
    canal: OrderChannelEnum = Field(..., description="Canal de venda (APP_AUTOATENDIMENTO ou PDV_BALCAO)")
    itens: List[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str
    quantity: int
    unit_price: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    cashless_user_id: str
    channel: OrderChannelEnum
    status: str
    total: Decimal
    items: List[OrderItemResponse]


class WebhookPayload(BaseModel):
    # Payload super genérico para simplificar a captura de MercadoPago
    id: Optional[str] = None
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    action: Optional[str] = None
    external_reference: Optional[str] = None


class ProductCreate(BaseModel):
    name: str = Field(..., max_length=255)
    price: Decimal = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    min_stock: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    price: Decimal
    stock: int
    min_stock: int
    is_active: bool


class WalletTransactionHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: WalletTransactionTypeEnum
    amount: Decimal
    created_at: datetime
    


