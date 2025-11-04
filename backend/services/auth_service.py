# backend/services/auth_service.py

from sqlalchemy import or_

from sqlalchemy.orm import Session

from typing import Optional, Tuple, Any

from datetime import datetime, timedelta, timezone



from jose import JWTError, jwt

from passlib.context import CryptContext



from models.models import SuperAdmin, Webmaster, Member

from config.settings import settings



# Configuração do Passlib para hashing de senhas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



def verify_password(plain_password: str, hashed_password: str) -> bool:

    """Verifica se a senha em texto plano corresponde ao hash."""

    return pwd_context.verify(plain_password, hashed_password)



def get_password_hash(password: str) -> str:

    """Gera o hash de uma senha."""

    return pwd_context.hash(password)



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:



    """Cria um novo token de acesso JWT."""



    to_encode = data.copy()



    if expires_delta:



        expire = datetime.now(timezone.utc) + expires_delta



    else:



        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)



    to_encode.update({"exp": expire})



    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)



    return encoded_jwt







def decode_token(token: str) -> dict:



    """Decodifica um token de acesso, retornando o payload."""



    try:



        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])



        return payload



    except JWTError:



        raise HTTPException(



            status_code=status.HTTP_401_UNAUTHORIZED,



            detail="Could not validate credentials",



            headers={"WWW-Authenticate": "Bearer"},



        )







def authenticate_user(db: Session, username: str, password: str) -> Optional[Tuple[Any, str]]:

    """

    Autentica um usuário buscando em múltiplas tabelas (SuperAdmin, Webmaster, Member).

    Retorna o objeto do usuário e seu escopo (role) se as credenciais forem válidas.

    """

    # 1. Tenta autenticar como SuperAdmin

    super_admin = db.query(SuperAdmin).filter(SuperAdmin.username == username).first()

    if super_admin and verify_password(password, super_admin.password_hash):

        return super_admin, "super_admin"



    # 2. Tenta autenticar como Webmaster

    webmaster = db.query(Webmaster).filter(Webmaster.username == username).first()

    if webmaster and verify_password(password, webmaster.password_hash):

        scope = "webmaster_obedience" if webmaster.obedience_id else "webmaster_lodge"

        return webmaster, scope



    # 3. Tenta autenticar como Member (usando email ou CIM como username)

    member = db.query(Member).filter(or_(Member.email == username, Member.cim == username)).first()

    if member and verify_password(password, member.password_hash):

        return member, "member"



    return None, None


