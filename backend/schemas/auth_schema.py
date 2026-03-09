from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str = Field(..., description="O token JWT gerado para autenticação.")
    token_type: str = Field(..., description="O tipo do token, geralmente 'bearer'.")

    model_config = {
        "json_schema_extra": {
            "example": {"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "token_type": "bearer"}
        }
    }


class EmailSchema(BaseModel):
    email: EmailStr = Field(..., description="Endereço de email válido.")

    model_config = {"json_schema_extra": {"example": {"email": "usuario@exemplo.com"}}}


class LodgeMemberLogin(BaseModel):
    email: EmailStr = Field(..., description="Email do membro.")
    password: str = Field(..., description="Senha do membro.")

    model_config = {"json_schema_extra": {"example": {"email": "membro@loja.com", "password": "senha_segura123"}}}


class LodgeMemberSelectLodge(BaseModel):
    lodge_id: int = Field(..., description="ID da loja selecionada (caso o membro tenha múltiplas filiações).")

    model_config = {"json_schema_extra": {"example": {"lodge_id": 10}}}


class LodgeMemberForgotPassword(BaseModel):
    email: EmailStr = Field(..., description="Email do membro para recebimento do link de recuperação.")

    model_config = {"json_schema_extra": {"example": {"email": "membro@loja.com"}}}


class LodgeMemberResetPassword(BaseModel):
    token: str = Field(..., description="Token de recuperação de senha enviado por email.")
    new_password: str = Field(..., description="Nova senha a ser cadastrada.")

    model_config = {
        "json_schema_extra": {"example": {"token": "a1b2c3d4e5f6g7h8", "new_password": "nova_senha_segura456"}}
    }


class LodgeMemberAuthResponse(BaseModel):
    access_token: str = Field(..., description="Token JWT para autenticação nas chamadas da API.")
    token_type: str = Field("bearer", description="Tipo do token de autenticação.")
    user_type: str = Field(..., description="Tipo do usuário (ex: MEMBER).")
    user_id: int = Field(..., description="ID interno do usuário logado.")
    email: EmailStr = Field(..., description="Email de cadastro do usuário.")
    full_name: str | None = Field(None, description="Nome completo do membro.")
    lodge_id: int | None = Field(None, description="ID da loja escolhida no momento do login.")
    lodge_name: str | None = Field(None, description="Nome da loja escolhida.")
    role_id: int | None = Field(None, description="ID do cargo exercido pelo membro na loja selecionada.")
    role_name: str | None = Field(None, description="Nome do cargo exercido.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbG...",
                "token_type": "bearer",
                "user_type": "MEMBER",
                "user_id": 15,
                "email": "membro@loja.com",
                "full_name": "João Silva",
                "lodge_id": 1,
                "lodge_name": "Loja Fraternidade",
                "role_id": 3,
                "role_name": "Venerável Mestre",
            }
        }
    }


class WebmasterLogin(BaseModel):
    email: EmailStr = Field(..., description="Email do Webmaster.")
    password: str = Field(..., description="Senha do Webmaster.")

    model_config = {"json_schema_extra": {"example": {"email": "admin@sigma.com", "password": "senha_admin"}}}


class WebmasterAuthResponse(BaseModel):
    access_token: str = Field(..., description="Token JWT para autenticação do Webmaster.")
    token_type: str = Field("bearer", description="Tipo do token de autenticação.")
    user: dict = Field(..., description="Objeto contendo dados básicos do Webmaster.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbG...",
                "token_type": "bearer",
                "user": {"id": 1, "name": "Webmaster Admin", "email": "admin@sigma.com"},
            }
        }
    }


class WebmasterForgotPassword(BaseModel):
    email: EmailStr = Field(..., description="Email do Webmaster para reinicialização da senha.")


class WebmasterResetPassword(BaseModel):
    token: str = Field(..., description="Token seguro de recuperação de senha.")
    new_password: str = Field(..., description="Nova senha definida pelo Webmaster.")
