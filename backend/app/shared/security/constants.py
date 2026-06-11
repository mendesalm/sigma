import enum

class UserTypeEnum(enum.StrEnum):
    SUPER_ADMIN = "super_admin"
    WEBMASTER = "webmaster"
    MEMBER = "member"

class CredentialLevel(enum.IntEnum):
    SUPER_ADMIN_LEVEL = 9999
    WEBMASTER_LEVEL = 999
    # Graduações / Membros terão suas credenciais extraídas dinamicamente dos cargos (roles)
