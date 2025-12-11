# ✅ Validações Implementadas - Resumo

**Data**: 2025-11-28  
**Status**: Parcialmente Implementado

---

## 📊 O que foi implementado:

### 1. **Módulo de Validadores** (`backend/utils/validators.py`) ✅

Funções de validação criadas:

#### Validadores:
- ✅ `validate_cpf(cpf)` - Valida CPF com dígitos verificadores
- ✅ `validate_cnpj(cnpj)` - Valida CNPJ com dígitos verificadores  
- ✅ `validate_cep(cep)` - Valida formato de CEP
- ✅ `validate_phone(phone)` - Valida telefone fixo e celular
- ✅ `validate_coordinates(lat, lng)` - Valida coordenadas geográficas
- ✅ `validate_cim(cim)` - Valida formato de CIM
- ✅ `validate_email_domain(email, allowed)` - Valida domínio de email

#### Funções de Sanitização:
- ✅ `sanitize_cpf(cpf)` - Remove formatação do CPF
- ✅ `sanitize_cnpj(cnpj)` - Remove formatação do CNPJ
- ✅ `sanitize_phone(phone)` - Remove formatação do telefone

#### Funções de Formatação:
- ✅ `format_cpf(cpf)` - Formata CPF (XXX.XXX.XXX-XX)
- ✅ `format_cnpj(cnpj)` - Formata CNPJ (XX.XXX.XXX/XXXX-XX)
- ✅ `format_phone(phone)` - Formata telefone ((XX) XXXXX-XXXX)

### 2. **Módulo de Validação de Imagens** (`backend/utils/image_validator.py`) ✅

Funções criadas:

- ✅ `validate_image(file)` - Validação completa de imagem
  - Tipo MIME (JPEG, PNG, GIF, WebP)
  - Extensão do arquivo
  - Tamanho máximo (5MB)
  - Dimensões mínimas (100x100px)
  - Dimensões máximas (4000x4000px)
  - Verifica se é imagem válida (PIL)

- ✅ `validate_image_light(file)` - Validação rápida (tipo + tamanho)

- ✅ `get_image_info(contents)` - Obtém informações da imagem

- ✅ `resize_image_if_needed(contents)` - Redimensiona imagem se necessário

### 3. **Integração no Upload de Foto** ✅

**Arquivo**: `backend/routes/member_routes.py`

- ✅ Importação do `validate_image`
- ✅ Validação do arquivo antes de salvar
- ✅ Tratamento de erros de validação
- ✅ Uso do conteúdo validado para salvar

---

## 📝 Exemplo de Uso

### Validando CPF:

```python
from backend.utils.validators import validate_cpf, format_cpf

# Validar
cpf = "123.456.789-09"
if validate_cpf(cpf):
    print("CPF válido!")
    
# Formatar
cpf_limpo = "12345678909"
cpf_formatado = format_cpf(cpf_limpo)  # "123.456.789-09"
```

### Validando Imagem:

```python
from backend.utils.image_validator import validate_image

@router.post("/upload")
async def upload(file: UploadFile):
    # Valida automaticamente tipo, tamanho e dimensões
    contents = await validate_image(file)
    
    # Se chegar aqui, imagem é válida
    with open("foto.jpg", "wb") as f:
        f.write(contents)
```

---

## 🧪 Testes Necessários

### Testar Upload de Fotos com Validação:

```bash
# ❌ Deve falhar - Arquivo muito grande (>5MB)
curl -X POST "http://localhost:8000/members/1/photo" \
  -H "Authorization: Bearer {token}" \
  -F "file=@imagem_grande.jpg"

# ❌ Deve falhar - Tipo inválido (PDF)
curl -X POST "http://localhost:8000/members/1/photo" \
  -H "Authorization: Bearer {token}" \
  -F "file=@documento.pdf"

# ❌ Deve falhar - Imagem muito pequena (<100x100px)
curl -X POST "http://localhost:8000/members/1/photo" \
  -H "Authorization: Bearer {token}" \
  -F "file=@icon_16x16.png"

# ✅ Deve funcionar - JPEG válido
curl -X POST "http://localhost:8000/members/1/photo" \
  -H "Authorization: Bearer {token}" \
  -F "file=@foto_perfil.jpg"
```

---

## 🎯 Próximos Passos

### Pendente de Implementação:

#### 1. Atualizar Schemas Pydantic (Alta Prioridade)

**Arquivo**: `backend/schemas/member_schema.py`

