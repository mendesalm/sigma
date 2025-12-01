import enum
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from schemas.decoration_schema import DecorationResponse
from schemas.family_member_schema import FamilyMemberResponse, FamilyMemberCreate
from schemas.role_history_schema import RoleHistoryResponse


# --- Enums ---
class DegreeEnum(str, enum.Enum):
    APPRENTICE = "Aprendiz"
    FELLOW = "Companheiro"
    MASTER = "Mestre"
    INSTALLED_MASTER = "Mestre Instalado"


class RegistrationStatusEnum(str, enum.Enum):
    PENDING = "Pendente"
    APPROVED = "Aprovado"
    REJECTED = "Rejeitado"


class MemberStatusEnum(str, enum.Enum):
    ACTIVE = "Ativo"
    INACTIVE = "Inativo"
    DISABLED = "Desativado"

class MemberClassEnum(str, enum.Enum):
    REGULAR = "Regular"
    IRREGULAR = "Irregular"
    EMERITUS = "Emérito"
    REMITTED = "Remido"
    HONORARY = "Honorário"


# --- Schemas ---


class MemberLodgeAssociationResponse(BaseModel):
    lodge_id: int

    start_date: date | None
    end_date: date | None
    status: MemberStatusEnum
    member_class: MemberClassEnum

    class Config:
        from_attributes = True


class MemberObedienceAssociationResponse(BaseModel):
    obedience_id: int
    role_id: int
    start_date: date | None
    end_date: date | None

    class Config:
        from_attributes = True


class MemberBase(BaseModel):
    # Personal Data
    full_name: str = Field(..., min_length=3, max_length=255, description="Nome completo do membro")
    email: EmailStr = Field(..., description="Email do membro, usado para login")
    cpf: str | None = Field(None, max_length=14, description="CPF no formato XXX.XXX.XXX-XX")
    identity_document: str | None = Field(None, max_length=50)
    birth_date: date | None = Field(None, description="Data de nascimento")
    marriage_date: date | None = Field(None, description="Data de casamento")
    street_address: str | None = Field(None, max_length=255)
    street_number: str | None = Field(None, max_length=50)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    zip_code: str | None = Field(None, max_length=9, description="CEP no formato XXXXX-XXX")
    phone: str | None = Field(None, max_length=20, description="Telefone no formato (XX) XXXXX-XXXX")
    place_of_birth: str | None = Field(None, max_length=100)
    nationality: str | None = Field(None, max_length=100)
    religion: str | None = Field(None, max_length=100)

    education_level: str | None = Field(None, max_length=255)
    occupation: str | None = Field(None, max_length=255)
    workplace: str | None = Field(None, max_length=255)
    profile_picture_path: str | None = Field(None, max_length=255)

    # Masonic Data
    cim: str | None = Field(None, max_length=50, description="CIM (Cadastro Individual Maçônico)")
    status: str | None = Field("Active", max_length=50)
    degree: DegreeEnum | None = None
    initiation_date: date | None = Field(None, description="Data de iniciação")
    elevation_date: date | None = Field(None, description="Data de elevação")
    exaltation_date: date | None = Field(None, description="Data de exaltação")
    affiliation_date: date | None = Field(None, description="Data de filiação")
    regularization_date: date | None = None
    philosophical_degree: str | None = Field(None, max_length=100)

    # System Data
    registration_status: RegistrationStatusEnum = RegistrationStatusEnum.PENDING

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        """Valida que o nome é completo (nome e sobrenome)."""
        if not v or not v.strip():
            raise ValueError('Nome completo é obrigatório')
        
        # Remove espaços extras
        v = ' '.join(v.split())
        
        # Verifica se tem pelo menos nome e sobrenome
        parts = v.split()
        if len(parts) < 2:
            raise ValueError('Informe nome e sobrenome completos')
        
        # Verifica se contém apenas letras e espaços (permite acentos)
        if not all(part.replace('-', '').replace("'", '').isalpha() or part.isspace() for part in v):
            raise ValueError('Nome deve conter apenas letras')
        
        return v.title()  # Capitaliza cada palavra

    @field_validator('cpf')
    @classmethod
    def validate_cpf_format(cls, v):
        """Valida formato e dígitos verificadores do CPF."""
        if not v:
            return v
        
        from utils.validators import validate_cpf, sanitize_cpf
        
        # Sanitiza o CPF primeiro
        cpf_clean = sanitize_cpf(v)
        
        if not validate_cpf(cpf_clean):
            raise ValueError('CPF inválido. Verifique os dígitos verificadores')
        
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone_format(cls, v):
        """Valida formato de telefone brasileiro."""
        if not v:
            return v
        
        from utils.validators import validate_phone
        
        if not validate_phone(v):
            raise ValueError('Telefone inválido. Use formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX')
        
        return v

    @field_validator('zip_code')
    @classmethod
    def validate_zip_code_format(cls, v):
        """Valida formato de CEP."""
        if not v:
            return v
        
        from utils.validators import validate_cep
        
        if not validate_cep(v):
            raise ValueError('CEP inválido. Use formato: XXXXX-XXX')
        
        return v

    @field_validator('cim')
    @classmethod
    def validate_cim_format(cls, v):
        """Valida formato de CIM."""
        if not v:
            return v
        
        from utils.validators import validate_cim
        
        if not validate_cim(v):
            raise ValueError('CIM inválido. Deve ser numérico com 4-20 dígitos')
        
        return v.strip()

    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v):
        """Valida que data de nascimento não está no futuro e é razoável."""
        if not v:
            return v
        
        today = date.today()
        
        if v > today:
            raise ValueError('Data de nascimento não pode estar no futuro')
        
        # Validar idade mínima (18 anos) e máxima razoável (120 anos)
        age = (today - v).days // 365
        
        if age < 18:
            raise ValueError('Membro deve ter pelo menos 18 anos')
        
        if age > 120:
            raise ValueError('Data de nascimento inválida (idade superior a 120 anos)')
        
        return v

    @model_validator(mode='after')
    def validate_dates_consistency(self):
        """Valida consistência entre datas."""
        birth_date = self.birth_date
        marriage_date = self.marriage_date
        initiation_date = self.initiation_date
        elevation_date = self.elevation_date
        exaltation_date = self.exaltation_date
        
        # Data de casamento deve ser posterior ao nascimento
        if birth_date and marriage_date:
            if marriage_date < birth_date:
                raise ValueError('Data de casamento deve ser posterior à data de nascimento')
        
        # Data de iniciação deve ser posterior ao nascimento
        if birth_date and initiation_date:
            if initiation_date < birth_date:
                raise ValueError('Data de iniciação deve ser posterior à data de nascimento')
        
        # Progressão de graus: iniciação < elevação < exaltação
        if initiation_date and elevation_date:
            if elevation_date < initiation_date:
                raise ValueError('Data de elevação deve ser posterior à data de iniciação')
        
        if elevation_date and exaltation_date:
            if exaltation_date < elevation_date:
                raise ValueError('Data de exaltação deve ser posterior à data de elevação')
        
        if initiation_date and exaltation_date and not elevation_date:
            if exaltation_date < initiation_date:
                raise ValueError('Data de exaltação deve ser posterior à data de iniciação')
        
        return self


