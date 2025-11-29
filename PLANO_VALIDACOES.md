# 🛡️ Plano de Implementação de Validações

**Data de Início**: 2025-11-28  
**Objetivo**: Adicionar validações robustas em backend e frontend

---

## 📊 Fase 1: Auditoria Inicial

### Endpoints Críticos Identificados:

1. **Membros** (`/members`)
   - ❌ CPF: Sem validação de formato e dígitos verificadores
   - ❌ Email: Validação básica via Pydantic, mas sem verificação de domínio
   - ❌ CIM: Sem validação de formato
   - ❌ Datas: Sem validação de consistência (data_fim > data_inicio)
   - ❌ Telefone: Sem validação de formato

2. **Upload de Foto** (`/members/{id}/photo`)
   - ❌ Tamanho de arquivo: Sem limite
   - ❌ Tipo MIME: Sem validação server-side
   - ❌ Dimensões: Sem validação mínima/máxima

3. **Lojas** (`/lodges`)
   - ❌ CNPJ: Sem validação de formato e dígitos
   - ❌ CEP: Sem validação de formato
   - ❌ Coordenadas: Sem validação de range válido

4. **Sessões** (`/masonic-sessions`)
   - ❌ Datas: Podem ser criadas no passado
   - ❌ Horários: Sem validação de range razoável
   - ❌ Conflitos: Sem verificação de sessões simultâneas

---

## 🎯 Fase 2: Implementação de Validações

### 2.1. Validadores Customizados

Criar módulo `backend/utils/validators.py`:

```python
import re
from typing import Optional

def validate_cpf(cpf: str) -> bool:
    """Valida CPF com dígitos verificadores."""
    cpf = re.sub(r'[^0-9]', '', cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    
    # Validação dos dígitos verificadores
    for i in range(9, 11):
        value = sum((int(cpf[num]) * ((i+1) - num) for num in range(0, i)))
        digit = ((value * 10) % 11) % 10
        if digit != int(cpf[i]):
            return False
    return True

def validate_cnpj(cnpj: str) -> bool:
    """Valida CNPJ com dígitos verificadores."""
    # Implementação similar ao CPF
    pass

def validate_cep(cep: str) -> bool:
    """Valida formato de CEP brasileiro."""
    pattern = r'^\d{5}-?\d{3}$'
    return bool(re.match(pattern, cep))

def validate_phone(phone: str) -> bool:
    """Valida telefone brasileiro."""
    pattern = r'^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$'
    return bool(re.match(pattern, phone))

def validate_coordinates(lat: float, lng: float) -> bool:
    """Valida coordenadas geográficas."""
    return -90 <= lat <= 90 and -180 <= lng <= 180
```

### 2.2. Schemas com Validações

Atualizar `backend/schemas/member_schema.py`:

```python
from pydantic import BaseModel, Field, validator, EmailStr
from ..utils.validators import validate_cpf, validate_phone

class MemberCreate(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    cpf: str = Field(..., pattern=r'^\d{3}\.\d{3}\.\d{3}-\d{2}$')
    phone: Optional[str] = Field(None, pattern=r'^\(\d{2}\)\s?\d{4,5}-\d{4}$')
    cim: Optional[str] = Field(None, min_length=4, max_length=20)
    
    @validator('cpf')
    def validate_cpf_digits(cls, v):
        if not validate_cpf(v):
            raise ValueError('CPF inválido. Verifique os dígitos.')
        return v
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v and not validate_phone(v):
            raise ValueError('Telefone inválido. Use formato: (XX) XXXXX-XXXX')
        return v
    
    @validator('full_name')
    def validate_name(cls, v):
        if not all(part.isalpha() or part.isspace() for part in v):
            raise ValueError('Nome deve conter apenas letras e espaços')
        if len(v.split()) < 2:
            raise ValueError('Informe nome completo (nome e sobrenome)')
        return v.title()
```

### 2.3. Validação de Upload de Imagem

Criar `backend/utils/image_validator.py`:

