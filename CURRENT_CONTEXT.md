# Contexto Atual: Projeto Sigma

**Data da Última Atualização:** 27 de Junho de 2026
**Arquitetura Base:** Modular Monolith (Vertical Slices / Feature-Sliced Design)

## Resumo do Estado da Aplicação
O projeto Sigma possui agora uma **Arquitetura Multi-Tenant** sólida (isolando dados por Potência e suportando associações múltiplas).
Recentemente, o **Módulo Cashless (Sistema de Comanda Eletrônica e PDV do Bar)** foi integralmente desenhado e implementado.

## 1. Backend (FastAPI / SQLAlchemy)
- **Múltiplos Tenants (Access Control e Members):** Suporte robusto a login via `X-Tenant-Potencia`, seletores pós-login e bloqueios de associação seguros (`with_for_update`).
- **Módulo Cashless (Carteira e Motor Transacional ACID):**
  - Modelagem do Livro Razão (Ledger) para a Carteira de Usuários, com saldo calculado dinamicamente baseando-se em eventos estritos (Créditos e Débitos).
  - Rotas expostas para `Webhooks do Mercado Pago` que alimentam as carteiras (Idempotência garantida).
  - Controle de estoque e processamento de Venda (Omnichannel) via PDV com prevenção de Race Conditions (`with_for_update`).
  - Banco populado com um seeder `seed_cashless.py` contendo produtos, Gerente, e Cliente.

## 2. Frontend (React / Vite)
- **Tenant Onboarding & Multi-lojas:** Fluxos pré-login e pós-login finalizados.
- **Integração Cashless PDV:**
  - O terminal "Sandbox" de testes do PDV do Bar foi evoluído para uma rota segura de Produção em `/dashboard/lodge-dashboard/banquetes/pdv`.
  - Exibição exclusiva para as permissões **Mestre de Banquetes**, **Venerável Mestre** e Admins globais.
  - A interface comunica-se com a API (`getProducts`, `createOrder`, `getBalance`), reflete a tela de Caixa (produtos à esquerda, carrinho à direita) e lê dados do `AuthContext` do Operador do Caixa.

## Próximos Passos (Backlog Futuro)
1. **App Mobile Cashless:** Construir a visão do cliente no aplicativo móvel para recarga (integração PIX/QR Code) e consulta de extrato.
2. **Homologação Geográfica:** Testes das cercas virtuais de check-in (Lojas A a F).
3. **Gateway Real:** Integrar de fato o SDK do Mercado Pago ao invés de webhooks mockados.
4. **Testes Automatizados (Pytest):** Cobertura das transações críticas (Race conditions de estoque e saldo).
