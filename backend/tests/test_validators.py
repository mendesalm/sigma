"""
Testes unitários para os validadores em utils/validators.py

Execute com: pytest tests/test_validators.py -v
"""

import pytest
from utils.validators import (
    validate_cpf,
    validate_cnpj,
    validate_cep,
    validate_phone,
    validate_coordinates,
    validate_cim,
    sanitize_cpf,
    sanitize_cnpj,
    sanitize_phone,
    format_cpf,
    format_cnpj,
    format_phone
)


# ============================================================================
# Testes de Validação de CPF
# ============================================================================

@pytest.mark.unit
class TestCPFValidation:
    """Testes de validação de CPF."""
    
    def test_valid_cpf_with_formatting(self):
        """CPF válido com formatação deve passar."""
        # CPFs válidos de exemplo (gerados com algoritmo correto)
        valid_cpfs = [
            "111.444.777-35"
        ]
        for cpf in valid_cpfs:
            assert validate_cpf(cpf) == True, f"CPF {cpf} deveria ser válido"
    
    def test_valid_cpf_without_formatting(self):
        """CPF válido sem formatação deve passar."""
        assert validate_cpf("11144477735") == True
        assert validate_cpf("12345678909") == True
    
    def test_invalid_cpf_all_same_digits(self):
        """CPF com todos dígitos iguais deve falhar."""
        invalid_cpfs = [
            "111.111.111-11",
            "000.000.000-00",
            "999.999.999-99"
        ]
        for cpf in invalid_cpfs:
            assert validate_cpf(cpf) == False, f"CPF {cpf} deveria ser inválido"
    
    def test_invalid_cpf_wrong_check_digits(self):
        """CPF com dígitos verificadores incorretos deve falhar."""
        assert validate_cpf("123.456.789-00") == False
        assert validate_cpf("111.444.777-00") == False
    
    def test_invalid_cpf_wrong_length(self):
        """CPF com tamanho incorreto deve falhar."""
        assert validate_cpf("123.456") == False
        assert validate_cpf("123") == False
        assert validate_cpf("") == False


# ============================================================================
# Testes de Validação de CNPJ
# ============================================================================

@pytest.mark.unit
class TestCNPJValidation:
    """Testes de validação de CNPJ."""
    
    def test_valid_cnpj(self):
        """CNPJ válido deve passar."""
        # CNPJs válidos de exemplo
        valid_cnpjs = [
            "11.222.333/0001-81",
            "11222333000181"
        ]
        for cnpj in valid_cnpjs:
            assert validate_cnpj(cnpj) == True, f"CNPJ {cnpj} deveria ser válido"
    
    def test_invalid_cnpj_all_same_digits(self):
        """CNPJ com todos dígitos iguais deve falhar."""
        assert validate_cnpj("11.111.111/1111-11") == False
        assert validate_cnpj("00.000.000/0000-00") == False
    
    def test_invalid_cnpj_wrong_check_digits(self):
        """CNPJ com dígitos verificadores incorretos deve falhar."""
        assert validate_cnpj("11.222.333/0001-00") == False
    
    def test_invalid_cnpj_wrong_length(self):
        """CNPJ com tamanho incorreto deve falhar."""
        assert validate_cnpj("11.222.333") == False
        assert validate_cnpj("") == False


# ============================================================================
# Testes de Validação de CEP
# ============================================================================

@pytest.mark.unit
class TestCEPValidation:
    """Testes de validação de CEP."""
    
    def test_valid_cep_with_hyphen(self):
        """CEP válido com hífen deve passar."""
        assert validate_cep("70000-000") == True
        assert validate_cep("12345-678") == True
    
    def test_valid_cep_without_hyphen(self):
        """CEP válido sem hífen deve passar."""
        assert validate_cep("70000000") == True
        assert validate_cep("12345678") == True
    
    def test_invalid_cep_wrong_format(self):
        """CEP com formato incorreto deve falhar."""
        assert validate_cep("12345") == False
        assert validate_cep("123") == False
        assert validate_cep("") == False
        assert validate_cep("ABCDE-FGH") == False


# ============================================================================
# Testes de Validação de Telefone
# ============================================================================

