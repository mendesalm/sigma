from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime
import enum

class TransactionType(str, enum.Enum):
    RECEIPT = "RECEITA"
    EXPENSE = "DESPESA"

class TransactionStatus(str, enum.Enum):
    PENDING = "PENDENTE"
    PAID = "PAGO"
    OVERDUE = "ATRASADO"
    CANCELED = "CANCELADO"

class GatewayProvider(str, enum.Enum):
    ASAAS = "ASAAS"
    IUGU = "IUGU"
    MERCADOPAGO = "MERCADOPAGO"
    NONE = "NENHUM"

# --- Lodge Config ---
class LodgeFinancialConfigBase(BaseModel):
    active_gateway: GatewayProvider = Field(GatewayProvider.NONE, description="Provedor de pagamento ativo (ex: ASAAS, IUGU)")
    strict_budget_control: bool = Field(False, description="Se verdadeiro, bloqueia despesas não orçadas")
    recalculate_late_fees: bool = Field(True, description="Se verdadeiro, recalcula juros e multas ao atualizar transações vencidas")
    default_penalty_percent: float = Field(2.0, description="Percentual padrão de multa por atraso", ge=0.0)
    default_interest_percent: float = Field(1.0, description="Percentual padrão de juros mensais", ge=0.0)

class LodgeFinancialConfigCreate(LodgeFinancialConfigBase):
    gateway_api_key: Optional[str] = Field(None, description="Chave de API do gateway de pagamento")
    gateway_webhook_secret: Optional[str] = Field(None, description="Token/Secret para validação de webhooks")
    
    class Config:
        json_schema_extra = {
            "example": {
                "active_gateway": "ASAAS",
                "strict_budget_control": True,
                "recalculate_late_fees": True,
                "default_penalty_percent": 2.0,
                "default_interest_percent": 1.0,
                "gateway_api_key": "YOUR_API_KEY_HERE"
            }
        }

class LodgeFinancialConfigResponse(LodgeFinancialConfigBase):
    id: int = Field(..., description="ID interno da configuração")
    lodge_id: int = Field(..., description="ID da loja associada")
    has_api_key: bool = Field(..., description="Indica se existe uma chave de API configurada (mascarada por segurança)")
    
    class Config:
        from_attributes = True

# --- Financial Category ---
class FinancialCategoryBase(BaseModel):
    name: str = Field(..., max_length=100, description="Nome da categoria (ex: Mensalidades, Contas de Luz)")
    type: TransactionType = Field(..., description="Tipo (Receita ou Despesa)")
    is_active: bool = Field(True, description="Status de ativação da categoria")

class FinancialCategoryCreate(FinancialCategoryBase):
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Mensalidade",
                "type": "RECEITA",
                "is_active": True
            }
        }

class FinancialCategoryResponse(FinancialCategoryBase):
    id: int = Field(..., description="ID da categoria")
    lodge_id: int = Field(..., description="ID da loja")
    
    class Config:
        from_attributes = True

# --- Annual Budget ---
class AnnualBudgetBase(BaseModel):
    year: int = Field(..., description="Ano do orçamento")
    month: int = Field(..., ge=1, le=12, description="Mês do orçamento (1 a 12)")
    budgeted_amount: float = Field(..., ge=0, description="Valor total orçado para o mês/categoria")

class AnnualBudgetCreate(AnnualBudgetBase):
    category_id: int = Field(..., description="ID da categoria orçada")
    
    class Config:
        json_schema_extra = {
            "example": {
                "year": 2026,
                "month": 2,
                "budgeted_amount": 5000.0,
                "category_id": 1
            }
        }

class AnnualBudgetResponse(AnnualBudgetBase):
    id: int
    lodge_id: int
    category_id: int
    
    class Config:
        from_attributes = True

# --- Financial Transaction ---
class FinancialTransactionBase(BaseModel):
    description: str = Field(..., max_length=255, description="Descrição do lançamento (ex: Mensalidade Jan/2026)")
    transaction_type: TransactionType = Field(..., description="Tipo de transação: RECEITA ou DESPESA")
    due_date: date = Field(..., description="Data de vencimento")
    competency_date: date = Field(..., description="Data de competência (mês de referência)")
    original_amount: float = Field(..., gt=0, description="Valor original da transação")
    
    member_id: Optional[int] = Field(None, description="ID do membro associado (se for cobrança/pagamento de membro)")
    category_id: Optional[int] = Field(None, description="ID da categoria financeira (Plano de contas)")

class FinancialTransactionCreate(FinancialTransactionBase):
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Mensalidade - Fev/2026",
                "transaction_type": "RECEITA",
                "due_date": "2026-02-10",
                "competency_date": "2026-02-01",
                "original_amount": 150.00,
                "member_id": 1,
                "category_id": 1
            }
        }

class FinancialTransactionUpdate(BaseModel):
    description: Optional[str] = Field(None, description="Nova descrição")
    due_date: Optional[date] = Field(None, description="Nova data de vencimento")
    competency_date: Optional[date] = Field(None, description="Nova data de competência")
    status: Optional[TransactionStatus] = Field(None, description="Novo status da transação")
    
    interest_amount: Optional[float] = Field(None, description="Atualizar valor de juros")
    penalty_amount: Optional[float] = Field(None, description="Atualizar valor de multa")
    discount_amount: Optional[float] = Field(None, description="Atualizar valor de desconto")
    paid_amount: Optional[float] = Field(None, description="Atualizar valor pago final")
    payment_date: Optional[date] = Field(None, description="Atualizar data efetiva de pagamento")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "PAGO",
                "paid_amount": 150.0,
                "payment_date": "2026-02-10"
            }
        }

class FinancialTransactionResponse(FinancialTransactionBase):
    id: int = Field(..., description="ID interno da transação")
    lodge_id: int = Field(..., description="ID da loja")
    status: TransactionStatus = Field(..., description="Status atual (PENDENTE, PAGO, ATRASADO, CANCELADO)")
    
    interest_amount: float = Field(..., description="Juros calculados")
    penalty_amount: float = Field(..., description="Multa calculada")
    discount_amount: float = Field(..., description="Desconto concedido")
    paid_amount: Optional[float] = Field(None, description="Valor total pago")
    payment_date: Optional[date] = Field(None, description="Data efetiva do pagamento")
    
    gateway_id: Optional[str] = Field(None, description="ID da cobrança gerado pelo gateway externo")
    gateway_link: Optional[str] = Field(None, description="URL do boleto ou fatura externa")
    gateway_barcode: Optional[str] = Field(None, description="Linha digitável do boleto")
    gateway_pix_qrcode: Optional[str] = Field(None, description="Chave PIX ou Payload do QRCode")
    gateway_status: Optional[str] = Field(None, description="Status bruto retornado pelo webhook do gateway")
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Alias for existing code compat
FinancialTransactionInDB = FinancialTransactionResponse
TransactionTypeEnum = TransactionType
