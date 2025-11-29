# 📘 API Reference - Sigma

Referência rápida dos principais endpoints da API Sigma.

**Base URL**: `http://localhost:8000`  
**Documentação Interativa**: http://localhost:8000/docs

---

## 🔐 Autenticação

Todos os endpoints (exceto login) requerem header de autorização:

```http
Authorization: Bearer {token}
```

### Login

```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=email@example.com&password=senha123
```

**Response 200**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_type": "webmaster",
  "user_id": 1,
  "needs_affiliation_selection": false
}
```

---

## 👥 Membros

### Listar Membros

```http
GET /members?skip=0&limit=100
```

**Response 200**:
```json
[
  {
    "id": 1,
    "full_name": "João Silva",
    "email": "joao@email.com",
    "cim": "272875",
    "degree": "Mestre",
    "profile_picture_path": "/storage/lodges/loja_2181/profile_pictures/272875.jpg",
    "lodge_associations": [...]
  }
]
```

### Criar Membro

```http
POST /members
Content-Type: application/json

{
  "full_name": "João Silva",
  "email": "joao@email.com",
  "cpf": "123.456.789-00",
  "cim": "272875",
  "password": "senha123",
  "lodge_id": 1,
  "degree": "Aprendiz",
  "registration_status": "Pendente"
}
```

**Response 201**:
```json
{
  "id": 1,
  "full_name": "João Silva",
  ...
}
```

### Obter Membro

```http
GET /members/{id}
```

### Atualizar Membro

```http
PUT /members/{id}
Content-Type: application/json

{
  "full_name": "João Pedro Silva",
  "degree": "Companheiro"
}
```

### Deletar Membro

```http
DELETE /members/{id}
```

### Upload de Foto de Perfil

```http
POST /members/{id}/photo
Content-Type: multipart/form-data

file: [arquivo de imagem]
```

**Response 200**:
```json
{
  "filename": "272875.jpg",
  "path": "/storage/lodges/loja_2181/profile_pictures/272875.jpg"
}
```

**Erros**:
- `400`: Membro não tem CIM
- `403`: Sem permissão
- `404`: Membro não encontrado

---

## 🏛️ Lojas

### Listar Lojas

```http
GET /lodges?skip=0&limit=100
```

### Criar Loja

```http
POST /lodges
Content-Type: application/json

{
  "lodge_name": "Acácia do Cerrado",
  "lodge_number": "2181",
  "foundation_date": "2010-05-15",
  "rite": "Rito Escocês Antigo e Aceito",
  "obedience_id": 1,
  "email": "secretaria@loja.com",
  "technical_contact_name": "João Silva",
  "technical_contact_email": "webmaster@loja.com"
}
```

### Obter Loja

```http
GET /lodges/{id}
```

### Atualizar Loja

```http
PUT /lodges/{id}
```

### Deletar Loja

```http
DELETE /lodges/{id}
```

---

## 📅 Sessões Maçônicas

### Listar Sessões

```http
GET /masonic-sessions?skip=0&limit=100
```

### Criar Sessão

```http
POST /masonic-sessions
Content-Type: application/json

{
  "title": "Sessão Magna de Iniciação",
  "session_date": "2025-11-28",
  "start_time": "20:00:00",
  "lodge_id": 1
}
```

**Response 201**:
```json
{
  "id": 1,
  "title": "Sessão Magna de Iniciação",
  "status": "AGENDADA",
  "session_date": "2025-11-28",
  "start_time": "20:00:00",
  "lodge_id": 1
}
```

### Iniciar Sessão

```http
POST /masonic-sessions/{id}/start
```

**Response 200**:
```json
{
  "id": 1,
  "status": "EM_ANDAMENTO",
  ...
}
```

### Finalizar Sessão

```http
POST /masonic-sessions/{id}/end
```

**Response 200**:
```json
{
  "id": 1,
  "status": "REALIZADA",
  ...
}
```

---

## ✅ Presenças

### Registro Manual de Presença

```http
POST /masonic-sessions/{session_id}/attendance/manual
Content-Type: application/json

{
  "member_id": 1,
  "attendance_status": "Presente"
}
```

### Check-in por QR Code

```http
POST /check-in/qr
Content-Type: application/json