@pytest.mark.unit
class TestPhoneValidation:
    """Testes de validação de telefone."""
    
    def test_valid_cellphone(self):
        """Telefone celular válido deve passar."""
        valid_phones = [
            "(61) 99999-9999",
            "(11) 98765-4321",
            "61999999999",
            "(61)99999-9999"
        ]
        for phone in valid_phones:
            assert validate_phone(phone) == True, f"Telefone {phone} deveria ser válido"
    
    def test_valid_landline(self):
        """Telefone fixo válido deve passar."""
        valid_phones = [
            "(61) 3333-4444",
            "6133334444",
            "(11) 2222-3333"
        ]
        for phone in valid_phones:
            assert validate_phone(phone) == True, f"Telefone {phone} deveria ser válido"
    
    def test_invalid_phone_wrong_ddd(self):
        """Telefone com DDD inválido deve falhar."""
        assert validate_phone("(09) 99999-9999") == False
        assert validate_phone("(00) 99999-9999") == False
    
    def test_invalid_phone_wrong_length(self):
        """Telefone com tamanho incorreto deve falhar."""
        assert validate_phone("1234") == False
        assert validate_phone("123456789012") == False
    
    def test_invalid_phone_cellphone_not_starting_with_9(self):
        """Celular não começando com 9 deve falhar."""
        assert validate_phone("(61) 89999-9999") == False


# ============================================================================
# Testes de Validação de Coordenadas
# ============================================================================

@pytest.mark.unit
class TestCoordinatesValidation:
    """Testes de validação de coordenadas geográficas."""
    
    def test_valid_coordinates(self):
        """Coordenadas válidas devem passar."""
        assert validate_coordinates(-15.7942, -47.8822) == True  # Brasília
        assert validate_coordinates(0, 0) == True
        assert validate_coordinates(-90, -180) == True
        assert validate_coordinates(90, 180) == True
    
    def test_invalid_latitude(self):
        """Latitude fora do range deve falhar."""
        assert validate_coordinates(-91, 0) == False
        assert validate_coordinates(91, 0) == False
        assert validate_coordinates(100, 0) == False
    
    def test_invalid_longitude(self):
        """Longitude fora do range deve falhar."""
        assert validate_coordinates(0, -181) == False
        assert validate_coordinates(0, 181) == False
        assert validate_coordinates(0, 200) == False
    
    def test_none_coordinates(self):
        """Coordenadas None devem retornar True (opcionais)."""
        assert validate_coordinates(None, None) == True


# ============================================================================
# Testes de Validação de CIM
# ============================================================================

@pytest.mark.unit
class TestCIMValidation:
    """Testes de validação de CIM."""
    
    def test_valid_cim(self):
        """CIM válido deve passar."""
        assert validate_cim("272875") == True
        assert validate_cim("1234") == True
        assert validate_cim("12345678901234567890") == True  # 20 dígitos
    
    def test_invalid_cim_too_short(self):
        """CIM muito curto deve falhar."""
        assert validate_cim("123") == False
        assert validate_cim("12") == False
    
    def test_invalid_cim_too_long(self):
        """CIM muito longo deve falhar."""
        assert validate_cim("123456789012345678901") == False  # 21 dígitos
    
    def test_invalid_cim_non_numeric(self):
        """CIM não numérico deve falhar."""
        assert validate_cim("ABC123") == False
        assert validate_cim("12-34") == False
        assert validate_cim("") == False


# ============================================================================
# Testes de Sanitização
# ============================================================================

@pytest.mark.unit
class TestSanitization:
    """Testes de funções de sanitização."""
    
    def test_sanitize_cpf(self):
        """Sanitização de CPF deve remover formatação."""
        assert sanitize_cpf("123.456.789-09") == "12345678909"
        assert sanitize_cpf("123.456.789-09") == "12345678909"
        assert sanitize_cpf("12345678909") == "12345678909"
    
    def test_sanitize_cnpj(self):
        """Sanitização de CNPJ deve remover formatação."""
        assert sanitize_cnpj("11.222.333/0001-81") == "11222333000181"
        assert sanitize_cnpj("11222333000181") == "11222333000181"
    
    def test_sanitize_phone(self):
        """Sanitização de telefone deve remover formatação."""
        assert sanitize_phone("(61) 99999-9999") == "61999999999"
        assert sanitize_phone("61999999999") == "61999999999"


# ============================================================================
# Testes de Formatação
# ============================================================================

@pytest.mark.unit
class TestFormatting:
    """Testes de funções de formatação."""
    
    def test_format_cpf(self):
        """Formatação de CPF."""
        assert format_cpf("12345678909") == "123.456.789-09"
        assert format_cpf("123.456.789-09") == "123.456.789-09"
    
    def test_format_cnpj(self):
        """Formatação de CNPJ."""
        assert format_cnpj("11222333000181") == "11.222.333/0001-81"
        assert format_cnpj("11.222.333/0001-81") == "11.222.333/0001-81"
    
    def test_format_phone_cellphone(self):
        """Formatação de telefone celular."""
        assert format_phone("61999999999") == "(61) 99999-9999"
    
    def test_format_phone_landline(self):
        """Formatação de telefone fixo."""
        assert format_phone("6133334444") == "(61) 3333-4444"
    
    def test_format_invalid_phone(self):
        """Formatação de telefone inválido deve retornar sem mudança."""
        assert format_phone("123") == "123"
