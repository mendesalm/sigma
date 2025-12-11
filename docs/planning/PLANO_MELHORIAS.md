# 🔧 Plano de Melhorias no Sistema Atual

**Data de Início**: 2025-11-28  
**Objetivo**: Solidificar a base do sistema com melhorias em validações, testes, performance e documentação

---

## 📋 1. Auditoria e Análise Inicial

### 1.1. Análise de Código
- [ ] Identificar endpoints sem validações adequadas
- [ ] Verificar tratamento de erros inconsistente
- [ ] Localizar queries N+1 (problemas de performance)
- [ ] Identificar código duplicado
- [ ] Verificar segurança (SQL injection, XSS, etc.)

### 1.2. Análise de Dados
- [ ] Verificar integridade dos índices no banco
- [ ] Identificar campos sem constraints adequados
- [ ] Verificar relacionamentos em cascata
- [ ] Analisar performance de queries lentas

---

## 🛡️ 2. Validações Adicionais

### 2.1. Backend - Validações de Dados

#### Models (SQLAlchemy)
- [x] Adicionar `CheckConstraint` para campos com regras de negócio - **FEITO**
- [ ] Garantir `nullable=False` em campos obrigatórios
- [x] Adicionar validações de formato (email, CPF, telefone) - **FEITO (via utils/validators.py)**
- [x] Implementar validações de data (data_fim > data_inicio) - **FEITO (via Schemas)**

#### Schemas (Pydantic)
- [x] Adicionar `Field` com min_length, max_length - **FEITO**
- [x] Implementar validators customizados - **FEITO**
- [x] Adicionar validações de formato (regex) - **FEITO**
- [x] Implementar validações de consistência entre campos - **FEITO**

#### Exemplos de Melhorias:
```python
# ANTES
class MemberCreate(BaseModel):
    email: str
    cpf: str

# DEPOIS
class MemberCreate(BaseModel):
    email: EmailStr = Field(..., description="Email válido do membro")
    cpf: str = Field(..., min_length=11, max_length=14, pattern=r'^\d{3}\.\d{3}\.\d{3}-\d{2}$')
    
    @validator('cpf')
    def validate_cpf(cls, v):
        # Lógica de validação de CPF
        return v
```

### 2.2. Frontend - Validações

- [ ] Validações em tempo real nos formulários
- [ ] Mensagens de erro mais descritivas
- [x] Validações consistentes com o backend - **FEITO (utils/validators.ts)**
- [ ] Feedback visual claro de erros

---

## 🧪 3. Testes Automatizados

### 3.1. Backend - Testes Unitários

#### Estrutura de Testes
```
backend/
└── tests/
    ├── __init__.py
    ├── conftest.py           # Fixtures compartilhadas
    ├── test_validators.py    # Testes de validadores
    ├── test_schemas.py       # Testes de schemas
    ├── test_auth.py          # Testes de autenticação
    ├── test_members.py       # Testes de membros
    ├── test_lodges.py        # Testes de lojas
    ├── test_sessions.py      # Testes de sessões
    └── test_upload.py        # Testes de upload
```

#### Tarefas:
- [x] Configurar pytest - **FEITO**
- [x] Criar fixtures para banco de dados de teste - **FEITO**
- [x] Testes para validadores e schemas - **FEITO**
- [ ] Testes para autenticação (login, JWT)
- [ ] Testes para CRUD de membros
- [ ] Testes para CRUD de lojas
- [ ] Testes para upload de fotos
- [ ] Testes para sessões maçônicas
- [ ] Testes para permissões e autorização

#### Exemplo:
```python
# tests/test_members.py
def test_create_member_success(client, webmaster_token):
    response = client.post(
        "/members/",
        json={"full_name": "Test Member", "email": "test@test.com", ...},
        headers={"Authorization": f"Bearer {webmaster_token}"}
    )
    assert response.status_code == 201
    assert response.json()["full_name"] == "Test Member"

def test_create_member_without_cim_upload_fails(client, webmaster_token):
    # Criar membro sem CIM
    # Tentar upload de foto
    # Deve retornar 400
```

### 3.2. Frontend - Testes

- [ ] Configurar Jest + React Testing Library
- [ ] Testes de componentes isolados
- [ ] Testes de integração de formulários
- [ ] Testes de rotas e navegação

---

## ⚡ 4. Performance e Otimização

### 4.1. Backend

#### Queries Otimizadas
- [ ] Identificar e corrigir N+1 queries
- [ ] Adicionar `joinedload` para relacionamentos
- [ ] Implementar paginação onde faltando
- [ ] Adicionar índices no banco de dados

#### Exemplo:
```python
# ANTES - N+1 Query
members = db.query(Member).all()
for member in members:
    print(member.lodge_associations)  # Query adicional para cada membro!

# DEPOIS - Eager Loading
members = db.query(Member).options(
    joinedload(Member.lodge_associations)
).all()
```

#### Cache
- [ ] Implementar cache para queries frequentes
- [ ] Cache de sessões ativas
- [ ] Cache de permissões de usuário

