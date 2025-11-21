from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import enum

class TransactionTypeEnum(str, enum.Enum):
    DEBIT = "debit"
    CREDIT = "credit"

class FinancialTransactionBase(BaseModel):
    member_id: int
    transaction_type: TransactionTypeEnum
    amount: float
    description: Optional[str] = None

class FinancialTransactionCreate(FinancialTransactionBase):
    pass

class FinancialTransactionUpdate(FinancialTransactionBase):
    pass

class FinancialTransactionInDB(FinancialTransactionBase):
    id: int
    lodge_id: int
    transaction_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
