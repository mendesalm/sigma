from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Date, Text, func
from sqlalchemy.orm import relationship
import enum
import datetime
from database import Base

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
    NONE = "NENHUM" # Manual / No integration

class LodgeFinancialConfig(Base):
    """
    Configurações financeiras de uma Loja (tenant).
    """
    __tablename__ = "lodge_financial_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, unique=True, index=True)
    
    # Provider Settings (Asaas, etc)
    active_gateway = Column(String(50), nullable=False, default=GatewayProvider.NONE)
    gateway_api_key = Column(String(255), nullable=True) # Preferably encrypted/vaulted in real life, but for now String
    gateway_webhook_secret = Column(String(255), nullable=True)
    
    # Financial Rules
    strict_budget_control = Column(Boolean, default=False) # Se True, bloqueia a criação de despesa acima do orçado
    recalculate_late_fees = Column(Boolean, default=True) # Se True, juros e multas entram no mesmo lançamento original, senao requer nova transacao
    default_penalty_percent = Column(Float, default=2.0) # Multa 2%
    default_interest_percent = Column(Float, default=1.0) # Juros % a.m.
    
    # Relacionamentos
    lodge = relationship("Lodge", backref="financial_config")


class FinancialCategory(Base):
    """
    Plano de Contas Genérico da Loja.
    """
    __tablename__ = "financial_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False) # RECEITA ou DESPESA
    is_active = Column(Boolean, default=True)
    
    lodge = relationship("Lodge", backref="financial_categories")


class AnnualBudget(Base):
    """
    Orçamento Previsto.
    """
    __tablename__ = "annual_budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("financial_categories.id"), nullable=False, index=True)
    
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    budgeted_amount = Column(Float, nullable=False)
    
    lodge = relationship("Lodge", backref="annual_budgets")
    category = relationship("FinancialCategory", backref="budgets")


class FinancialTransaction(Base):
    """
    Lançamento Financeiro (Contas a Pagar / Receber).
    """
    __tablename__ = "financial_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True, index=True) # Responsável/Obreiro pagador
    category_id = Column(Integer, ForeignKey("financial_categories.id"), nullable=True, index=True)
    
    description = Column(String(255), nullable=False)
    transaction_type = Column(String(50), nullable=False) # RECEITA ou DESPESA
    status = Column(String(50), nullable=False, default=TransactionStatus.PENDING)
    
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    competency_date = Column(Date, nullable=False) # Para DRE
    
    # Financial values
    original_amount = Column(Float, nullable=False)
    interest_amount = Column(Float, default=0.0) # Juros (valor_juros)
    penalty_amount = Column(Float, default=0.0)  # Multa (valor_multa)
    discount_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, nullable=True)
    
    # Gateway Integration
    gateway_id = Column(String(100), nullable=True) # Ex: id da cobrança no Asaas
    gateway_link = Column(String(255), nullable=True) # Link de pagamento
    gateway_barcode = Column(String(255), nullable=True) # Linha digitável ou código de barras
    gateway_pix_qrcode = Column(Text, nullable=True) # PIX Copia e Cola Payload
    gateway_status = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    lodge = relationship("Lodge", backref="financial_transactions")
    member = relationship("Member", backref="financial_transactions")
    category = relationship("FinancialCategory", backref="transactions")

