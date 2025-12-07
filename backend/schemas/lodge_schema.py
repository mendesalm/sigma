from datetime import date, time
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

class LodgeBase(BaseModel):
    lodge_name: str = Field(..., min_length=3, max_length=255, description="Nome da loja")
    lodge_title: str | None = Field("ARLS", max_length=50, description="Título da loja (ex: ARLS, ARBLS)")
    lodge_number: str | None = Field(None, max_length=255, description="Número da loja")
    foundation_date: date | None = Field(None, description="Data de fundação da loja")
    rite: str | None = Field(None, max_length=50, description="Rito praticado")
    obedience_id: int = Field(..., description="ID da obediência")
    cnpj: str | None = Field(None, max_length=18, description="CNPJ no formato XX.XXX.XXX/XXXX-XX")
    email: EmailStr | None = Field(None, description="Email da loja")
    phone: str | None = Field(None, max_length=20, description="Telefone no formato (XX) XXXXX-XXXX")
    website: str | None = Field(None, max_length=255, description="Website da loja")
    street_address: str | None = Field(None, max_length=255, description="Endereço")
    street_number: str | None = Field(None, max_length=20, description="Número")
    address_complement: str | None = Field(None, max_length=100, description="Complemento")
    neighborhood: str | None = Field(None, max_length=100, description="Bairro")
    city: str | None = Field(None, max_length=100, description="Cidade")
    state: str | None = Field(None, max_length=2, description="UF (sigla do estado)")
    zip_code: str | None = Field(None, max_length=9, description="CEP no formato XXXXX-XXX")
    latitude: float | None = Field(None, ge=-90, le=90, description="Latitude (-90 a 90)")
    longitude: float | None = Field(None, ge=-180, le=180, description="Longitude (-180 a 180)")
    technical_contact_name: str = Field(..., min_length=3, max_length=255, description="Nome do contato técnico")
    technical_contact_email: EmailStr = Field(..., description="Email do contato técnico")
    session_day: str | None = Field(None, description="Dia da semana das sessões")
    periodicity: str | None = Field(None, description="Periodicidade das sessões")
    session_time: time | None = Field(None, description="Horário das sessões")

    @field_validator('lodge_name', mode='after', check_fields=False)
    @classmethod
    def validate_lodge_name(cls, v):
        """Valida nome da loja."""
        if not v or not v.strip():
            raise ValueError('Nome da loja é obrigatório')
        v = ' '.join(v.split())
        if len(v) < 3:
            raise ValueError('Nome da loja deve ter pelo menos 3 caracteres')
        return v.title()

    @field_validator('cnpj', mode='after', check_fields=False)
    @classmethod
    def validate_cnpj_format(cls, v):
        """Valida formato e dígitos verificadores do CNPJ."""
        if not v:
            return v
        from utils.validators import validate_cnpj, sanitize_cnpj
        cnpj_clean = sanitize_cnpj(v)
        if not validate_cnpj(cnpj_clean):
            raise ValueError('CNPJ inválido. Verifique os dígitos verificadores')
        return v

    @field_validator('phone', mode='after', check_fields=False)
    @classmethod
    def validate_phone_format(cls, v):
        """Valida formato de telefone."""
        if not v:
            return v
        from utils.validators import validate_phone
        if not validate_phone(v):
            raise ValueError('Telefone inválido. Use formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX')
        return v

    @field_validator('zip_code', mode='after', check_fields=False)
    @classmethod
    def validate_zip_code_format(cls, v):
        """Valida formato de CEP."""
        if not v:
            return v
        from utils.validators import validate_cep
        if not validate_cep(v):
            raise ValueError('CEP inválido. Use formato: XXXXX-XXX')
        return v

    @field_validator('state', mode='after', check_fields=False)
    @classmethod
    def validate_state(cls, v):
        """Valida UF (estado brasileiro)."""
        if not v:
            return v
        valid_states = {
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
            'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
            'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        }
        v_upper = v.strip().upper()
        if v_upper not in valid_states:
            raise ValueError('UF inválida. Use a sigla do estado (ex: SP, RJ, DF)')
        return v_upper

    @field_validator('foundation_date', mode='after', check_fields=False)
    @classmethod
    def validate_foundation_date(cls, v):
        """Valida data de fundação."""
        if not v:
            return v
        today = date.today()
        if v > today:
            raise ValueError('Data de fundação não pode estar no futuro')
        if v.year < 1700:
            raise ValueError('Data de fundação inválida (anterior a 1700)')
        return v

    @field_validator('website', mode='after', check_fields=False)
    @classmethod
    def validate_website(cls, v):
        """Valida formato básico de URL."""
        if not v:
            return v
        v = v.strip().lower()
        if not v.startswith(('http://', 'https://')):
            v = 'https://' + v
        return v

    @field_validator('session_day', mode='after', check_fields=False)
    @classmethod
    def validate_session_day(cls, v):
        """Valida dia da semana."""
        if not v:
            return v
        valid_days = {
            'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira',
            'Sexta-feira', 'Sábado', 'Domingo',
            'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
        }
        if v not in valid_days:
            raise ValueError(f'Dia inválido. Use: {", ".join(sorted(set([d.split("-")[0] for d in valid_days])))}')
        return v

    @field_validator('periodicity', mode='after', check_fields=False)
    @classmethod
    def validate_periodicity(cls, v):
        """Valida periodicidade."""
        if not v:
            return v
        valid_periodicities = {'Semanal', 'Quinzenal', 'Mensal', 'Bimestral'}
        if v not in valid_periodicities:
            raise ValueError(f'Periodicidade inválida. Use: {", ".join(valid_periodicities)}')
        return v

    @field_validator('session_time', mode='after', check_fields=False)
    @classmethod
    def validate_session_time(cls, v):
        """Valida horário de sessão (razoável)."""
        if not v:
            return v
        if v.hour < 18 or v.hour > 23:
            raise ValueError('Horário de sessão deve estar entre 18:00 e 23:00')
        return v

    @field_validator('technical_contact_name', mode='after', check_fields=False)
    @classmethod
    def validate_technical_contact_name(cls, v):
        """Valida nome do contato técnico."""
        if not v or not v.strip():
            raise ValueError('Nome do contato técnico é obrigatório')
        v = ' '.join(v.split())
        if len(v) < 3:
            raise ValueError('Nome do contato técnico deve ter pelo menos 3 caracteres')
        return v.title()

    @model_validator(mode='after')
    def validate_coordinates(self):
        """Valida que latitude e longitude são fornecidas juntas."""
        lat = self.latitude
        lng = self.longitude
        
        # Se um está presente, o outro também deve estar
        if (lat is not None and lng is None) or (lat is None and lng is not None):
            raise ValueError('Latitude e longitude devem ser fornecidas juntas')
        
        # Validar ranges adicionais (já validados pelo Field ge/le, mas garantindo)
        if lat is not None and lng is not None:
            from utils.validators import validate_coordinates
            if not validate_coordinates(lat, lng):
                raise ValueError('Coordenadas geográficas inválidas')
        
        return self


class LodgeCreate(LodgeBase):
    # O lodge_code é gerado automaticamente no serviço
    external_id: int | None = Field(None, description="ID da loja no banco global (oriente_data)")
    pass


class LodgeUpdate(BaseModel):
    lodge_name: str | None = Field(None, max_length=255)
    lodge_title: str | None = Field(None, max_length=50)
    lodge_number: str | None = Field(None, max_length=255)
    foundation_date: date | None = None
    rite: str | None = Field(None, max_length=50)
    obedience_id: int | None = None
    cnpj: str | None = Field(None, max_length=18)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    website: str | None = Field(None, max_length=255)
    street_address: str | None = Field(None, max_length=255)
    street_number: str | None = Field(None, max_length=20)
    address_complement: str | None = Field(None, max_length=100)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=2)
    zip_code: str | None = Field(None, max_length=9)
    latitude: float | None = None
    longitude: float | None = None
    technical_contact_name: str | None = Field(None, max_length=255)
    technical_contact_email: EmailStr | None = None
    is_active: bool | None = None
    session_day: str | None = None
    periodicity: str | None = None
    session_time: time | None = None


class LodgeResponse(LodgeBase):
    id: int
    lodge_code: str
    is_active: bool

    class Config:
        from_attributes = True
