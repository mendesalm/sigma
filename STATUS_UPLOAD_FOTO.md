# 📊 Status do Upload de Foto

## 🔍 Diagnóstico Atual

### Situação Atual:
- ✅ **Upload funcionou** (sem erro 500)
- ✅ **Arquivo foi criado**: `272875.jpg`
- ❌ **Localização incorreta**: `storage/lodges/loja_2181/profile_pictures/` (deveria ser `loja_1`)
- ❌ **404 ao carregar**: Frontend procura em `loja_1` mas arquivo está em `loja_2181`

### Causa Provável:
O diretório `loja_2181` foi criado por um **upload anterior** antes das correções de código. O upload mais recente deveria ter criado `loja_1`.

---

## ✅ Solução: Testar Novo Upload

### Passos:

1. **Deletar o arquivo antigo** (opcional):
   ```powershell
   Remove-Item ".\storage\lodges\loja_2181" -Recurse -Force
   ```

2. **Fazer novo upload de foto**:
   - Abrir formulário do membro (ID 1)
   - Garantir que o CIM está preenchido: `272875`
   - Selecionar uma nova foto
   - Salvar

3. **Verificar estrutura criada**:
   - Deve criar: `storage/lodges/loja_1/profile_pictures/272875.jpg`
   - O caminho no DB deve ser: `/storage/lodges/loja_1/profile_pictures/272875.jpg`

---

## 🔧 Verificação Rápida

Execute este comando para ver os diretórios criados:

```powershell
Get-ChildItem -Path ".\storage\lodges" -Recurse | Format-Table FullName
```

---

## 📝 Comandos Úteis

### Ver foto no DB:
```powershell
python -c "import sys; sys.path.insert(0, '.'); from backend.database import SessionLocal; from backend.models import models; db = SessionLocal(); member = db.query(models.Member).filter(models.Member.id == 1).first(); print(f'Foto: {member.profile_picture_path}') if member else print('Não encontrado'); db.close()"
```

### Verificar estrutura de lodges:
```powershell
Get-ChildItem -Path ".\storage\lodges" -Recurse -File
```

###Limpar diretórios antigos:
```powershell
Remove-Item ".\storage\lodges\loja_2181" -Recurse -Force
```

---

## 🎯 Resultado Esperado

Após o novo upload:

```
storage/
└── lodges/
    └── loja_1/                    ← ID correto da loja
        └── profile_pictures/
            └── 272875.jpg         ← CIM do membro
```

Banco de dados:
```
member.profile_picture_path = "/storage/lodges/loja_1/profile_pictures/272875.jpg"
```

Frontend pode acessar:
```
http://localhost:8000/storage/lodges/loja_1/profile_pictures/272875.jpg
```

---

**Próximo Passo**: Limpe o diretório `loja_2181` e faça um novo upload para testar!
