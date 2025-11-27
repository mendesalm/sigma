from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..models import models
from ..utils import password_utils


def authenticate_user(db: Session, identifier: str, password: str) -> tuple[any, str] | None:
    """
    Authenticates a user by checking credentials against SuperAdmin, Webmaster, and Member tables.

    Args:
        db: The database session.
        identifier: The user's identifier (can be email, username, or CIM).
        password: The user's plain text password.

    Returns:
        A tuple containing the user object and their role as a string (e.g., 'super_admin', 'webmaster', 'member'),
        or None if authentication fails.
    """
    print(f"Authenticating user with identifier: {identifier}")

    # 1. Check for SuperAdmin
    super_admin = (
        db.query(models.SuperAdmin)
        .filter(or_(models.SuperAdmin.username == identifier, models.SuperAdmin.email == identifier))
        .first()
    )
    if super_admin:
        print(f"Found super_admin: {super_admin.username}")
        password_verified = password_utils.verify_password(password, super_admin.password_hash)
        print(f"Password verified: {password_verified}")
        if password_verified:
            return super_admin, "super_admin"

    # 2. Check for Webmaster
    webmaster = (
        db.query(models.Webmaster)
        .filter(or_(models.Webmaster.username == identifier, models.Webmaster.email == identifier))
        .first()
    )
    if webmaster:
        print(f"Found webmaster: {webmaster.username}")
        password_verified = password_utils.verify_password(password, webmaster.password_hash)
        print(f"Password verified: {password_verified}")
        if password_verified:
            return webmaster, "webmaster"

    # 3. Check for Member (by email or CIM)
    member = (
        db.query(models.Member).filter(or_(models.Member.email == identifier, models.Member.cim == identifier)).first()
    )
    if member:
        print(f"Found member: {member.full_name}")
        password_verified = password_utils.verify_password(password, member.password_hash)
        print(f"Password verified: {password_verified}")
        if password_verified:
            return member, "member"

    # 4. If no user is found or password does not match
    print("User not found or password does not match.")
    return None


def _create_webmaster_user(
    db: Session,
    name: str,
    email: str,
    obedience_id: int | None = None,
    lodge_id: int | None = None,
    commit: bool = True,
) -> tuple[models.Webmaster, str]:
    """
    Creates a new Webmaster user, generates a temporary password, and associates
    them with an obedience or a lodge.

    Args:
        db: The database session.
        name: The full name of the webmaster.
        email: The webmaster's email address, used as the username.
        obedience_id: The ID of the obedience to associate with.
        lodge_id: The ID of the lodge to associate with.
        commit: Whether to commit the transaction immediately.

    Returns:
        A tuple containing the created Webmaster object and the plain text temporary password.
    """
    import secrets
    import string

    # 1. Generate a temporary password
    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for i in range(10))

    # 2. Hash the password
    password_hash = password_utils.hash_password(temp_password)

    # 3. Create the Webmaster instance
    db_webmaster = models.Webmaster(
        email=email,
        username=email,  # Use email as username by default
        password_hash=password_hash,
        is_active=True,
        obedience_id=obedience_id,
        lodge_id=lodge_id,
    )

    db.add(db_webmaster)
    if commit:
        db.commit()
        db.refresh(db_webmaster)
    else:
        db.flush()  # Flush to get the ID if needed, but don't commit

    # TODO: Implement actual email sending logic here
    print("--- CUIDADO: SENHA TEMPORÁRIA GERADA ---")
    print(f"Usuário Webmaster: {email}")
    print(f"Senha Temporária: {temp_password}")
    print("-----------------------------------------")

    return db_webmaster, temp_password


def calculate_member_credential(member: models.Member, entity_id: int, entity_type: str) -> int:
    """
    Calculates the active credential for a member within a specific entity context.

    Logic:
    1. Check for specific Role in the entity.
    2. If Role exists: Credential = Role.base_credential + Role.level
    3. If No Role: Credential = Degree (Apprentice=1, Fellow=2, Master=3)
    """
    role = None
    if entity_type == "lodge":
        association = next((a for a in member.lodge_associations if a.lodge_id == entity_id), None)
        if association:
            role = association.role
    elif entity_type == "obedience":
        association = next((a for a in member.obedience_associations if a.obedience_id == entity_id), None)
        if association:
            role = association.role

    if role:
        # Ensure base_credential and level are integers
        base = role.base_credential if role.base_credential is not None else 0
        level = role.level if role.level is not None else 0
        return base + level

    # Fallback to Degree
    degree_map = {
        "Apprentice": 1,
        "Fellow": 2,
        "Master": 3,
        "Installed Master": 3,  # Treat Installed Master as Master for base credential, specific roles handle higher privileges
    }
    # Handle Enum or String
    degree_val = member.degree.value if hasattr(member.degree, "value") else member.degree
    return degree_map.get(degree_val, 1)  # Default to 1 (Apprentice)
