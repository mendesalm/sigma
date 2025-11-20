# Análise de Conformidade das Diretrizes do Sistema Sigma

Este documento formaliza as diretrizes de concepção e regras de negócio para o sistema Sigma e avalia o estado atual de conformidade do projeto com base na estrutura de arquivos e no histórico de desenvolvimento.

## 1. Diretrizes de Codificação

### 1.a. Padrão de Nomenclatura (Inglês/Português)

- **Diretriz:** Todos os dados técnicos (nomes de arquivos, variáveis, tabelas, funções, etc.) devem ser em inglês. Dados de interface com o usuário (labels, mensagens, etc.) devem ser em português. Termos específicos como "Potência" devem ser contextualizados para "Obedience", e campos como `cnpj` e `CIM` devem ser mantidos.
- **Análise:** `Cumprido`.
- **Observações:** A análise da estrutura de arquivos confirma a adesão a esta diretriz.
    - **Backend:** Nomes de arquivos em `backend/schemas`, `backend/controllers`, e `backend/services` estão em inglês (ex: `lodge_schema.py`, `member_schema.py`). O modelo `Obedience` fornecido como exemplo também segue o padrão, utilizando `name`, `acronym` e mantendo `cnpj`.
    - **Frontend:** Nomes de componentes e páginas em `frontend/src/` estão em inglês (ex: `LodgesPage.tsx`, `MemberRegistryPage.tsx`, `Header.tsx`).
    - A memória do projeto confirma a refatoração para nomes em inglês, mantendo o texto do usuário em português.

### 1.b. Fuso Horário (UTC)

- **Diretriz:** O sistema usará o horário UTC para armazenamento e processamento, convertendo para o horário local do usuário apenas na exibição.
- **Análise:** `A verificar`.
- **Observações:** Esta é uma diretriz de implementação interna. A estrutura de arquivos não permite validar como datas e horas estão sendo tratadas no código-fonte. Requer uma auditoria de código específica nos serviços de backend e componentes de frontend que manipulam datas.

### 1.c. API RESTful e Documentação Swagger

- **Diretriz:** Todos os endpoints da API devem seguir o modelo RESTful e ser documentados via Swagger (OpenAPI).
- **Análise:** `Parcialmente Cumprido`.
- **Observações:** A arquitetura do backend (`controllers`, `services`, `routes`) é totalmente compatível e estruturada para uma API RESTful. No entanto, não há evidências da configuração de ferramentas de geração de documentação como Swagger/OpenAPI na estrutura de arquivos atual. A implementação dos endpoints existe, mas a documentação automática ainda precisa ser configurada.

### 1.d. Eficiência de Código

- **Diretriz:** Analisar a eficiência do código conforme as práticas mais modernas antes de implementar.
- **Análise:** `Diretriz de Processo`.
- **Observações:** Esta é uma diretriz de qualidade contínua e não um item verificável estaticamente. A adoção de frameworks modernos (Python/FastAPI, React/Vite) e uma arquitetura em camadas sugere uma preocupação com as boas práticas, mas a eficiência real depende da implementação de cada função.

### 1.e. Banco de Dados

- **Diretriz:** O banco de dados será o MySQL.
- **Análise:** `A verificar`.
- **Observações:** O projeto utiliza SQLAlchemy e Alembic, que são agnósticos em relação ao banco de dados. Embora sejam totalmente compatíveis com MySQL, a configuração da string de conexão no ambiente do projeto (que não é visível) é o que define o SGBD em uso. A estrutura está pronta para usar MySQL, mas a confirmação final depende da configuração.

### 1.f. Tecnologia do Frontend

- **Diretriz:** O frontend será codificado em React, Vite e TypeScript.
- **Análise:** `Cumprido`.
- **Observações:** A estrutura do diretório `frontend/` confirma plenamente o uso desta stack, com a presença de arquivos como `vite.config.ts`, `tsconfig.json` e componentes `.tsx`.

### 1.g. Tecnologia do Backend

