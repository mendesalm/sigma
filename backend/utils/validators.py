"""
Validadores customizados para o sistema Sigma.

Este módulo contém funções de validação para CPF, CNPJ, CEP, telefone,
coordenadas geográficas e outros dados específicos do sistema.
"""

import re
from typing import Optional


def validate_cpf(cpf: str) -> bool:
    """
    Valida CPF brasileiro com verificação de dígitos.
    
    Args:
        cpf: CPF no formato XXX.XXX.XXX-XX ou apenas números
        
    Returns:
        True se o CPF é válido, False caso contrário
        
    Example:
        >>> validate_cpf("123.456.789-09")
        False
        >>> validate_cpf("111.111.111-11")
        False
    """
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais (CPF inválido)
    if cpf == cpf[0] * 11:
        return False
    
    # Valida primeiro dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    if int(cpf[9]) != digito1:
        return False
    
    # Valida segundo dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    if int(cpf[10]) != digito2:
        return False
    
    return True


def validate_cnpj(cnpj: str) -> bool:
    """
    Valida CNPJ brasileiro com verificação de dígitos.
    
    Args:
        cnpj: CNPJ no formato XX.XXX.XXX/XXXX-XX ou apenas números
        
    Returns:
        True se o CNPJ é válido, False caso contrário
    """
    # Remove caracteres não numéricos
    cnpj = re.sub(r'[^0-9]', '', cnpj)
    
    # Verifica se tem 14 dígitos
    if len(cnpj) != 14:
        return False
    
    # Verifica se todos os dígitos são iguais (CNPJ inválido)
    if cnpj == cnpj[0] * 14:
        return False
    
    # Valida primeiro dígito verificador
    peso = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * peso[i] for i in range(12))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto
    
    if int(cnpj[12]) != digito1:
        return False
    
    # Valida segundo dígito verificador
    peso = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * peso[i] for i in range(13))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto
    
    if int(cnpj[13]) != digito2:
        return False
    
    return True


def validate_cep(cep: str) -> bool:
    """
    Valida formato de CEP brasileiro.
    
    Args:
        cep: CEP no formato XXXXX-XXX ou XXXXXXXX
        
    Returns:
        True se o formato é válido, False caso contrário
    """
    pattern = r'^\d{5}-?\d{3}$'
    return bool(re.match(pattern, cep))


def validate_phone(phone: str) -> bool:
    """
    Valida telefone brasileiro (fixo ou celular).
    
    Aceita formatos:
    - (XX) XXXX-XXXX (fixo)
    - (XX) XXXXX-XXXX (celular)
    - Com ou sem parênteses e hífen
    
    Args:
        phone: Telefone em diversos formatos
        
    Returns:
        True se o formato é válido, False caso contrário
    """
    # Remove espaços, parênteses e hífens
    clean_phone = re.sub(r'[\s\(\)-]', '', phone)
    
    # Verifica se tem 10 (fixo) ou 11 (celular) dígitos
    if len(clean_phone) not in [10, 11]:
        return False
    
    # Verifica se são todos números
    if not clean_phone.isdigit():
        return False
    
    # Verifica DDD válido (10-99)
    ddd = int(clean_phone[:2])
    if ddd < 10 or ddd > 99:
        return False
    
    # Se for celular (11 dígitos), deve começar com 9
    if len(clean_phone) == 11 and clean_phone[2] != '9':
        return False
    
    return True


def validate_coordinates(lat: Optional[float], lng: Optional[float]) -> bool:
    """
    Valida coordenadas geográficas.
    
    Args:
        lat: Latitude (-90 a 90)
        lng: Longitude (-180 a 180)
        
    Returns:
        True se as coordenadas são válidas, False caso contrário
    """
    if lat is None or lng is None:
        return True  # Coordenadas são opcionais
    
    return -90 <= lat <= 90 and -180 <= lng <= 180


def validate_cim(cim: str) -> bool:
    """
    Valida formato básico de CIM (Cadastro Individual Maçônico).
    
    O CIM geralmente é numérico com 4-20 dígitos.
    
    Args:
        cim: Número do CIM
        
    Returns:
        True se o formato é válido, False caso contrário
    """
    if not cim:
        return False
    
    # Remove espaços
    cim = cim.strip()
    
    # Verifica se é numérico e tem tamanho adequado
    return cim.isdigit() and 4 <= len(cim) <= 20


def validate_email_domain(email: str, allowed_domains: Optional[list[str]] = None) -> bool:
    """
    Valida domínio de email (opcional).
    
    Args:
        email: Endereço de email
        allowed_domains: Lista de domínios permitidos (opcional)
        
    Returns:
        True se o domínio é válido ou allowed_domains is None
    """
    if not allowed_domains:
        return True
    
    domain = email.split('@')[1] if '@' in email else ''
    return domain.lower() in [d.lower() for d in allowed_domains]


def sanitize_cpf(cpf: str) -> str:
    """
    Remove formatação do CPF, deixando apenas números.
    
    Args:
        cpf: CPF formatado
        
    Returns:
        CPF apenas com números
    """
    return re.sub(r'[^0-9]', '', cpf)


def sanitize_cnpj(cnpj: str) -> str:
    """
    Remove formatação do CNPJ, deixando apenas números.
    
    Args:
        cnpj: CNPJ formatado
        
    Returns:
        CNPJ apenas com números
    """
    return re.sub(r'[^0-9]', '', cnpj)


def sanitize_phone(phone: str) -> str:
    """
    Remove formatação do telefone, deixando apenas números.
    
    Args:
        phone: Telefone formatado
        
    Returns:
        Telefone apenas com números
    """
    return re.sub(r'[^0-9]', '', phone)


def format_cpf(cpf: str) -> str:
    """
    Formata CPF no padrão XXX.XXX.XXX-XX.
    
    Args:
        cpf: CPF sem formatação (apenas números)
        
    Returns:
        CPF formatado
    """
    cpf = sanitize_cpf(cpf)
    if len(cpf) != 11:
        return cpf
    return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"


def format_cnpj(cnpj: str) -> str:
    """
    Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX.
    
    Args:
        cnpj: CNPJ sem formatação (apenas números)
        
    Returns:
        CNPJ formatado
    """
    cnpj = sanitize_cnpj(cnpj)
    if len(cnpj) != 14:
        return cnpj
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"


def format_phone(phone: str) -> str:
    """
    Formata telefone no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
    
    Args:
        phone: Telefone sem formatação (apenas números)
        
    Returns:
        Telefone formatado
    """
    phone = sanitize_phone(phone)
    
    if len(phone) == 11:  # Celular
        return f"({phone[:2]}) {phone[2:7]}-{phone[7:]}"
    elif len(phone) == 10:  # Fixo
        return f"({phone[:2]}) {phone[2:6]}-{phone[6:]}"
    
    return phone