```python
from fastapi import UploadFile, HTTPException
from PIL import Image
import io

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MIN_DIMENSIONS = (100, 100)
MAX_DIMENSIONS = (4000, 4000)

async def validate_image(file: UploadFile) -> bytes:
    """Valida imagem: tipo, tamanho e dimensões."""
    
    # Ler arquivo
    contents = await file.read()
    
    # Validar tamanho
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Validar tipo MIME
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(ALLOWED_TYPES)}"
        )
    
    # Validar se é realmente uma imagem e dimensões
    try:
        image = Image.open(io.BytesIO(contents))
        width, height = image.size
        
        if width < MIN_DIMENSIONS[0] or height < MIN_DIMENSIONS[1]:
            raise HTTPException(
                status_code=400,
                detail=f"Imagem muito pequena. Mínimo: {MIN_DIMENSIONS[0]}x{MIN_DIMENSIONS[1]}px"
            )
        
        if width > MAX_DIMENSIONS[0] or height > MAX_DIMENSIONS[1]:
            raise HTTPException(
                status_code=400,
                detail=f"Imagem muito grande. Máximo: {MAX_DIMENSIONS[0]}x{MAX_DIMENSIONS[1]}px"
            )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Arquivo não é uma imagem válida")
    
    return contents
```

### 2.4. Validação de Datas

Criar validadores para datas em `backend/utils/date_validators.py`:

```python
from datetime import date, datetime, time
from typing import Optional

def validate_date_not_future(value: date, field_name: str = "Data") -> date:
    """Valida que data não está no futuro."""
    if value > date.today():
        raise ValueError(f"{field_name} não pode estar no futuro")
    return value

def validate_date_order(
    start_date: Optional[date],
    end_date: Optional[date],
    allow_same_day: bool = True
) -> bool:
    """Valida que data de fim é posterior à data de início."""
    if start_date and end_date:
        if allow_same_day:
            if end_date < start_date:
                raise ValueError("Data de término deve ser posterior ou igual à data de início")
        else:
            if end_date <= start_date:
                raise ValueError("Data de término deve ser posterior à data de início")
    return True

def validate_business_hours(value: time) -> time:
    """Valida que horário está em horário comercial razoável."""
    if value.hour < 6 or value.hour > 23:
        raise ValueError("Horário deve estar entre 18:00 e 23:00")
    return value
```

---

## ✅ Checklist de Implementação

### Backend

- [ ] Criar `utils/validators.py`
- [ ] Criar `utils/image_validator.py`
- [ ] Criar `utils/date_validators.py`
- [ ] Atualizar `schemas/member_schema.py`
- [ ] Atualizar `schemas/lodge_schema.py`
- [ ] Atualizar `routes/member_routes.py` (upload)
- [ ] Atualizar `schemas/session_schema.py`
- [ ] Adicionar validações em `models/models.py` (CheckConstraint)

### Frontend

- [ ] Criar `utils/validators.ts`
- [ ] Validação de CPF em tempo real
- [ ] Validação de email em tempo real
- [ ] Validação de telefone com máscara
- [ ] Validação de tamanho de arquivo antes do upload
- [ ] Preview de imagem com validação de dimensões
- [ ] Mensagens de erro mais descritivas

### Testes

- [ ] Testes para validadores
- [ ] Testes de upload com arquivos inválidos
- [ ] Testes de datas inválidas
- [ ] Testes de CPF/CNPJ inválidos

---

## 🎯 Prioridades

### Alta Prioridade (Implementar Agora)
1. ✅ Validação de CPF
2. ✅ Validação de upload de imagem
3. ✅ Validação de datas de sessão

### Média Prioridade (Próxima Sprint)
4. Validação de CNPJ
5. Validação de coordenadas
6. Validação de horários de sessão

### Baixa Prioridade (Backlog)
7. Validação de domínio de email
8. Validação de campos específicos por rito
9. Validação de histórico de cargos (datas não sobrepostas)

---

**Vou começar implementando as validações de alta prioridade!**