class MemberCreate(MemberBase):
    password: str = Field(..., min_length=8, description="Senha para o primeiro acesso do membro")
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        """Valida força da senha."""
        if len(v) < 8:
            raise ValueError('Senha deve ter pelo menos 8 caracteres')
        
        # Verificar se tem pelo menos uma letra e um número
        has_letter = any(c.isalpha() for c in v)
        has_number = any(c.isdigit() for c in v)
        
        if not has_letter or not has_number:
            raise ValueError('Senha deve conter letras e números')
        
        return v


class MemberCreateWithAssociation(MemberCreate):
    lodge_id: int = Field(..., description="ID da Loja à qual o membro será associado")
    role_id: int | None = Field(None, description="ID do Cargo que o membro ocupará na loja (opcional)")
    status: MemberStatusEnum = Field(MemberStatusEnum.ACTIVE, description="Status do membro na loja")
    member_class: MemberClassEnum = Field(MemberClassEnum.REGULAR, description="Classe do membro na loja")
    family_members: list[FamilyMemberCreate] = []


class MemberUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=255)
    email: EmailStr | None = None
    cpf: str | None = Field(None, max_length=14)
    identity_document: str | None = Field(None, max_length=50)
    birth_date: date | None = None
    marriage_date: date | None = None
    street_address: str | None = Field(None, max_length=255)
    street_number: str | None = Field(None, max_length=50)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    zip_code: str | None = Field(None, max_length=9)
    phone: str | None = Field(None, max_length=20)
    place_of_birth: str | None = Field(None, max_length=100)
    nationality: str | None = Field(None, max_length=100)
    religion: str | None = Field(None, max_length=100)

    education_level: str | None = Field(None, max_length=255)
    occupation: str | None = Field(None, max_length=255)
    workplace: str | None = Field(None, max_length=255)
    profile_picture_path: str | None = Field(None, max_length=255)
    cim: str | None = Field(None, max_length=50)
    status: str | None = Field(None, max_length=50)
    degree: DegreeEnum | None = None
    initiation_date: date | None = None
    elevation_date: date | None = None
    exaltation_date: date | None = None
    affiliation_date: date | None = None
    regularization_date: date | None = None
    philosophical_degree: str | None = Field(None, max_length=100)
    registration_status: RegistrationStatusEnum | None = None
    password: str | None = Field(None, min_length=8)


class MemberAssociateLodge(BaseModel):
    lodge_id: int
    role_id: int | None = None
    status: MemberStatusEnum = MemberStatusEnum.ACTIVE
    member_class: MemberClassEnum = MemberClassEnum.REGULAR
    member_update: MemberUpdate | None = None


class MemberListResponse(BaseModel):
    """Lightweight response for member list/table view - only essential fields"""
    id: int
    full_name: str
    email: str
    cim: str | None = None
    degree: DegreeEnum | None = None
    status: str | None = None
    registration_status: RegistrationStatusEnum
    profile_picture_path: str | None = None
    phone: str | None = None
    birth_date: date | None = None
    
    # Single active role (computed field, not a relationship)
    active_role: str | None = None
    
    class Config:
        from_attributes = True


class MemberResponse(MemberBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    last_login: datetime | None = None
    family_members: list[FamilyMemberResponse] = []
    decorations: list[DecorationResponse] = []
    role_history: list[RoleHistoryResponse] = []
    lodge_associations: list[MemberLodgeAssociationResponse] = []
    obedience_associations: list[MemberObedienceAssociationResponse] = []

    class Config:
        from_attributes = True


class RoleHistoryCreate(BaseModel):
    role_id: int
    start_date: date
    end_date: date | None = None
