"""
Testes para schemas Pydantic (validações de dados).

Execute com: pytest tests/test_schemas.py -v
"""

import pytest
from datetime import date, time, timedelta
from pydantic import ValidationError

from schemas.member_schema import MemberCreate, MemberUpdate
from schemas.lodge_schema import LodgeCreate, LodgeUpdate
from schemas.masonic_session_schema import MasonicSessionCreate, MasonicSessionUpdate


# ============================================================================
# Testes do MemberSchema
# ============================================================================

@pytest.mark.unit
class TestMemberSchema:
    """Testes de validação do schema de membros."""
    
    def test_valid_member_creation(self):
        """Criação de membro com dados válidos deve funcionar."""
        member = MemberCreate(
            full_name="João Pedro Silva",
            email="joao@test.com",
            cpf="111.444.777-35",
            phone="(61) 99999-9999",
            zip_code="70000-000",
            cim="272875",
            password="TestPassword123",
            birth_date=date(1990, 1, 1)
        )
        
        assert member.full_name == "João Pedro Silva"
        assert member.email == "joao@test.com"
        assert member.cpf == "111.444.777-35"
    
    def test_invalid_cpf_rejected(self):
        """CPF inválido deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João Silva",
                email="joao@test.com",
                cpf="111.111.111-11",  # CPF inválido
                password="TestPassword123"
            )
        
        errors = exc_info.value.errors()
        assert any('cpf' in str(error['loc']) for error in errors)
        assert any('inválido' in error['msg'].lower() for error in errors)
    
    def test_invalid_phone_rejected(self):
        """Telefone inválido deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João Silva",
                email="joao@test.com",
                phone="1234",  # Telefone inválido
                password="TestPassword123"
            )
        
        errors = exc_info.value.errors()
        assert any('phone' in str(error['loc']) for error in errors)
    
    def test_short_name_rejected(self):
        """Nome incompleto deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João",  # Apenas um nome
                email="joao@test.com",
                password="TestPassword123"
            )
        
        errors = exc_info.value.errors()
        assert any('full_name' in str(error['loc']) for error in errors)
        assert any('sobrenome' in error['msg'].lower() for error in errors)
    
    def test_weak_password_rejected(self):
        """Senha fraca deve ser rejeitada."""
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João Silva",
                email="joao@test.com",
                password="senha"  # Sem número
            )
        
        errors = exc_info.value.errors()
        assert any('password' in str(error['loc']) for error in errors)
    
    def test_future_birth_date_rejected(self):
        """Data de nascimento no futuro deve ser rejeitada."""
        tomorrow = date.today() + timedelta(days=1)
        
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João Silva",
                email="joao@test.com",
                password="TestPassword123",
                birth_date=tomorrow
            )
        
        errors = exc_info.value.errors()
        assert any('birth_date' in str(error['loc']) for error in errors)
    
    def test_underage_rejected(self):
        """Menor de idade deve ser rejeitado."""
        ten_years_ago = date.today() - timedelta(days=365*10)
        
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João Silva",
                email="joao@test.com",
                password="TestPassword123",
                birth_date=ten_years_ago
            )
        
        errors = exc_info.value.errors()
        assert any('18 anos' in error['msg'] for error in errors)
    
    def test_invalid_cep_rejected(self):
        """CEP inválido deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João Silva",
                email="joao@test.com",
                password="TestPassword123",
                zip_code="12345"  # CEP inválido
            )
        
        errors = exc_info.value.errors()
        assert any('zip_code' in str(error['loc']) for error in errors)
    
    def test_date_consistency_validation(self):
        """Datas inconsistentes devem ser rejeitadas."""
        with pytest.raises(ValidationError) as exc_info:
            MemberCreate(
                full_name="João Silva",
                email="joao@test.com",
                password="TestPassword123",
                birth_date=date(1990, 1, 1),
                initiation_date=date(1980, 1, 1),  # Antes do nascimento!
            )
        
        errors = exc_info.value.errors()
        assert any('data de iniciação' in error['msg'].lower() for error in errors)


# ============================================================================
# Testes do LodgeSchema
# ============================================================================

