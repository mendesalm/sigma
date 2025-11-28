# 🧪 Testes Automatizados - Backend Sigma

Documentação completa dos testes automatizados do projeto.

---

## 📋 Índice

- [Instalação](#instalação)
- [Execução](#execução)
- [Estrutura](#estrutura)
- [Tipos de Testes](#tipos-de-testes)
- [Cobertura](#cobertura)
- [Boas Práticas](#boas-práticas)

---

## 🚀 Instalação

### 1. Instalar Dependências de Teste

```bash
cd backend
pip install -r requirements-test.txt
```

As principais dependências são:
- `pytest` - Framework de testes
- `pytest-cov` - Cobertura de código
- `pytest-asyncio` - Suporte a testes assíncronos
- `httpx` - Cliente HTTP para testes de API

---

## ▶️ Execução

### Executar Todos os Testes

```bash
pytest
```

### Executar com Cobertura

```bash
pytest --cov --cov-report=html
```

Depois abra `htmlcov/index.html` no navegador para ver o relatório.

### Executar Testes Específicos

```bash
# Apenas testes unitários
pytest -m unit

# Apenas testes de integração
pytest -m integration

# Apenas validadores
pytest tests/test_validators.py

# Apenas schemas
pytest tests/test_schemas.py

# Teste específico
pytest tests/test_validators.py::TestCPFValidation::test_valid_cpf
```

### Executar com Verbose

```bash
pytest -v
pytest -vv  # Super verbose
```

### Executar Testes Falhados

```bash
# Re-executar apenas os testes que falharam
pytest --lf

# Re-executar falhas primeiro, depois os demais
pytest --ff
```

---

## 📁 Estrutura

```
backend/tests/
├── __init__.py              # Pacote de testes
├── conftest.py              # Fixtures compartilhadas
├── test_validators.py       # Testes dos validadores
├── test_schemas.py          # Testes dos schemas Pydantic
└── [futuros]
    ├── test_api_members.py  # Testes de API de membros
    ├── test_api_lodges.py   # Testes de API de lojas
    └── test_api_sessions.py # Testes de API de sessões
```

---

## 🎯 Tipos de Testes

### 1. Testes Unitários (`@pytest.mark.unit`)

Testam **funções individuais** sem dependências externas.

**Exemplo**: Validadores

```python
@pytest.mark.unit
def test_valid_cpf():
    assert validate_cpf("123.456.789-09") == True
```

**Características**:
- ✅ Rápidos (< 0.1s each)
- ✅ Isolados
- ✅ Sem banco de dados
- ✅ Sem rede

### 2. Testes de Integração (`@pytest.mark.integration`)

Testam **interação entre componentes**.

**Exemplo**: API + Banco de Dados

```python
@pytest.mark.integration
def test_create_member_api(client, super_admin_token):
    response = client.post(
        "/members",
        json={...},
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == 201
```

**Características**:
- ⏱️  Mais lentos (0.1s - 1s each)
- 🔗 Testam integração
- 💾 Usam banco de dados de teste
- 🌐 Podem fazer requisições HTTP

### 3. Testes de API (`@pytest.mark.api`)

Testam **endpoints da API** completos.

**Exemplo**: CRUD completo

```python
@pytest.mark.api
def test_member_crud_workflow(client, super_admin_token):
    # Create
    # Read
    # Update
    # Delete
```

---

## 📊 Cobertura

### Executar com Relatório

```bash
pytest --cov --cov-report=html
```

### Abrir Relatório HTML

```bash
# Windows
start htmlcov/index.html

# Linux/Mac
open htmlcov/index.html
```

### Meta de Cobertura

- 🎯 **Objetivo**: 80% de cobertura geral
- ✅ **Validators**: 100%
- ✅ **Schemas**: 95%+
- ⏳ **API Routes**: 70%+
- ⏳ **Services**: 70%+

---

## 🔧 Fixtures Disponíveis

As fixtures são definidas em `conftest.py` e podem ser usadas em qualquer teste:

### Banco de Dados

```python
def test_something(db_session):
    # db_session é uma sessão de banco de dados de teste
    member = Member(...)
    db_session.add(member)
    db_session.commit()
```

### Cliente API

```python
def test_api(client):
    # client é um TestClient do FastAPI
    response = client.get("/endpoint")
    assert response.status_code == 200
```

### Dados de Exemplo

```python
def test_with_data(sample_lodge, sample_member):
    # Loja e membro já criados e commitados
    assert sample_lodge.id > 0
    assert sample_member.id > 0
```

### Autenticação

```python
def test_authenticated(client, super_admin_token):
    # Token já gerado e válido
    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
```

---

## ✅ Boas Práticas

### 1. Nomenclatura

```python
# ✅ BOM
def test_valid_cpf_should_pass():
    ...

# ❌ RUIM
def test1():
    ...
```

### 2. Arrange-Act-Assert

```python
def test_create_member():
    # Arrange (Preparar)
    data = {"name": "João", ...}
    
    # Act (Executar)
    member = MemberCreate(**data)
    
    # Assert (Verificar)
    assert member.name == "João"
```

### 3. Um Assert por Teste

```python
# ✅ BOM - Foco específico
def test_cpf_format():
    assert validate_cpf("123.456.789-09") == True

def test_cpf_invalid():
    assert validate_cpf("111.111.111-11") == False

# ⚠️  Evitar - Múltiplos asserts não relacionados
def test_cpf():
    assert validate_cpf("123.456.789-09") == True
    assert validate_cpf("111.111.111-11") == False
    assert format_cpf("12345678909") == "123.456.789-09"
```

### 4. Use Parametrize para Casos Múltiplos

```python
@pytest.mark.parametrize("cpf,expected", [
    ("123.456.789-09", True),
    ("111.111.111-11", False),
    ("000.000.000-00", False),
])
def test_cpf_validation(cpf, expected):
    assert validate_cpf(cpf) == expected
```

### 5. Teste Casos de Erro

```python
def test_invalid_data_raises_error():
    with pytest.raises(ValidationError) as exc_info:
        MemberCreate(cpf="invalid")
    
    assert "CPF inválido" in str(exc_info.value)
```

---

## 📈 Estatísticas Atuais

```
Testes Implementados:
- test_validators.py:  ~40 testes
- test_schemas.py:     ~25 testes
TOTAL:                 ~65 testes

Cobertura Atual:
- validators.py:       ~95%
- member_schema.py:    ~90%
- lodge_schema.py:     ~90%
- session_schema.py:   ~85%
```

---

## 🐛 Debug de Testes

### Ver Output Completo

```bash
pytest -s  # Mostra prints
pytest -vv  # Muito verbose
```

### Usar Debugger

```python
def test_something():
    import pdb; pdb.set_trace()  # Breakpoint
    assert something == True
```

Ou use a flag `--pdb`:

```bash
pytest --pdb  # Para no primeiro erro
```

---

## 📝 Exemplos de Testes

### Teste Unitário Simples

```python
@pytest.mark.unit
def test_sanitize_cpf_removes_formatting():
    result = sanitize_cpf("123.456.789-09")
    assert result == "12345678909"
```

### Teste de Schema

```python
@pytest.mark.unit
def test_invalid_cpf_rejected():
    with pytest.raises(ValidationError) as exc:
        MemberCreate(
            full_name="João Silva",
            email="joao@test.com",
            cpf="111.111.111-11",
            password="Test123"
        )
    
    errors = exc.value.errors()
    assert any('cpf' in str(e['loc']) for e in errors)
```

### Teste de API (Futuro)

```python
@pytest.mark.integration
def test_create_member_via_api(client, super_admin_token):
    response = client.post(
        "/members",
        json={
            "full_name": "João Silva",
            "email": "joao@test.com",
            "cpf": "111.444.777-35",
            "password": "Test Password123",
            "lodge_id": 1
        },
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "João Silva"
    assert "id" in data
```

---

## 🎯 Próximos Passos

- [ ] Testes de API para membros
- [ ] Testes de API para lojas
- [ ] Testes de API para sessões
- [ ] Testes de upload de imagens
- [ ] Testes de autenticação
- [ ] Testes de permissões
- [ ] CI/CD integration

---

## 📚 Recursos

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Coverage.py](https://coverage.readthedocs.io/)

---

**Testes são investimento, não custo!** 🚀
