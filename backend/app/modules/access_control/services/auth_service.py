from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.modules.access_control.utils import password_utils
from models import models
from app.core.logger import logger

def authenticate_user(db: Session, identifier: str, password: str, potencia_id: int | None = None) -> tuple[any, str] | None:
    """
    Autentica um usuário verificando credenciais nas tabelas SuperAdmin, Webmaster e Member.

    Args:
        db: Sessão do banco de dados.
        identifier: Identificador do usuário (pode ser e-mail, username ou CIM).
        password: A senha em texto plano.
        potencia_id: ID da Potência (Opcional, porém obrigatório para Membros para evitar colisão de CIM).

    Returns:
        Uma tupla contendo o objeto do usuário e sua role como string (ex: 'super_admin', 'webmaster', 'member'),
        ou None se a autenticação falhar.
    """
    logger.info("Iniciando autenticação de usuário", extra={"extra_data": {"identifier": identifier}})

    # 1. Checa por SuperAdmin
    super_admin = (
        db.query(models.SuperAdmin)
        .filter(or_(models.SuperAdmin.username == identifier, models.SuperAdmin.email == identifier))
        .first()
    )
    if super_admin:
        logger.debug("Usuário identificado como super_admin", extra={"extra_data": {"username": super_admin.username}})
        if password_utils.verify_password(password, super_admin.password_hash):
            return super_admin, "super_admin"

    # 2. Checa por Webmaster
    webmaster = (
        db.query(models.Webmaster)
        .filter(or_(models.Webmaster.username == identifier, models.Webmaster.email == identifier))
        .first()
    )
    if webmaster:
        logger.debug("Usuário identificado como webmaster", extra={"extra_data": {"username": webmaster.username}})
        if password_utils.verify_password(password, webmaster.password_hash):
            # Verifica se a loja associada está ativa
            if webmaster.lodge_id:
                lodge = db.query(models.Lodge).filter(models.Lodge.id == webmaster.lodge_id).first()
                if lodge and not lodge.is_active:
                    logger.warning("Acesso negado: Loja do webmaster está inativa", extra={"extra_data": {"lodge_name": lodge.lodge_name}})
                    return None

            return webmaster, "webmaster"

    # 3. Checa por Member (por e-mail ou CIM)
    # Se potencia_id foi fornecido, o login de membro é restrito a esta potência para evitar colisão de CIM
    member_query = db.query(models.Member).filter(or_(models.Member.email == identifier, models.Member.cim == identifier))
    
    if potencia_id is not None:
        member_query = member_query.join(
            models.MemberObedienceAssociation, models.Member.id == models.MemberObedienceAssociation.member_id
        ).filter(models.MemberObedienceAssociation.obedience_id == potencia_id)
        
    member = member_query.first()
    
    if member:
        logger.debug("Usuário identificado como membro", extra={"extra_data": {"member_name": member.full_name}})
        if password_utils.verify_password(password, member.password_hash):
            # Nota: O login do membro agora exige escopo da obediência (potencia_id) se existirem CIMs duplicados globais.
            return member, "member"

    # 4. Falha na autenticação
    logger.warning("Falha na autenticação: usuário não encontrado ou senha incorreta", extra={"extra_data": {"identifier": identifier}})
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
    Cria um novo usuário Webmaster, gera uma senha temporária e o associa
    a uma obediência ou loja.

    Args:
        db: Sessão do banco de dados.
        name: O nome completo do webmaster.
        email: E-mail do webmaster, usado também como username.
        obedience_id: ID da obediência associada.
        lodge_id: ID da loja associada.
        commit: Se deve efetuar o commit da transação imediatamente.

    Returns:
        Uma tupla contendo a instância do Webmaster criada e a senha temporária em texto plano.
    """
    import secrets
    import string

    # 1. Gera uma senha temporária
    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for i in range(10))

    # 2. Faz o hash da senha
    password_hash = password_utils.hash_password(temp_password)

    # 3. Cria a instância
    db_webmaster = models.Webmaster(
        email=email,
        username=email,
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
        db.flush()

    logger.info("Senha temporária de Webmaster gerada com sucesso", extra={"extra_data": {"email": email}})
    # AVISO: Evitar imprimir senhas diretamente no console em produção. O envio deve ser via E-mail.

    return db_webmaster, temp_password


def calculate_member_credential(member: models.Member, entity_id: int, entity_type: str) -> int:
    """
    Calcula a credencial ativa para um membro dentro do contexto de uma entidade específica.

    Lógica:
    1. Verifica se existe um Cargo (Role) específico na entidade.
    2. Se existir: Credencial = Role.base_credential + Role.level
    3. Sem Cargo: Credencial = Grau (Aprendiz=1, Companheiro=2, Mestre=3)
    """
    role = None
    if entity_type == "lodge":
        # Verifica se há cargo ativo no histórico desta loja
        active_role_history = next(
            (h for h in member.role_history if h.lodge_id == entity_id and h.end_date is None), None
        )
        if active_role_history:
            role = active_role_history.role

    elif entity_type == "obedience":
        # Associações com obediência ligam diretamente a um cargo
        association = next((a for a in member.obedience_associations if a.obedience_id == entity_id), None)
        if association:
            role = association.role

    if role:
        base = role.base_credential if role.base_credential is not None else 0
        level = role.level if role.level is not None else 0
        return base + level

    # Fallback para o Grau Maçônico
    degree_map = {
        "Apprentice": 1,
        "Fellow": 2,
        "Master": 3,
        "Installed Master": 3,
    }
    degree_val = member.degree.value if hasattr(member.degree, "value") else member.degree
    return degree_map.get(degree_val, 1)


def get_active_role_name(member: models.Member, entity_id: int, entity_type: str) -> str | None:
    """
    Recupera o nome do cargo ativo de um membro dentro do contexto de uma entidade.
    """
    if entity_type == "lodge":
        active_role_history = next(
            (h for h in member.role_history if h.lodge_id == entity_id and h.end_date is None), None
        )
        if active_role_history:
            return active_role_history.role.name

    elif entity_type == "obedience":
        association = next((a for a in member.obedience_associations if a.obedience_id == entity_id), None)
        if association:
            return association.role.name

    return None
