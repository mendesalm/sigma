# Contexto Atual: Projeto Sigma

**Data da Última Atualização:** 05 de Junho de 2026
**Arquitetura Base:** Modular Monolith (Vertical Slices / Feature-Sliced Design)

## Resumo do Estado da Aplicação
O projeto Sigma sofreu a sua maior refatoração estrutural, consolidando tanto o **Backend (FastAPI)** quanto o **Frontend (React)** em uma arquitetura fortemente coesa e desacoplada, dividida por módulos de domínio de negócio.

A filosofia do sistema mudou de "Separação por Camadas Técnicas" (Pastas com *Controllers, Services, Models*) para "Separação por Contexto" (Vertical Slices), onde cada módulo carrega toda a stack técnica necessária para entregar o seu escopo.

## 1. Backend (FastAPI / SQLAlchemy)
O Backend encontra-se 100% modularizado na pasta `backend/app/modules/`.
**Destaques:**
- **Storage Dinâmico (Multitenancy):** A geração de documentos PDF está lendo ativamente as pastas isoladas de cada Tenant na pasta `backend/storage/lodges/loja_{numero}/`.
- **Módulos Físicos:** As rotas, schemas, services e utilities de acesso agora vivem estritamente dentro de seus respectivos módulos (`access_control`, `members`, `finance`, `sessions`, `core`, etc).
- **Código Compartilhado:** Utilitários e templates genéricos (base do Tiptap/PDFs) vivem agora protegidos em `backend/app/shared/`.
- **Estado dos Testes:** Todos os 127 testes nativos do pytest (abrangendo a nova arquitetura e o sistema de PDFs) passaram com 100% de sucesso na última rodada.

## 2. Frontend (React / Vite)
O Frontend abandonou a arquitetura em camadas e foi espelhado no Backend (Feature-Sliced Design).
**Destaques:**
- **Módulos (`src/modules`):** Os 8 domínios de negócio foram mapeados. Telas misturadas em diretórios de atores (`Tesoureiro`, `Obreiro`, `Secretario`) agora pertencem aos módulos `finance`, `members` ou `sessions` respectivamente.
- **Roteador Desacoplado:** O gigantesco `router.tsx` foi fragmentado. Cada módulo injeta seu próprio array de rotas (ex: `financeLodgeDashboardRoutes`) diretamente no orquestrador principal.
- **Paths Absolutos:** A navegação de imports agora utiliza estritamente o alias `@/` resolvido no Vite e TsConfig, abolindo caminhos relativos destrutivos (`../../../`).
- **Estado do Build:** A compilação estrita do Typescript (`npx tsc --noEmit`) rodou com excelência, atestando a integridade das referências entre páginas.

## Próximos Passos (Backlog Futuro)
Com o Monolito Modular limpo e funcional, as bases estão prontas para escalar funcionalidades mais complexas, tais como:
1. **Feature Toggles Granulares:** Implementar painel para o SuperAdmin desligar Módulos inteiros por Cliente/Loja no Banco de Dados.
2. **Separação de Modelos (DB):** Embora o código esteja isolado por Vertical Slices, o banco de dados (Alembic) ainda possui uma modelagem central (`backend/models/`). O futuro permite isolar o banco se necessário.
