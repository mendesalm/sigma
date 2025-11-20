
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..services import auth_service
from ..utils import auth_utils
from ..database import get_db
from ..schemas.auth_schema import Token # Using a generic Token schema for response

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Provides an access token for a valid user.
    The 'username' field from the form can be an email, username, or CIM.
    """
    user_auth_data = auth_service.authenticate_user(
        db=db, identifier=form_data.username, password=form_data.password
    )

    if not user_auth_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user, user_type = user_auth_data

    # Create the data for the JWT payload
    access_token_data = {
        "sub": user.email,  # Use email as the subject
        "user_id": user.id,
        "user_type": user_type,
    }

    # Add specific context based on user type
    if user_type == 'webmaster':
        if user.lodge_id:
            access_token_data["lodge_id"] = user.lodge_id
        if user.obedience_id:
            access_token_data["obedience_id"] = user.obedience_id
    
    # For members, you might want to add their associations later
    # if they belong to multiple lodges/obediences.

    access_token = auth_utils.create_access_token(data=access_token_data)

    return {"access_token": access_token, "token_type": "bearer"}
