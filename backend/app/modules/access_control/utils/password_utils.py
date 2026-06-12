import bcrypt


def hash_password(password: str) -> str:
    """Gera o hash seguro para uma senha em texto plano utilizando o bcrypt."""
    # O Bcrypt possui limite máximo de 72 bytes.
    # Fazemos encode e o truncamento para evitar ValueError.
    pwd_bytes = password.encode("utf-8")[:72]
    # Gera o salt (semente) e faz o hash
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano digitada corresponde ao hash gravado no banco."""
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)


# Alias mantido para retrocompatibilidade
get_password_hash = hash_password
