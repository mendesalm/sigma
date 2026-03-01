import bcrypt

def hash_password(password: str) -> str:
    """Hashes a plain text password."""
    # Bcrypt has a maximum password length of 72 bytes.
    # Encode and truncate the password to avoid ValueError.
    pwd_bytes = password.encode('utf-8')[:72]
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)


# Alias for backward compatibility
get_password_hash = hash_password
