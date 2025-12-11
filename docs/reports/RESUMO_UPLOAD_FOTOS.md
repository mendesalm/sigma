# ✅ Implementação Concluída: Upload de Fotos de Perfil com CIM

## 📋 Resumo das Alterações

### 1. **Backend - Endpoint de Upload** (`backend/routes/member_routes.py`)

#### Mudanças Implementadas:
- ✅ Adicionada validação para garantir que o membro possui CIM antes do upload
- ✅ Estrutura de diretórios alterada de `storage/{lodge_code}/profile_pictures` para `storage/lodges/loja_{lodge_id}/profile_pictures`
- ✅ Nome do arquivo alterado de `{member_id}.ext` para `{cim}.ext`
- ✅ Caminho relativo armazenado no banco: `/storage/lodges/loja_{lodge_id}/profile_pictures/{cim}.ext`

#### Validações:
- Membro deve ter CIM cadastrado (retorna erro 400 se não tiver)
- Usuário deve ter permissão (Webmaster da loja ou SuperAdmin)
- Membro deve estar associado a uma loja

---

### 2. **Script de Migração** (`backend/migrate_photo.py`)

#### Funcionalidades:
- ✅ Script genérico que migra TODAS as fotos existentes no banco
- ✅ Busca todos os membros com `profile_picture_path` não nulo
- ✅ Valida se o membro tem CIM e associação com loja
- ✅ Copia arquivos da estrutura antiga para a nova
- ✅ Atualiza os caminhos no banco de dados
- ✅ Relatório detalhado com contadores (migrados, pulados, erros)

#### Como executar:
```bash
cd backend
python migrate_photo.py
```

---

### 3. **Documentação Técnica** (`docs/upload_fotos_perfil.md`)

Criada documentação completa incluindo:
- ✅ Estrutura de armazenamento
- ✅ Especificação do endpoint
- ✅ Exemplos de uso no frontend
- ✅ Guia de migração
- ✅ Considerações de segurança
- ✅ Sugestões de melhorias futuras

---

## 📁 Estrutura de Diretórios

### Antes:
```
sigma/storage/
├── loja2181/
│   └── profile_pictures/
│       ├── 1.jpg
│       ├── 2.jpg
│       └── 3.png
```

### Depois:
```
sigma/storage/
└── lodges/
    ├── loja_1/
    │   └── profile_pictures/
    │       ├── 123456.jpg     # CIM do membro
    │       └── 789012.png
    └── loja_2/
        └── profile_pictures/
            └── 345678.jpeg
```

---

## 🔄 Fluxo de Upload (Frontend → Backend)

### 1. Usuário seleciona foto no `MemberForm.tsx`:
```tsx
<input 
  hidden 
  accept="image/*" 
  type="file" 
  onChange={(e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Preview local
      setFormState({ 
        ...formState, 
        profile_picture_path: URL.createObjectURL(file) 
      });
    }
  }}
/>
```

### 2. Após salvar o membro, faz upload:
```tsx
if (selectedFile && targetId) {
  const formData = new FormData();
  formData.append('file', selectedFile);
  await api.post(`/members/${targetId}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
```

### 3. Backend processa (`POST /members/{member_id}/photo`):
```python
# 1. Valida que membro tem CIM
if not db_member.cim:
    raise HTTPException(status_code=400, detail="Member must have a CIM")

# 2. Define diretório: storage/lodges/loja_{lodge_id}/profile_pictures
directory = STORAGE_DIR / f"loja_{lodge_id_for_path}" / "profile_pictures"
directory.mkdir(parents=True, exist_ok=True)

# 3. Salva arquivo como {cim}.ext
new_filename = f"{db_member.cim}{file_extension}"
file_path = directory / new_filename

# 4. Atualiza banco de dados
db_member.profile_picture_path = f"/storage/lodges/loja_{lodge_id_for_path}/profile_pictures/{new_filename}"
db.commit()
```

### 4. Frontend exibe a foto:
```tsx
<Avatar
  src={`${API_URL}${member.profile_picture_path}`}
  alt={member.full_name}
/>
```

---

## ✅ Testes Sugeridos

### 1. **Criar novo membro COM CIM**
- [ ] Selecionar foto no formulário
- [ ] Salvar membro
- [ ] Verificar que a foto foi salva em `storage/lodges/loja_{id}/profile_pictures/{cim}.ext`
- [ ] Verificar que o caminho no banco está correto
- [ ] Verificar que a foto aparece na listagem de membros

### 2. **Criar novo membro SEM CIM**
- [ ] Tentar fazer upload de foto
- [ ] Verificar que retorna erro 400: "Member must have a CIM to upload profile picture"

### 3. **Editar membro existente**
- [ ] Trocar a foto de perfil
- [ ] Verificar que o arquivo antigo é substituído (mesmo nome: {cim}.ext)

### 4. **Migração de fotos antigas**
- [ ] Executar `python backend/migrate_photo.py`
- [ ] Verificar logs de migração
- [ ] Confirmar que os caminhos no banco foram atualizados
- [ ] Confirmar que as fotos foram copiadas para a nova estrutura

### 5. **Permissões**
- [ ] **Webmaster**: Pode fazer upload apenas para membros de sua loja
- [ ] **SuperAdmin**: Pode fazer upload para qualquer membro

---

## 🔒 Considerações de Segurança Implementadas

✅ **Validação de Autorização**:
- Webmaster só pode fazer upload para membros de sua loja
- SuperAdmin pode fazer upload para qualquer membro

✅ **Validação de Dados**:
- Verifica se o membro existe
- Verifica se o membro tem CIM
- Verifica se o membro está associado a uma loja

✅ **Isolamento por Loja**:
- Cada loja tem seu próprio diretório
- Arquivos são nomeados pelo CIM (único)

---

## 🚀 Melhorias Futuras (Opcionais)

Documentadas em `docs/upload_fotos_perfil.md`:

1. **Validação de Tipo de Arquivo** (server-side MIME type check)
2. **Limite de Tamanho de Arquivo** (ex: máximo 5MB)
3. **Redimensionamento Automático de Imagens** (usando PIL/Pillow)
4. **Compressão de Imagens** (otimização para web)
5. **Suporte a Múltiplos Formatos** com conversão para formato padrão
6. **Versionamento de Fotos** (manter histórico de alterações)
7. **CDN Integration** (para melhor performance em produção)

---

## 📝 Próximos Passos

1. **Testar o fluxo de upload** com o frontend conectado ao backend
2. **Executar migração** se houver fotos antigas: `python backend/migrate_photo.py`
3. **Validar permissões** (Webmaster vs SuperAdmin)
4. **Implementar melhorias opcionais** conforme necessidade

---

**Data da Implementação**: 2025-11-28  
**Status**: ✅ Concluído e Documentado
