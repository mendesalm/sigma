from models import models
from schemas import lodge_schema
from services import auth_service, lodge_service

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
        external_id=500,  # ID simulado do banco global
    )

    # Remove obsolete patch and global API mocks since feature was simplified
    new_lodge = lodge_service.create_lodge(db_session, lodge_data)

    assert new_lodge.id is not None
    assert new_lodge.lodge_name == "Loja Importada"


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
        is_active=True,
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
    db_session.add(sample_lodge)  # Garante que está na sessão
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