@pytest.mark.unit
class TestLodgeSchema:
    """Testes de validação do schema de lojas."""
    
    def test_valid_lodge_creation(self):
        """Criação de loja com dados válidos deve funcionar."""
        lodge = LodgeCreate(
            lodge_name="Acácia do Cerrado",
            lodge_number="2181",
            cnpj="11.222.333/0001-81",
            phone="(61) 99999-9999",
            zip_code="70000-000",
            state="DF",
            foundation_date=date(2010, 5, 15),
            latitude=-15.7942,
            longitude=-47.8822,
            technical_contact_name="João Silva",
            technical_contact_email="contato@loja.com",
            session_day="Segunda-feira",
            periodicity="Semanal",
            session_time=time(20, 0),
            obedience_id=1
        )
        
        assert lodge.lodge_name == "Acácia Do Cerrado"  # Title case
        assert lodge.state == "DF"  # Uppercase
    
    def test_invalid_cnpj_rejected(self):
        """CNPJ inválido deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            LodgeCreate(
                lodge_name="Loja Teste",
                cnpj="11.111.111/1111-11",  # CNPJ inválido
                technical_contact_name="João Silva",
                technical_contact_email="contato@loja.com",
                obedience_id=1
            )
        
        errors = exc_info.value.errors()
        assert any('cnpj' in str(error['loc']) for error in errors)
    
    def test_invalid_state_rejected(self):
        """UF inválida deve ser rejeitada."""
        with pytest.raises(ValidationError) as exc_info:
            LodgeCreate(
                lodge_name="Loja Teste",
                state="XX",  # UF não existe
                technical_contact_name="João Silva",
                technical_contact_email="contato@loja.com",
                obedience_id=1
            )
        
        errors = exc_info.value.errors()
        assert any('state' in str(error['loc']) for error in errors)
    
    def test_coordinates_must_come_together(self):
        """Latitude e longitude devem vir juntas."""
        with pytest.raises(ValidationError) as exc_info:
            LodgeCreate(
                lodge_name="Loja Teste",
                latitude=-15.7942,
                longitude=None,  # Faltando longitude
                technical_contact_name="João Silva",
                technical_contact_email="contato@loja.com",
                obedience_id=1
            )
        
        errors = exc_info.value.errors()
        assert any('latitude e longitude' in error['msg'].lower() for error in errors)
    
    def test_invalid_session_time_rejected(self):
        """Horário de sessão inválido deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            LodgeCreate(
                lodge_name="Loja Teste",
                session_time=time(10, 0),  # Muito cedo
                technical_contact_name="João Silva",
                technical_contact_email="contato@loja.com",
                obedience_id=1
            )
        
        errors = exc_info.value.errors()
        assert any('session_time' in str(error['loc']) for error in errors)
    
    def test_website_auto_protocol(self):
        """Website sem protocolo deve adicionar https://."""
        lodge = LodgeCreate(
            lodge_name="Loja Teste",
            website="loja.com.br",
            technical_contact_name="João Silva",
            technical_contact_email="contato@loja.com",
            obedience_id=1
        )
        
        assert lodge.website.startswith("https://")


# ============================================================================
# Testes do SessionSchema
# ============================================================================

@pytest.mark.unit
class TestSessionSchema:
    """Testes de validação do schema de sessões."""
    
    def test_valid_session_creation(self):
        """Criação de sessão com dados válidos deve funcionar."""
        tomorrow = date.today() + timedelta(days=1)
        
        session = MasonicSessionCreate(
            title="Sessão Magna de Iniciação",
            session_date=tomorrow,
            start_time=time(20, 0),
            end_time=time(22, 0),
            status="AGENDADA"
        )
        
        assert session.title == "Sessão Magna De Iniciação"  # Title case
        assert session.status == "AGENDADA"
    
    def test_invalid_status_rejected(self):
        """Status inválido deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            MasonicSessionCreate(
                title="Sessão Teste",
                session_date=date.today(),
                status="PENDENTE"  # Status não existe
            )
        
        errors = exc_info.value.errors()
        assert any('status' in str(error['loc']) for error in errors)
    
    def test_old_date_rejected(self):
        """Data muito antiga deve ser rejeitada."""
        old_date = date.today() - timedelta(days=30)
        
        with pytest.raises(ValidationError) as exc_info:
            MasonicSessionCreate(
                title="Sessão Teste",
                session_date=old_date,
                status="AGENDADA"
            )
        
        errors = exc_info.value.errors()
        assert any('muito antiga' in error['msg'].lower() for error in errors)
    
    def test_invalid_start_time_rejected(self):
        """Horário de início inválido deve ser rejeitado."""
        with pytest.raises(ValidationError) as exc_info:
            MasonicSessionCreate(
                title="Sessão Teste",
                session_date=date.today(),
                start_time=time(10, 0),  # Muito cedo
                status="AGENDADA"
            )
        
        errors = exc_info.value.errors()
        assert any('start_time' in str(error['loc']) for error in errors)
    
    def test_inverted_times_rejected(self):
        """Horários invertidos devem ser rejeitados."""
        with pytest.raises(ValidationError) as exc_info:
            MasonicSessionCreate(
                title="Sessão Teste",
                session_date=date.today(),
                start_time=time(22, 0),
                end_time=time(20, 0),  # Antes do início!
                status="AGENDADA"
            )
        
        errors = exc_info.value.errors()
        assert any('posterior' in error['msg'].lower() for error in errors)
    
    def test_too_short_session_rejected(self):
        """Sessão muito curta deve ser rejeitada."""
        with pytest.raises(ValidationError) as exc_info:
            MasonicSessionCreate(
                title="Sessão Teste",
                session_date=date.today(),
                start_time=time(20, 0),
                end_time=time(20, 15),  # Apenas 15 minutos
                status="AGENDADA"
            )
        
        errors = exc_info.value.errors()
        assert any('30 minutos' in error['msg'] for error in errors)
    
    def test_too_long_session_rejected(self):
        """Sessão muito longa deve ser rejeitada."""
        tomorrow = date.today() + timedelta(days=1)
        
        with pytest.raises(ValidationError) as exc_info:
            MasonicSessionCreate(
                title="Sessão Teste",
                session_date=tomorrow,
                start_time=time(18, 0),
                end_time=time(23, 30),  # 5.5 horas
                status="AGENDADA"
            )
        
        errors = exc_info.value.errors()
        assert any('5 horas' in error['msg'] for error in errors)
