from datetime import date, time, datetime, timedelta
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic_settings import SettingsConfigDict

from schemas.document_schema import DocumentInDB
from schemas.session_attendance_schema import SessionAttendanceResponse
from schemas.lodge_schema import LodgeResponse


from models.models import SessionTypeEnum, SessionSubtypeEnum

class MasonicSessionBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Título da sessão")
    session_date: date = Field(..., description="Data da sessão")
    start_time: time | None = Field(None, description="Horário de início")
    end_time: time | None = Field(None, description="Horário de término")
    
    type: SessionTypeEnum | None = Field(None, description="Tipo da sessão (Ordinária, Magna, Extraordinária)")
    subtype: SessionSubtypeEnum | None = Field(None, description="Subtipo da sessão")
    
    status: str = Field(
        "AGENDADA",
        description="Status da sessão: AGENDADA, EM_ANDAMENTO, REALIZADA, CANCELADA"
    )
    
    agenda: str | None = Field(None, description="Pauta(s) para Ordem do Dia")
    sent_expedients: str | None = Field(None, description="Expediente(s) Expedido(s)")
    received_expedients: str | None = Field(None, description="Expediente(s) Recebido(s)")
    study_director_id: int | None = Field(None, description="ID do Responsável pelo Tempo de Estudos")

    @field_validator('title', mode='after', check_fields=False)
    @classmethod
    def validate_title(cls, v):
        """Valida título da sessão."""
        if not v or not v.strip():
            raise ValueError('Título da sessão é obrigatório')
        
        v = ' '.join(v.split())
        
        if len(v) < 3:
            raise ValueError('Título deve ter pelo menos 3 caracteres')
        
        return v.title()

    @field_validator('status', mode='after', check_fields=False)
    @classmethod
    def validate_status(cls, v):
        """Valida status da sessão."""
        valid_statuses = {'AGENDADA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA'}
        
        v_upper = v.upper()
        
        if v_upper not in valid_statuses:
            raise ValueError(
                f'Status inválido. Use: {", ".join(valid_statuses)}'
            )
        
        return v_upper

    @field_validator('start_time', mode='after', check_fields=False)
    @classmethod
    def validate_start_time(cls, v):
        """Valida horário de início."""
        if not v:
            return v
        
        # Sessões geralmente são à noite (18h - 23h)
        if v.hour < 18 or v.hour > 23:
            raise ValueError('Horário de início deve estar entre 18:00 e 23:00')
        
        return v

    @field_validator('end_time', mode='after', check_fields=False)
    @classmethod
    def validate_end_time(cls, v):
        """Valida horário de término."""
        if not v:
            return v
        
        # Horário de término razoável (até meia-noite)
        if v.hour > 23 or (v.hour == 23 and v.minute > 59):
            raise ValueError('Horário de término deve ser até 23:59')
        
        return v

    @model_validator(mode='after')
    def validate_times_consistency(self):
        """Valida consistência entre horários."""
        start_time = self.start_time
        end_time = self.end_time
        
        if start_time and end_time:
            # Converter para datetime para comparação
            today = date.today()
            start_dt = datetime.combine(today, start_time)
            end_dt = datetime.combine(today, end_time)
            
            if end_dt <= start_dt:
                raise ValueError('Horário de término deve ser posterior ao horário de início')
            
            # Validar duração razoável (mínimo 30min, máximo 5h)
            duration = (end_dt - start_dt).total_seconds() / 60  # em minutos
            
            if duration < 30:
                raise ValueError('Sessão deve ter duração mínima de 30 minutos')
            
            if duration > 300:  # 5 horas
                raise ValueError('Sessão não pode ultrapassar 5 horas de duração')
        
        return self

    @model_validator(mode='after')
    def validate_type_subtype_consistency(self):
        """Valida se o subtipo pertence ao tipo selecionado."""
        from models.models import VALID_SESSION_SUBTYPES
        
        if self.type and self.subtype:
            valid_subtypes = VALID_SESSION_SUBTYPES.get(self.type)
            if valid_subtypes and self.subtype not in valid_subtypes:
                raise ValueError(f"O subtipo '{self.subtype.value}' não é válido para o tipo de sessão '{self.type.value}'.")
        
        return self


class MasonicSessionCreate(MasonicSessionBase):
    """Schema para criação de sessão."""
    
    @field_validator('session_date', mode='after', check_fields=False)
    @classmethod
    def validate_session_date_create(cls, v):
        """Valida data da sessão na criação."""
        if not v:
            raise ValueError('Data da sessão é obrigatória')
        
        today = date.today()
        
        # Não permitir criar sessões para datas muito antigas (mais de 1 semana no passado)
        one_week_ago = today - timedelta(days=7)
        
        if v < one_week_ago:
            raise ValueError('Não é possível criar sessões para datas muito antigas (mais de 1 semana no passado)')
        
        # Avisar sobre datas muito distantes no futuro (mais de 1 ano)
        one_year_ahead = today + timedelta(days=365)
        
        if v > one_year_ahead:
            raise ValueError('Data da sessão está muito distante (mais de 1 ano no futuro)')
        
        return v


class MasonicSessionUpdate(BaseModel):
    """Schema para atualização de sessão."""
    title: str | None = Field(None, min_length=3, max_length=255)
    session_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    status: str | None = None
    type: SessionTypeEnum | None = None
    subtype: SessionSubtypeEnum | None = None
    agenda: str | None = None
    sent_expedients: str | None = None
    received_expedients: str | None = None
    study_director_id: int | None = None

    @field_validator('title', mode='after', check_fields=False)
    @classmethod
    def validate_title(cls, v):
        """Valida título se fornecido."""
        if v is not None:
            v = ' '.join(v.split())
            if len(v) < 3:
                raise ValueError('Título deve ter pelo menos 3 caracteres')
            return v.title()
        return v

    @field_validator('status', mode='after', check_fields=False)
    @classmethod
    def validate_status(cls, v):
        """Valida status se fornecido."""
        if v is not None:
            valid_statuses = {'AGENDADA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA'}
            v_upper = v.upper()
            if v_upper not in valid_statuses:
                raise ValueError(f'Status inválido. Use: {", ".join(valid_statuses)}')
            return v_upper
        return v

    @field_validator('start_time', mode='after', check_fields=False)
    @classmethod
    def validate_start_time(cls, v):
        """Valida horário de início se fornecido."""
        if v is not None:
            if v.hour < 18 or v.hour > 23:
                raise ValueError('Horário de início deve estar entre 18:00 e 23:00')
        return v

    @field_validator('end_time', mode='after', check_fields=False)
    @classmethod
    def validate_end_time(cls, v):
        """Valida horário de término se fornecido."""
        if v is not None:
            if v.hour > 23 or (v.hour == 23 and v.minute > 59):
                raise ValueError('Horário de término deve ser até 23:59')
        return v

    @model_validator(mode='after')
    def validate_times_consistency(self):
        """Valida consistência entre horários se ambos fornecidos."""
        start_time = self.start_time
        end_time = self.end_time
        
        if start_time and end_time:
            today = date.today()
            start_dt = datetime.combine(today, start_time)
            end_dt = datetime.combine(today, end_time)
            
            if end_dt <= start_dt:
                raise ValueError('Horário de término deve ser posterior ao horário de início')
        
        return self


class MasonicSessionResponse(MasonicSessionBase):
    id: int
    lodge_id: int
    lodge: "LodgeResponse"
    attendances: list[SessionAttendanceResponse] = []
    documents: list[DocumentInDB] = []

    model_config = SettingsConfigDict(from_attributes=True)