{
  "user_id": 1,
  "lodge_id": 1,
  "latitude": -15.7942,
  "longitude": -47.8822
}
```

**Response 200**:
```json
{
  "message": "Check-in realizado com sucesso",
  "is_visitor": false,
  "attendance_id": 1
}
```

**Validações**:
- ✅ Usuário autenticado
- ✅ Sessão ativa (EM_ANDAMENTO)
- ✅ Dentro do raio geográfico
- ✅ Dentro da janela de tempo

---

## 📋 Cargos

### Listar Cargos

```http
GET /roles
```

### Criar Cargo

```http
POST /roles
Content-Type: application/json

{
  "name": "Venerável Mestre",
  "role_type": "Loja",
  "level": 9,
  "base_credential": 90
}
```

### Adicionar Cargo ao Histórico do Membro

```http
POST /members/{member_id}/roles
Content-Type: application/json

{
  "role_id": 1,
  "start_date": "2025-01-01",
  "end_date": null
}
```

**Response 201**:
```json
{
  "id": 1,
  "role_id": 1,
  "member_id": 1,
  "lodge_id": 1,
  "start_date": "2025-01-01",
  "end_date": null
}
```

### Remover Cargo do Histórico

```http
DELETE /members/{member_id}/roles/{role_history_id}
```

---

## 🎟️ Obediências

### Listar Obediências

```http
GET /obediences
```

### Criar Obediência

```http
POST /obediences
Content-Type: application/json

{
  "name": "Grande Loja Maçônica do Brasil",
  "acronym": "GLMB",
  "type": "Federal",
  "email": "contato@glmb.org.br",
  "technical_contact_name": "João Silva",
  "technical_contact_email": "ti@glmb.org.br"
}
```

---

## 👨‍💼 Super Admins

### Listar Super Admins

```http
GET /super-admins
```

### Criar Super Admin

```http
POST /super-admins
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@sistema.com",
  "password": "Senha@123"
}
```

### Reset de Senha

```http
POST /super-admins/{id}/reset-password
```

---

## 🌐 Webmasters

### Listar Webmasters

```http
GET /webmasters
```

### Reset de Senha

```http
POST /webmasters/{id}/reset-password
```

---

## 📊 Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| `200` | OK - Requisição bem-sucedida |
| `201` | Created - Recurso criado com sucesso |
| `204` | No Content - Sucesso sem corpo de resposta |
| `400` | Bad Request - Dados inválidos |
| `401` | Unauthorized - Token inválido ou ausente |
| `403` | Forbidden - Sem permissão |
| `404` | Not Found - Recurso não encontrado |
| `409` | Conflict - Duplicação de dados (email, CPF, etc.) |
| `500` | Internal Server Error - Erro no servidor |

---

## 🔍 Filtros e Paginação

A maioria dos endpoints GET suporta paginação:

```http
GET /members?skip=0&limit=50
GET /lodges?skip=20&limit=10
GET /masonic-sessions?skip=0&limit=100
```

**Parâmetros**:
- `skip`: Número de registros para pular (default: 0)
- `limit`: Número máximo de registros (default: 100)

---

## 📝 Exemplos de Uso com cURL

### Login e Upload de Foto

```bash
# 1. Login
TOKEN=$(curl -s -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@email.com&password=senha123" \
  | jq -r '.access_token')

# 2. Upload de foto
curl -X POST "http://localhost:8000/members/1/photo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@foto.jpg"
```

### Criar Membro Completo

```bash
curl -X POST "http://localhost:8000/members" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "João Silva",
    "email": "joao@email.com",
    "cpf": "123.456.789-00",
    "cim": "272875",
    "password": "senha123",
    "lodge_id": 1,
    "degree": "Aprendiz",
    "phone": "(61) 99999-9999",
    "street_address": "Rua Exemplo",
    "city": "Brasília",
    "family_members": [
      {
        "full_name": "Maria Silva",
        "relationship_type": "Esposa",
        "phone": "(61) 98888-8888"
      }
    ]
  }'
```

---

## 🎯 Exemplos de Response de Erro

### 400 - Bad Request

```json
{
  "detail": "Member must have a CIM to upload profile picture"
}
```

### 401 - Unauthorized

```json
{
  "detail": "Could not validate credentials"
}
```

### 403 - Forbidden

```json
{
  "detail": "You can only create members for your own lodge"
}
```

### 404 - Not Found

```json
{
  "detail": "Member not found"
}
```

### 409 - Conflict

```json
{
  "detail": "Email already registered"
}
```

---

## 🔗 Links Relacionados

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **README**: [README.md](../README.md)
- **Plano de Melhorias**: [PLANO_MELHORIAS.md](../PLANO_MELHORIAS.md)

---

**Última atualização**: 28/11/2025
