# Documentação Técnica: Upload de Fotos de Perfil

## Estrutura de Armazenamento

As fotos de perfil dos membros são armazenadas no seguinte formato:

```
sigma/
└── storage/
    └── lodges/
        └── loja_{lodge_id}/
            └── profile_pictures/
                ├── {cim1}.jpg
                ├── {cim2}.png
                └── {cim3}.jpeg
```

### Características:

1. **Diretório por Loja**: Cada loja tem sua própria pasta identificada por `loja_{lodge_id}`
2. **Nome do Arquivo**: O arquivo é nomeado com o **CIM do membro** + extensão original
3. **Extensões Suportadas**: Qualquer formato de imagem (jpg, jpeg, png, gif, webp, etc.)

## Endpoint de Upload

**URL**: `POST /members/{member_id}/photo`

**Parâmetros**:
- `member_id` (path): ID do membro
- `file` (multipart/form-data): Arquivo de imagem

**Validações**:
- O membro deve ter um CIM cadastrado
- O usuário deve ter permissão para modificar o membro (Webmaster da loja ou SuperAdmin)
- O membro deve estar associado a uma loja

**Processamento**:
1. Valida que o membro possui CIM
2. Determina o `lodge_id` apropriado:
   - Para Webmasters: usa o `lodge_id` do token
   - Para SuperAdmins: busca a primeira associação do membro
3. Cria o diretório `storage/lodges/loja_{lodge_id}/profile_pictures` se não existir
4. Salva o arquivo com o nome `{cim}.{extensão}`
5. Atualiza o campo `profile_picture_path` no banco de dados com o caminho relativo

**Caminho Armazenado no DB**:
```
/storage/lodges/loja_{lodge_id}/profile_pictures/{cim}.ext
```

## Frontend

### Seleção de Arquivo

O componente `MemberForm.tsx` permite que o usuário selecione uma foto através de um botão com ícone de câmera:

```tsx
<input 
  hidden 
  accept="image/*" 
  type="file" 
  onChange={(e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormState({ ...formState, profile_picture_path: previewUrl });
    }
  }}
/>
```

### Upload

O upload é realizado após o salvamento bem-sucedido do membro:

```tsx
if (selectedFile && targetId) {
  const formData = new FormData();
  formData.append('file', selectedFile);
  await api.post(`/members/${targetId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
```

### Exibição

As fotos são exibidas usando o `Avatar` do Material-UI:

```tsx
<Avatar
  src={formState.profile_picture_path ? 
    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${formState.profile_picture_path}` 
    : undefined
  }
  alt={formState.full_name}
/>
```

## Migração de Fotos Antigas

Se você possui fotos em uma estrutura antiga, pode usar o script `migrate_photos.py` para migrá-las para a nova estrutura.

### Exemplo de Migração

```python
# Antiga estrutura: storage/{lodge_code}/profile_pictures/{member_id}.ext
# Nova estrutura: storage/lodges/loja_{lodge_id}/profile_pictures/{cim}.ext

import os
import shutil
from pathlib import Path
from backend.database import SessionLocal
from backend.models import models

db = SessionLocal()

# Buscar todos os membros com fotos
members = db.query(models.Member).filter(
    models.Member.profile_picture_path.isnot(None)
).all()

for member in members:
    # Extrair informações do caminho antigo
    old_path = member.profile_picture_path
    # Exemplo: /storage/loja2181/profile_pictures/1.jpg
    
    # Obter lodge_id da primeira associação
    association = db.query(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.member_id == member.id
    ).first()
    
    if not association or not member.cim:
        continue
    
    # Novo caminho
    new_path = f"/storage/lodges/loja_{association.lodge_id}/profile_pictures/{member.cim}.jpg"
    
    # Copiar arquivo fisicamente
    old_file = Path(__file__).parent / old_path.lstrip('/')
    new_file = Path(__file__).parent / new_path.lstrip('/')
    
    if old_file.exists():
        new_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(old_file, new_file)
        
        # Atualizar banco de dados
        member.profile_picture_path = new_path
        db.commit()
        
        print(f"Migrated: {member.full_name} ({member.cim})")

db.close()
```

## Servindo Arquivos Estáticos

Para servir as fotos, você precisa configurar o FastAPI para servir arquivos estáticos do diretório `storage`:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/storage", StaticFiles(directory="storage"), name="storage")
```

Isso permite que as URLs como `/storage/lodges/loja_1/profile_pictures/123456.jpg` sejam acessíveis pelo frontend.

## Considerações de Segurança

1. **Validação de Tipo de Arquivo**: O endpoint aceita qualquer arquivo com `accept="image/*"`. Considere adicionar validação server-side do tipo MIME.
2. **Tamanho Máximo**: Considere adicionar limite de tamanho de arquivo (ex: 5MB).
3. **Sanitização de Nome**: O CIM é usado diretamente no nome do arquivo, garanta que ele contenha apenas caracteres válidos.
4. **Controle de Acesso**: O endpoint já possui controle de acesso baseado em roles (Webmaster/SuperAdmin).

## Exemplo de Melhorias Futuras

### Validação de Tipo de Arquivo

```python
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# No endpoint:
if not allowed_file(file.filename):
    raise HTTPException(status_code=400, detail="Invalid file type")
```

### Limite de Tamanho

```python
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

file_content = await file.read()
if len(file_content) > MAX_FILE_SIZE:
    raise HTTPException(status_code=400, detail="File too large")
```

### Redimensionamento de Imagem

```python
from PIL import Image
import io

def resize_image(file_content: bytes, max_size: tuple = (800, 800)) -> bytes:
    image = Image.open(io.BytesIO(file_content))
    image.thumbnail(max_size, Image.LANCZOS)
    
    output = io.BytesIO()
    image.save(output, format='JPEG', quality=85)
    return output.getvalue()
```
