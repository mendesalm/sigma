from typing import List, Optional
from pydantic import BaseModel

class ImportMemberRow(BaseModel):
    cim: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    degree: Optional[str] = None
    marital_status: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    blood_type: Optional[str] = None
    mother_lodge: Optional[str] = None
    collecting_lodge: Optional[str] = None
    initiation_certificate: Optional[str] = None
    masonic_history: List[dict] = []
    
    is_valid: bool = False
    errors: List[str] = []
    warnings: List[str] = []

class ImportPreviewResponse(BaseModel):
    rows: List[ImportMemberRow]
    total_valid: int
    total_errors: int

class ImportConfirmRequest(BaseModel):
    rows: List[ImportMemberRow]
