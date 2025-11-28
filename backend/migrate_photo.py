import os
import shutil
from pathlib import Path
from backend.database import SessionLocal
from backend.models import models

# Get project root
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

print("🔄 Iniciando migração de fotos de perfil...")
print("=" * 60)

db = SessionLocal()

# Buscar todos os membros com fotos
members = db.query(models.Member).filter(
    models.Member.profile_picture_path.isnot(None)
).all()

print(f"📊 Encontrados {len(members)} membros com fotos cadastradas\n")

migrated_count = 0
skipped_count = 0
error_count = 0

for member in members:
    try:
        # Obter informações do membro
        old_path = member.profile_picture_path
        
        # Verificar se membro tem CIM
        if not member.cim:
            print(f"⚠️  Pulado: {member.full_name} (ID: {member.id}) - Sem CIM")
            skipped_count += 1
            continue
        
        # Obter lodge_id da primeira associação
        association = db.query(models.MemberLodgeAssociation).filter(
            models.MemberLodgeAssociation.member_id == member.id
        ).first()
        
        if not association:
            print(f"⚠️  Pulado: {member.full_name} (CIM: {member.cim}) - Sem associação com loja")
            skipped_count += 1
            continue
        
        # Extrair extensão do arquivo antigo
        file_extension = os.path.splitext(old_path)[1] or '.jpg'
        
        # Novo caminho: /storage/lodges/loja_{lodge_id}/profile_pictures/{cim}.ext
        new_path = f"/storage/lodges/loja_{association.lodge_id}/profile_pictures/{member.cim}{file_extension}"
        
        # Caminhos físicos dos arquivos
        old_file = PROJECT_ROOT / old_path.lstrip('/')
        new_file = PROJECT_ROOT / new_path.lstrip('/')
        
        # Verificar se arquivo antigo existe
        if not old_file.exists():
            print(f"⚠️  Pulado: {member.full_name} (CIM: {member.cim}) - Arquivo não encontrado: {old_file}")
            skipped_count += 1
            continue
        
        # Criar diretório de destino
        new_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Copiar arquivo
        shutil.copy2(old_file, new_file)
        
        # Atualizar banco de dados
        member.profile_picture_path = new_path
        db.commit()
        
        print(f"✅ Migrado: {member.full_name} (CIM: {member.cim})")
        print(f"   De: {old_path}")
        print(f"   Para: {new_path}\n")
        migrated_count += 1
        
    except Exception as e:
        print(f"❌ Erro ao migrar {member.full_name} (ID: {member.id}): {str(e)}\n")
        error_count += 1
        db.rollback()

db.close()

print("=" * 60)
print("📊 Resumo da Migração:")
print(f"   ✅ Migrados: {migrated_count}")
print(f"   ⚠️  Pulados: {skipped_count}")
print(f"   ❌ Erros: {error_count}")
print(f"   📝 Total: {len(members)}")
print("=" * 60)

if migrated_count > 0:
    print("✅ Migração concluída com sucesso!")
else:
    print("⚠️  Nenhuma foto foi migrada.")

