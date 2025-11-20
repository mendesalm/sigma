
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..utils import auth_utils
from .. import database
from ..services import auth_service

# This tells FastAPI which URL to check for the token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes the token, handles errors, and returns the payload.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth_utils.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    return payload

def get_current_lodge_webmaster(payload: dict = Depends(get_current_user_payload)) -> int:
    """
    Checks if the current user is a webmaster associated with a lodge and returns the lodge_id.
    """
    user_type = payload.get("user_type")
    lodge_id = payload.get("lodge_id")

    if user_type != "webmaster" or not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Lodge Webmasters."
        )
    return lodge_id


# You can create more specific dependencies based on this, for example:
# def get_current_super_admin(payload: dict = Depends(get_current_user_payload)):
#     if payload.get("user_type") != "super_admin":
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a super admin")
#     return payload

