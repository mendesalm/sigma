# Contexto Atual: Projeto Sigma

**Data da Última Atualização:** 12 de Junho de 2026
**Arquitetura Base:** Modular Monolith (Vertical Slices / Feature-Sliced Design)

## Resumo do Estado da Aplicação
O projeto Sigma sofreu a sua maior refatoração estrutural (Backend FastAPI e Frontend React em Vertical Slices). Atualmente o foco está na **homologação das Regras de Ouro de Qualidade de Código**.

## 1. Backend (FastAPI / SQLAlchemy)
Os módulos `access_control` e `members` alcançaram o "Padrão Ouro":
- **Documentação PT-BR:** Todos os docstrings e Swagger descritos estritamente em português, mantendo a semântica do código (variáveis/funções) em inglês.
- **Logging Estruturado (JSON):** Injeção de `logger.info`, `logger.warning` e `logger.error` em substituição aos prints e HttpExceptions silenciosas, atrelando sempre um `trace_id` e atributos de identificação (`user_id`, `cim`).

## 2. Frontend (React / Vite)
O Frontend acompanhou as Regras de Ouro:
- **Alertas Globais (Notistack):** Substituição de todos os estados locais por um ecossistema `useSnackbar` global (`main.tsx`).
- **Tratamento de Exceções:** Formulários dos módulos `access_control` e `members` interceptam diretamente a carga de erro em PT-BR lançada pelo backend (via `error.response?.data?.detail`), provendo feedback exato na tela (Ex: "CIM já cadastrado").

## Próximos Passos (Backlog Futuro)
1. Aplicar a mesma auditoria e Regras de Ouro para os demais módulos de negócio (`lodges`, `obediences`, `finance`, etc).
2. **Feature Toggles Granulares:** Implementar painel para o SuperAdmin desligar Módulos inteiros por Cliente/Loja no Banco de Dados.
3. **Separação de Modelos (DB):** Isolar os bancos/tabelas caso o monolito modular necessite de particionamento pesado no futuro.
