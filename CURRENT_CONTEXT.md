# Contexto Atual: Projeto Sigma

**Data da Última Atualização:** 26 de Junho de 2026
**Arquitetura Base:** Modular Monolith (Vertical Slices / Feature-Sliced Design)

## Resumo do Estado da Aplicação
O projeto Sigma concluiu a homologação das Regras de Ouro de Qualidade e avançou para uma **Arquitetura Multi-Tenant** que isola dados por Potência e permite associações múltiplas (um maçom pertencendo a múltiplas lojas).

## 1. Backend (FastAPI / SQLAlchemy)
Os módulos `access_control` e `members` foram expandidos para lidar com Multi-Tenancy:
- **Remoção da Trava Global de CIM:** A tabela `members` não obriga mais a unicidade de `cim`. A trava de unicidade foi movida para a camada de serviços (via *Pessimistic Locking* `with_for_update`), garantindo que o CIM só seja único **dentro de uma mesma Potência**.
- **Segurança IDOR e Associação Cruzada:** Rota `/check-cim` restrita à Potência do secretário logado. Implementação de fluxo de importação intra-potência via `POST /{member_id}/associate` sem duplicar dados pessoais.
- **Tenant Isolation no Login:** Autenticação agora exige `X-Tenant-Potencia`. Casos de maçons em múltiplas Lojas geram um redirecionamento ao frontend para a Seleção de Loja (Contexto Pós-Login).

## 2. Frontend (React / Vite)
- **Tenant Onboarding:** Adicionado fluxo obrigatório pré-login para seleção da Potência do usuário, persistindo no `localStorage`.
- **Seleção de Loja Pós-Login:** Usuários híbridos escolhem o contexto operacional, que é selado no JWT final (`loja_atual_id`).
- **Wizard de Primeiro Acesso:** Fluxo de validação cruzada entre CIM e Data de Nascimento para recuperação de contas com e-mails defasados.

## Próximos Passos (Backlog Futuro)
1. Aplicar a mesma auditoria e Regras de Ouro para os demais módulos de negócio (`finance`, `check-in`, etc).
2. **Homologação Geográfica:** Testes das cercas virtuais usando os dados de teste populados (Lojas A a F).
3. **Feature Toggles Granulares:** Implementar painel para o SuperAdmin desligar Módulos inteiros por Cliente/Loja no Banco de Dados.
