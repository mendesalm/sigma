# Documento de Handoff - Ecossistema Sigma / Lojas (22/09/2026)

**Data de Atualização:** 22 de Setembro de 2026  
**Status da Sessão:** 🟢 Ambientes ativos, testes de autenticação 100% OK e Definição Arquitetural de Reincorporação registrada.

---

## 🎯 Contexto Atual da Sessão
1. **Ambientes Levantados para Comparação Visual:**
   - **Sigma Legado:** Frontend em `:5176`, Backend em `:8010` (banco `esigma_db_ref`).
   - **Sigma 2.0:** Frontend em `:5177`, Backend em `:8020` (banco `esigma`).
   - **Módulo Lojas:** Frontend em `:5175`, Backend em `:8001` (banco `lojas_db`).
   - **e-Sigma (IdP):** Backend em `:8000` (banco `esigma`).
2. **Autenticação Unificada Resolvida:**
   - Senhas tolerantes para `#` e `!` em todos os backends.
   - Login por E-mail (`mendesalm@gmail.com`), CIM (`272875`) ou CPF (`83105980687`) operando em 100% dos ambientes.
   - CORS atualizado nos 3 backends para permitir requisições de todas as instâncias Vite de desenvolvimento.

---

## 🏛️ Nova Definição de Arquitetura e Implantação (VINCULANTE - 22/09/2026)

> O usuário definiu formalmente:
> **"O módulo Lojas voltará a incorporar os módulos de Finanças, Biblioteca, Classificados, Arquiteto e Patrimônio, pois lidar com vários bancos de dados está ficando muito complexo."**

### Racional Arquitetural:
- Em vez de lidar com bases de dados satélites separadas para tesouraria, livros, anúncios e patrimônio, o banco **`lojas_db`** centralizará todo o ERP da Loja Maçônica.
- O **`e-Sigma`** permanece exclusivamente como Provedor de Identidade (IdP) e gerenciador de assinaturas/SaaS.
- O **`CoReVM`** permanece como consumidor das Lojas via API.
- **Design do Dashboard:** O dashboard do Lojas deve ser **um clone estritamente em termos de design de frontend do sistema legado Sigma** (`sigma/frontend`), preservando sua disposição visual de tabelas, cartões, widgets e forma consagrada de apresentação de dados para o usuário final, com o backend mantido moderno (`FastAPI` + `lojas_db`).

---

## 🚧 Próximos Passos para a Próxima Sessão
1. Migrar os schemas de Finanças, Biblioteca, Classificados, Arquiteto e Patrimônio para o banco `lojas_db`.
2. Portar as rotas de backend correspondentes para `Lojas/backend/api/v1/`.
3. Ajustar o Dashboard do Lojas para espelhar como clone exato a apresentação de dados do legado Sigma.
4. Portar e modernizar as telas correspondentes no frontend React/MUI do Lojas (`Lojas/frontend/`).
