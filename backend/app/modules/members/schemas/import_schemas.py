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
    
    # New Fields
    birth_date: Optional[str] = None
    place_of_birth: Optional[str] = None
    education_level: Optional[str] = None
    occupation: Optional[str] = None
    phone: Optional[str] = None
    zip_code: Optional[str] = None
    street_address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    
    masonic_history: List[dict] = []
    family_members: List[dict] = []
    decorations: List[dict] = []
    
    is_valid: bool = False
    errors: List[str] = []
    warnings: List[str] = []

class ImportPreviewResponse(BaseModel):
    rows: List[ImportMemberRow]
    total_valid: int
    total_errors: int

class ImportConfirmRequest(BaseModel):
    rows: List[ImportMemberRow]
