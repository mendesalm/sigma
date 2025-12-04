import pytest
from unittest.mock import MagicMock, patch
from models import models
from services import lodge_service, auth_service
from schemas import lodge_schema

# ============================================================================
# Testes: Lodge Onboarding (Importação)
# ============================================================================

def test_create_lodge_with_import(db_session, sample_obedience):
    """Testa criação de loja com importação automática de membros globais."""
    
    # Dados da nova loja
    lodge_data = lodge_schema.LodgeCreate(
        lodge_name="Loja Importada",
        lodge_number="1010",
        obedience_id=sample_obedience.id,
        technical_contact_name="Tech Contact",
        technical_contact_email="tech@importada.com",
        external_id=500 # ID simulado do banco global
    )
    
    # Mock do banco global e visitantes
    mock_oriente_db = MagicMock()
    
    visitor1 = MagicMock()
    visitor1.full_name = "Membro Importado 1"
    visitor1.cim = "111111"
    visitor1.degree = "Mestre"
    
    visitor2 = MagicMock()
    visitor2.full_name = "Membro Importado 2"
    visitor2.cim = "222222"
    visitor2.degree = "Aprendiz"
    
    # Configura o mock para retornar esses visitantes quando filtrado por origin_lodge_id=500
    mock_oriente_db.query.return_value.filter.return_value.all.return_value = [visitor1, visitor2]
    
    # Patch no get_oriente_db
    with patch('services.lodge_service.get_oriente_db', return_value=iter([mock_oriente_db])):
        new_lodge = lodge_service.create_lodge(db_session, lodge_data)
        
        assert new_lodge.id is not None
        assert new_lodge.lodge_name == "Loja Importada"
        
        # Verifica se os membros foram criados localmente
        member1 = db_session.query(models.Member).filter(models.Member.cim == "111111").first()
        member2 = db_session.query(models.Member).filter(models.Member.cim == "222222").first()
        
        assert member1 is not None
        assert member1.full_name == "Membro Importado 1"
        
        assert member2 is not None
        
        # Verifica associação com a nova loja
        assoc1 = db_session.query(models.MemberLodgeAssociation).filter(
            models.MemberLodgeAssociation.member_id == member1.id,
            models.MemberLodgeAssociation.lodge_id == new_lodge.id
        ).first()
        
        assert assoc1 is not None
        assert assoc1.is_primary is True

# ============================================================================
# Testes: Lodge Offboarding (Inativação e Login)
# ============================================================================

def test_webmaster_login_inactive_lodge(db_session, sample_lodge):
    """Testa bloqueio de login de Webmaster quando a loja está inativa."""
    
    # Cria webmaster específico para este teste
    webmaster = models.Webmaster(
        username="webmaster_lifecycle",
        email="lifecycle@teste.com",
        password_hash=auth_service.password_utils.hash_password("Pass123"),
        lodge_id=sample_lodge.id,
        is_active=True
    )
    db_session.add(webmaster)
    db_session.commit()
    
    # 1. Login com loja ativa (deve funcionar)
    assert sample_lodge.is_active is True
    user, role = auth_service.authenticate_user(db_session, webmaster.email, "Pass123")
    assert user is not None
    assert role == "webmaster"
    
    # 2. Inativa a loja
    sample_lodge.is_active = False
    db_session.add(sample_lodge) # Garante que está na sessão
    db_session.commit()
    db_session.refresh(sample_lodge)
    assert sample_lodge.is_active is False
    
    # 3. Tenta login novamente (deve falhar)
    result = auth_service.authenticate_user(db_session, webmaster.email, "Pass123")
    assert result is None

def test_member_login_inactive_lodge(db_session, sample_lodge, sample_member):
    """Testa que membro ainda consegue logar mesmo se sua loja estiver inativa."""
    
    # Inativa a loja
    sample_lodge.is_active = False
    db_session.commit()
    
    # Tenta login (deve funcionar, pois login de membro é global)
    user, role = auth_service.authenticate_user(db_session, sample_member.email, "TestPassword123")
    assert user is not None
    assert role == "member"
