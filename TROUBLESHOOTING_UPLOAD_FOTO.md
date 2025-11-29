# 🔧 Troubleshooting: Erro de CORS no Upload de Foto

## Problema
```
Access to XMLHttpRequest at 'http://localhost:8000/members/1/photo' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Causa
O erro de CORS ocorreu porque o `StaticFiles` estava sendo montado **antes** dos routers no `main.py`. Isso pode fazer com que requisições OPTIONS (preflight) sejam interceptadas antes que o middleware CORS seja aplicado corretamente.

## Solução Implementada

### ✅ Alteração em `backend/main.py`

**Ordem ANTIGA (incorreta)**:
```python
# Configure CORS
app.add_middleware(CORSMiddleware, ...)

# Mount StaticFiles ⚠️ ANTES dos routers
app.mount("/storage", StaticFiles(...))

# Include routers
app.include_router(member_routes.router)
```

**Ordem NOVA (correta)**:
```python
# Configure CORS
app.add_middleware(CORSMiddleware, ...)

# Include routers ✅ ANTES do StaticFiles
app.include_router(member_routes.router)

# Mount StaticFiles ✅ DEPOIS dos routers
app.mount("/storage", StaticFiles(...))
```

## 🔄 Passos para Resolver

### 1. **Reiniciar o Backend**

O servidor backend PRECISA ser reiniciado para aplicar as mudanças no `main.py`:

**Windows PowerShell**:
```powershell
# Parar o servidor (Ctrl+C no terminal onde está rodando)

# Reiniciar
cd c:\Users\engan\OneDrive\Área de Trabalho\sigma\backend
uvicorn main:app --reload
```

### 2. **Verificar se o Backend está Rodando**

Abra o navegador em: http://localhost:8000/

Você deve ver:
```json
{"message": "Welcome to the Sigma Backend"}
```

### 3. **Testar a Funcionalidade**

1. Acesse o formulário de membro (criar ou editar)
2. Preencha o campo **CIM** (OBRIGATÓRIO para upload de foto)
3. Clique em "Alterar Foto" e selecione uma imagem
4. Salve o membro

### 4. **Verificar o Console do Navegador**

Após salvar, você NÃO deve ver mais o erro de CORS. Se ainda houver erro, verifique:

- ✅ Backend foi reiniciado?
- ✅ Membro tem CIM preenchido?
- ✅ Console mostra "Sending Authorization header with token"?

## 📊 Logs Esperados

### Console do Frontend (Browser)
```
Sending Authorization header with token: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
```

### Console do Backend (Terminal)
```
INFO:     127.0.0.1:xxxxx - "POST /members/1/photo HTTP/1.1" 200 OK
```

## ❗ Validações Importantes

O endpoint `/members/{member_id}/photo` tem as seguintes validações:

### 1. **Membro deve ter CIM**
Se o membro não tiver CIM, o backend retorna:
```json
{"detail": "Member must have a CIM to upload profile picture"}
```

### 2. **Usuário deve ter permissão**
- **Webmaster**: Pode fazer upload apenas para membros de sua loja
- **SuperAdmin**: Pode fazer upload para qualquer membro

### 3. **Membro deve estar associado a uma loja**
```json
{"detail": "Cannot determine lodge for member"}
```

## 🔍 Verificação Manual

### Testar endpoint com Postman/Insomnia:

**Request**:
```
POST http://localhost:8000/members/1/photo
Headers:
  Authorization: Bearer {seu_token_aqui}
Body:
  form-data
    file: [selecionar arquivo de imagem]
```

**Response esperada**:
```json
{
  "filename": "123456.jpg",
  "path": "/storage/lodges/loja_2181/profile_pictures/123456.jpg"
}
```

## 🐛 Outros Erros Comuns

### 1. **Blob URL não carrega no preview**
```
blob:http://localhost:5173/f2bf95de-4563-4124-b481-b8a5b579e982:1 Failed to load resource: net::ERR_FILE_NOT_FOUND
```
**Solução**: Isso é normal. É apenas o preview local antes do upload.

### 2. **"value prop on input should not be null"**
Warning do React sobre inputs controlados. Não afeta a funcionalidade, mas pode ser corrigido garantindo que todos os campos tenham valores iniciais (string vazia em vez de null).

### 3. **Upload funciona mas foto não aparece**
- Verifique se o caminho no banco está correto: `/storage/lodges/loja_{id}/profile_pictures/{cim}.ext`
- Verifique se o arquivo foi criado fisicamente no diretório
- Verifique se o frontend está montando a URL corretamente

## ✅ Checklist de Verificação

- [ ] Backend reiniciado após mudanças no `main.py`
- [ ] CORS configurado com `allow_origins=["*"]`
- [ ] Routers incluídos ANTES do StaticFiles
- [ ] Campo CIM preenchido no formulário do membro
- [ ] Token de autorização está sendo enviado
- [ ] Diretório `storage/lodges/loja_{id}/profile_pictures` existe
- [ ] Permissões de escrita no diretório storage

## 📞 Se o Problema Persistir

1. **Limpe o cache do navegador** (Ctrl+Shift+Del)
2. **Verifique os logs do backend** no terminal
3. **Teste com curl**:
```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@caminho/para/imagem.jpg" \
  http://localhost:8000/members/1/photo
```

---

**Data**: 2025-11-28  
**Status**: ✅ Correção Implementada - Reinicie o backend
