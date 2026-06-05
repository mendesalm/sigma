import enum

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from database import Base


class TransactionType(enum.StrEnum):
    RECEIPT = "RECEITA"
    EXPENSE = "DESPESA"


class TransactionStatus(enum.StrEnum):
    PENDING = "PENDENTE"
    PAID = "PAGO"
    OVERDUE = "ATRASADO"
    CANCELED = "CANCELADO"


class GatewayProvider(enum.StrEnum):
    ASAAS = "ASAAS"
    IUGU = "IUGU"
    MERCADOPAGO = "MERCADOPAGO"
    NONE = "NENHUM"


class LodgeFinancialConfig(Base):
    __tablename__ = "lodge_financial_configs"
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, unique=True, index=True)
    active_gateway = Column(String(50), nullable=False, default=GatewayProvider.NONE)
    gateway_api_key = Column(String(255), nullable=True)
    gateway_webhook_secret = Column(String(255), nullable=True)
    strict_budget_control = Column(Boolean, default=False)
    recalculate_late_fees = Column(Boolean, default=True)
    default_penalty_percent = Column(Float, default=2.0)
    default_interest_percent = Column(Float, default=1.0)
    lodge = relationship("Lodge", backref="financial_config")


class FinancialCategory(Base):
    __tablename__ = "financial_categories"
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    lodge = relationship("Lodge", backref="financial_categories")


class AnnualBudget(Base):
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
    __tablename__ = "financial_transactions"
    id = Column(Integer, primary_key=True, index=True)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("financial_categories.id"), nullable=True, index=True)
    description = Column(String(255), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default=TransactionStatus.PENDING)
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=True)
    competency_date = Column(Date, nullable=False)
    original_amount = Column(Float, nullable=False)
    interest_amount = Column(Float, default=0.0)
    penalty_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, nullable=True)
    gateway_id = Column(String(100), nullable=True)
    gateway_link = Column(String(255), nullable=True)
    gateway_barcode = Column(String(255), nullable=True)
    gateway_pix_qrcode = Column(Text, nullable=True)
    gateway_status = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    lodge = relationship("Lodge", backref="financial_transactions")
    member = relationship("Member", backref="financial_transactions")
    category = relationship("FinancialCategory", backref="transactions")
