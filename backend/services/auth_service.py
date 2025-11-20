
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..models import models
from ..utils import password_utils
from typing import Optional, Tuple


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[Tuple[any, str]]:
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

    # 1. Check for SuperAdmin
    super_admin = db.query(models.SuperAdmin).filter(
        or_(models.SuperAdmin.username == identifier, models.SuperAdmin.email == identifier)
    ).first()
    if super_admin and password_utils.verify_password(password, super_admin.password_hash):
        return super_admin, "super_admin"

    # 2. Check for Webmaster
    webmaster = db.query(models.Webmaster).filter(
        or_(models.Webmaster.username == identifier, models.Webmaster.email == identifier)
    ).first()
    if webmaster and password_utils.verify_password(password, webmaster.password_hash):
        return webmaster, "webmaster"

    # 3. Check for Member (by email or CIM)
    member = db.query(models.Member).filter(
        or_(models.Member.email == identifier, models.Member.cim == identifier)
    ).first()
    if member and password_utils.verify_password(password, member.password_hash):
        return member, "member"

    # 4. If no user is found or password does not match
    return None