#### Compressão
- [ ] Habilitar compressão GZIP
- [ ] Otimizar tamanho de imagens no upload

### 4.2. Frontend

- [ ] Code splitting por rota
- [ ] Lazy loading de componentes pesados
- [ ] Otimização de imagens
- [ ] Memoização de componentes (React.memo)
- [ ] Debounce em buscas

### 4.3. Banco de Dados

#### Índices Necessários:
```sql
-- Verificar e adicionar índices
CREATE INDEX idx_members_cim ON members(cim);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_lodge_associations_member ON member_lodge_associations(member_id);
CREATE INDEX idx_session_attendance_session ON session_attendances(session_id);
```

---

## 📚 5. Documentação de API (Swagger/OpenAPI)

### 5.1. Configuração

- [ ] Configurar FastAPI automatic docs
- [ ] Adicionar descrições detalhadas nos endpoints
- [ ] Documentar schemas de request/response
- [ ] Adicionar exemplos de uso

#### Exemplo:
```python
@router.post(
    "/members/{member_id}/photo",
    status_code=status.HTTP_200_OK,
    summary="Upload de foto de perfil",
    description="""
    Faz upload da foto de perfil de um membro.
    
    **Regras**:
    - Membro deve ter CIM cadastrado
    - Webmaster só pode fazer upload para membros de sua loja
    - SuperAdmin pode fazer upload para qualquer membro
    
    **Estrutura de armazenamento**:
    `storage/lodges/loja_{lodge_number}/profile_pictures/{cim}.ext`
    """,
    responses={
        200: {"description": "Upload realizado com sucesso"},
        400: {"description": "Membro não tem CIM"},
        403: {"description": "Usuário não autorizado"},
        404: {"description": "Membro não encontrado"}
    }
)
def upload_profile_picture(...):
    ...
```

### 5.2. Documentação Adicional

- [ ] README.md atualizado com instruções de setup
- [ ] CONTRIBUTING.md com guia de contribuição
- [ ] API.md com lista completa de endpoints
- [ ] ARCHITECTURE.md com visão geral da arquitetura

---

## 🔒 6. Segurança

### 6.1. Validações de Segurança

- [ ] Rate limiting em endpoints sensíveis (login, upload)
- [ ] Validação de tamanho de arquivo (upload)
- [ ] Sanitização de inputs
- [ ] CORS configurado adequadamente para produção
- [ ] Headers de segurança (HSTS, CSP, X-Frame-Options)

### 6.2. Auditoria

- [ ] Logging de ações sensíveis
- [ ] Registro de tentativas de login falhas
- [ ] Monitoramento de uploads suspeitos

---

## 📊 7. Monitoramento e Logging

### 7.1. Logging Estruturado

```python
import logging
from pythonjsonlogger import jsonlogger

# Configurar logger
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)

# Usar em endpoints
@router.post("/members/")
def create_member(...):
    logger.info("Creating member", extra={
        "user_id": current_user.get("user_id"),
        "user_type": current_user.get("user_type"),
        "lodge_id": member.lodge_id
    })
```

### 7.2. Métricas

- [ ] Implementar health check endpoint
- [ ] Monitorar tempo de resposta de endpoints
- [ ] Rastrear erros e exceções

---

## 🗂️ 8. Organização de Código

### 8.1. Refatoração

- [ ] Extrair lógica complexa para helpers
- [ ] Criar constants.py para valores mágicos
- [ ] Implementar enums para status
- [ ] Separar validações em módulo próprio

### 8.2. Type Hints

- [ ] Adicionar type hints em todas as funções
- [ ] Usar mypy para verificação estática
- [ ] Documentar tipos complexos com TypedDict

---

## 📅 Cronograma Sugerido

### Semana 1: Validações e Segurança
- Dia 1-2: Auditoria e identificação de melhorias
- Dia 3-4: Implementar validações backend
- Dia 5: Implementar validações frontend

### Semana 2: Testes
- Dia 1-2: Configurar infraestrutura de testes
- Dia 3-5: Escrever testes para funcionalidades críticas

### Semana 3: Performance e Documentação
- Dia 1-2: Otimizar queries e adicionar índices
- Dia 3-4: Melhorar documentação da API
- Dia 5: Implementar logging e monitoramento

---

## ✅ Critérios de Sucesso

- [ ] Cobertura de testes > 70%
- [ ] Todos endpoints documentados no Swagger
- [ ] Tempo de resposta < 200ms para 95% das requests
- [ ] Zero vulnerabilidades críticas de segurança
- [ ] Logging estruturado em produção
- [ ] README completo e atualizado

---

## 🚀 Próximo Passo Imediato

**Vamos começar com uma auditoria rápida do código atual para identificar os pontos mais críticos!**

Quer que eu:
1. **Faça uma auditoria do backend** identificando validações faltantes?
2. **Configure a estrutura de testes** com pytest?
3. **Analise performance** das queries atuais?
4. **Configure documentação Swagger** completa?

Qual dessas ações você gostaria de priorizar primeiro?
