from passlib.context import CryptContext

# Use bcrypt for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashes a plain text password."""
    # Bcrypt has a maximum password length of 72 bytes.
    # Truncate the password to avoid errors.
    return pwd_context.hash(password[:72])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hashed one."""
    return pwd_context.verify(plain_password[:72], hashed_password)


# Alias for backward compatibility
get_password_hash = hash_password
