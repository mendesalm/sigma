# Contexto Atual: Projeto Sigma

**Data da Última Atualização:** 30 de Junho de 2026
**Arquitetura Base:** Modular Monolith (Vertical Slices / Feature-Sliced Design)

## Resumo do Estado da Aplicação
O projeto Sigma possui uma **Arquitetura Multi-Tenant** sólida (isolando dados por Potência e suportando associações múltiplas).
Recentemente, o Módulo de Notificações Inteligentes (WhatsApp) e o Motor de Tarefas (APScheduler) foram integrados ao Backend.

## 1. Backend (FastAPI / SQLAlchemy)
- **Múltiplos Tenants (Access Control e Members):** Suporte robusto a login via `X-Tenant-Potencia`, seletores pós-login e bloqueios de associação seguros (`with_for_update`).
- **Módulo Cashless (Carteira e Motor Transacional ACID):**
  - Modelagem do Livro Razão (Ledger) para a Carteira de Usuários, com saldo calculado dinamicamente.
  - Rotas expostas para `Webhooks do Mercado Pago` que alimentam as carteiras (Idempotência garantida).
  - Banco populado com um seeder `seed_cashless.py` contendo produtos, Gerente, e Cliente.
- **Módulo de Comunicação & Automação (WhatsApp & Cronjobs):**
  - API de Webhook configurada para interagir com a **Evolution API**, analisando intenções como `#VOU` (presença + acompanhantes) e `#agenda jantar` via Expressões Regulares (Regex).
  - Funcionalidade Multitenant vinculando automaticamente a resposta (e inserção no BD) à Loja baseada no `whatsapp_group_id`.
  - Motor de Background Tasks (**APScheduler**) nativo do FastAPI implementado com sucesso para rodar Bumps Diários (10h, 14h, 18h) com previsão de presença.
  - Alertas passivos de Aniversário (08:00) disparando mensagens personalizadas diretas.
  - *Regra Global*: Opcionais como `whatsapp_notifications_enabled` nascem desativados (`False`) por default (`Security by Default`).

## 2. Frontend (React / Vite)
- **Tenant Onboarding & Multi-lojas:** Fluxos pré-login e pós-login finalizados.
- **Integração Cashless PDV:**
  - Interface acessível em `/dashboard/lodge-dashboard/banquetes/pdv`. Exibição exclusiva para as permissões aplicáveis.

## Próximos Passos (Backlog Futuro)
1. **App Mobile Cashless:** Construir a visão do cliente no aplicativo móvel para recarga e extrato.
2. **Homologação Geográfica:** Testes das cercas virtuais de check-in (Lojas A a F).
3. **Gateway Real:** Integrar de fato o SDK do Mercado Pago ao invés de webhooks mockados.
4. **Testes Automatizados (Pytest):** Cobertura das transações críticas.