```python
from pydantic import BaseModel, Field, validator, EmailStr
from ..utils.validators import validate_cpf, validate_phone

class MemberCreate(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    cpf: str = Field(..., regex=r'^\d{3}\.\d{3}\.\d{3}-\d{2}$')
    phone: Optional[str] = None
    cim: Optional[str] = Field(None, min_length=4, max_length=20)
    
    @validator('cpf')
    def validate_cpf_digits(cls, v):
        if not validate_cpf(v):
            raise ValueError('CPF inválido')
        return v
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v and not validate_phone(v):
            raise ValueError('Telefone inválido')
        return v
```

#### 2. Atualizar Schema de Lodge

**Arquivo**: `backend/schemas/lodge_schema.py`

```python
from ..utils.validators import validate_cnpj, validate_cep, validate_coordinates

class LodgeCreate(BaseModel):
    cnpj: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    @validator('cnpj')
    def validate_cnpj_digits(cls, v):
        if v and not validate_cnpj(v):
            raise ValueError('CNPJ inválido')
        return v
    
    @validator('zip_code')
    def validate_cep_format(cls, v):
        if v and not validate_cep(v):
            raise ValueError('CEP inválido')
        return v
    
    @root_validator
    def validate_coords(cls, values):
        lat, lng = values.get('latitude'), values.get('longitude')
        if not validate_coordinates(lat, lng):
            raise ValueError('Coordenadas inválidas')
        return values
```

#### 3. Validação no Frontend (TypeScript)

**Arquivo**: `frontend/src/utils/validators.ts`

```typescript
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  // Implementar lógica de validação
}

export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
```

#### 4. Validação de Imagem no Frontend

**Arquivo**: `frontend/src/components/ImageUpload.tsx`

```typescript
const validateImageBeforeUpload = (file: File): string | null => {
  // Tipo
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    return 'Tipo de arquivo não permitido';
  }
  
  // Tamanho
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'Arquivo muito grande (máximo 5MB)';
  }
  
  return null; // Válido
};
```

#### 5. Criar Testes Automatizados

**Arquivo**: `backend/tests/test_validators.py`

```python
import pytest
from backend.utils.validators import validate_cpf, validate_cnpj

def test_valid_cpf():
    assert validate_cpf("123.456.789-09") == True
    
def test_invalid_cpf():
    assert validate_cpf("123.456.789-00") == False
    assert validate_cpf("111.111.111-11") == False
    
def test_valid_cnpj():
    assert validate_cnpj("11.222.333/0001-81") == True
```

**Arquivo**: `backend/tests/test_image_upload.py`

```python
import pytest
from fastapi.testclient import TestClient

def test_upload_valid_image(client, auth_token):
    with open("test_image.jpg", "rb") as f:
        response = client.post(
            "/members/1/photo",
            files={"file": ("test.jpg", f, "image/jpeg")},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
    assert response.status_code == 200

def test_upload_file_too_large(client, auth_token):
    # Criar arquivo de 6MB (maior que limite)
    large_file = b"x" * (6 * 1024 * 1024)
    response = client.post(
        "/members/1/photo",
        files={"file": ("large.jpg", large_file, "image/jpeg")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400
    assert "muito grande" in response.json()["detail"].lower()
```

---

## ✅ Checklist de Implementação

### Backend

- [x] Criar `utils/validators.py`
- [x] Criar `utils/image_validator.py`
- [x] Integrar validação de imagem no upload
- [ ] Atualizar `schemas/member_schema.py`
- [ ] Atualizar `schemas/lodge_schema.py`
- [ ] Atualizar `schemas/session_schema.py`
- [ ] Adicionar validações em `models/models.py` (CheckConstraint)

### Frontend

- [ ] Criar `utils/validators.ts`
- [ ] Validação de CPF em tempo real
- [ ] Validação de imagem antes do upload
- [ ] Máscaras de input (CPF, telefone, CEP)
- [ ] Mensagens de erro mais descritivas

### Testes

- [ ] Testes para `validators.py`
- [ ] Testes para `image_validator.py`
- [ ] Testes de integração de upload
- [ ] Testes de schemas com dados inválidos

### Documentação

- [x] Documentar validadores criados
- [ ] Atualizar API Reference com validações
- [ ] Adicionar exemplos de erros de validação

---

## 📊 Estatísticas

- **Funções de validação criadas**: 10
- **Funções de formatação criadas**: 3
- **Endpoints com validação**: 1 (upload de foto)
- **Tipos de arquivo validados**: 4 (JPEG, PNG, GIF, WebP)
- **Tamanho máximo de arquivo**: 5MB
- **Dimensões mínimas**: 100x100px
- **Dimensões máximas**: 4000x4000px

---

##🎯 Resultado Parcial

✅ **Validadores base implementados!**  
✅ **Upload de fotos com validação robusta!**  
⏳ **Pendente: Integrar em outros schemas e frontend**

---

**Próxima ação**: Quer que eu implemente as validações nos schemas Pydantic ou prefere focar em outra área?