- **Diretriz:** O backend usará Python.
- **Análise:** `Cumprido`.
- **Observações:** O diretório `backend/` é claramente um projeto Python, contendo um ambiente virtual (`venv`), arquivos `.py` e usando `__pycache__`.

---

## 2. Descrição Geral do Sistema

### 2.a. Acessibilidade (Mobile/Web)

- **Diretriz:** O Sigma deve ser acessível por aplicativo móvel ou página web.
- **Análise:** `Parcialmente Cumprido`.
- **Observações:** O projeto atual implementa a aplicação web. Não há nenhuma estrutura de projeto para um aplicativo móvel (seja nativo, seja híbrido como React Native ou Flutter). A aplicação web pode ser responsiva para se adaptar a telas de dispositivos móveis, mas não é um "aplicativo móvel" instalável.

### 2.b. Estrutura de Acesso e Dashboards

- **Diretriz:** O sistema terá uma página pública, uma página de login e dashboards restritos por perfil (SuperAdmin, Obediência, Loja).
- **Análise:** `Cumprido`.
- **Observações:** A estrutura de páginas do frontend (`LandingPage.tsx`, `LoginPage.tsx`) e os layouts de dashboard (`DashboardLayout.tsx`, `MemberDashboardLayout.tsx`, `ObedienceDashboardLayout.tsx`) correspondem exatamente a esta diretriz. O fluxo de autenticação e redirecionamento por perfil também foi implementado.

### 2.c. Gerenciamento de Obediências e Lojas

- **Diretriz:** Criar, Atualizar ou Deletar uma Obediência ou Loja é tarefa exclusiva do usuário SuperAdmin.
- **Análise:** `Cumprido (Estrutura Implementada)`.
- **Observações:** A lógica de autorização (RBAC) para restringir estes endpoints ao perfil SuperAdmin está implementada no backend através de middlewares de autorização, conforme o histórico do projeto.

### 2.d. Criação de Webmasters

- **Diretriz:** Webmasters são criados automaticamente durante a criação de uma Obediência ou Loja. A senha pode ser modificada pelo SuperAdmin.
- **Análise:** `Cumprido`.
- **Observações:** O histórico do projeto confirma a implementação desta regra de negócio, incluindo o reset de senha pelo SuperAdmin.

### 2.e. Responsabilidades e Login de Membros

- **Diretriz:** Webmasters gerenciam seus dashboards. Credenciais são enviadas por e-mail. Membros podem fazer login com e-mail ou CIM.
- **Análise:** `Parcialmente Cumprido`.
- **Observações:** A criação do Webmaster e o envio de credenciais estão implementados. A capacidade de login com e-mail é padrão. A funcionalidade de login usando o CIM (um campo específico do modelo de membro) precisa ser verificada no código do serviço de autenticação para confirmar sua implementação.

### 2.f. Redirecionamento por Perfil

- **Diretriz:** O backend deve avaliar o perfil do usuário no login e o frontend deve direcionar para o dashboard correto.
- **Análise:** `Cumprido`.
- **Observações:** O fluxo de autenticação implementado retorna o perfil do usuário (SuperAdmin, Webmaster, Membro) e o frontend utiliza essa informação para carregar o layout e as rotas apropriadas.

### 2.g. Controle de Acesso (RBAC)

- **Diretriz:** Webmaster tem acesso total ao seu escopo. O acesso dos demais membros é controlado por cargo/função (RBAC).
- **Análise:** `Cumprido (Estrutura Implementada)`.
- **Observações:** O backend possui um middleware de autorização e endpoints para gerenciamento de Cargos (`Roles`) e Permissões (`Permissions`), o que constitui a base necessária para o RBAC. A aplicação detalhada dessas regras em cada endpoint é uma tarefa de implementação contínua.

### 2.h. Fluxo de Login

- **Diretriz:** No ato do login, o backend avaliará o perfil do usuário para definir seu dashboard de destino.
- **Análise:** `Cumprido`.
- **Observações:** Esta diretriz é um resumo da 2.f e 2.g. O sistema de autenticação e autorização foi projetado para atender a este requisito.
