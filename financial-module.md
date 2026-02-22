# Financial Module (Módulo Financeiro) - Sigma

## Overview
Este documento define o plano de implementação do Módulo Financeiro para o sistema Sigma, englobando o backend (FastAPI/MySQL) e o frontend (React/Vite). O objetivo é fornecer uma gestão financeira completa, automatizada e segura para a Loja Maçônica, incluindo contas a pagar/receber, conciliação bancária via gateway (PIX/Boleto) e relatórios contábeis.

## Project Type
WEB + BACKEND

## Success Criteria
- [ ] CRUD completo de categorias (Plano de Contas), lançamentos e orçamentos.
- [ ] Integração funcional com webhook de gateway de pagamento para conciliação automática.
- [ ] Dashboard e relatórios financeiros (DRE, Fluxo de Caixa) operacionais.
- [ ] Portal do Obreiro permitindo acesso a extratos e geração de 2ª via/cópia de chave PIX.
- [ ] Disparo de notificações de cobrança via WhatsApp (se aplicável/opt-in).

## Tech Stack
- **Backend:** Python + FastAPI + SQLAlchemy + MySQL
- **Frontend:** React + Vite + TypeScript + Material-UI (MUI)
- **Integrações:** API de Gateway (ex: Asaas), WhatsApp API (ex: Evolution API/Z-API).

## File Structure & Database Modeling

Abaixo está a proposta de modelagem de dados e estrutura de diretórios para aprovação inicial, conforme solicitado:

### Modelagem de Dados (SQLAlchemy - `backend/models/finance_models.py` / `backend/models/models.py`)

```python
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Boolean, Date
from sqlalchemy.orm import relationship
import enum
import datetime

class TipoTransacao(enum.Enum):
    RECEITA = "RECEITA"
    DESPESA = "DESPESA"

class StatusTransacao(enum.Enum):
    PENDENTE = "PENDENTE"
    PAGO = "PAGO"
    ATRASADO = "ATRASADO"
    CANCELADO = "CANCELADO"

class CategoriaFinanceira(Base):
    __tablename__ = "categorias_financeiras"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False) # Ex: Mensalidade, Água, Joias, etc.
    tipo = Column(Enum(TipoTransacao), nullable=False)
    ativa = Column(Boolean, default=True)

class OrcamentoAnual(Base):
    __tablename__ = "orcamentos_anuais"
    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias_financeiras.id"))
    ano = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    valor_previsto = Column(Float, nullable=False)
    
    categoria = relationship("CategoriaFinanceira")

class Transacao(Base):
    __tablename__ = "transacoes"
    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String(255), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias_financeiras.id"))
    membro_id = Column(Integer, ForeignKey("membros.id"), nullable=True) # Ligação com Obreiro (opcional para despesas)
    
    tipo = Column(Enum(TipoTransacao), nullable=False)
    status = Column(Enum(StatusTransacao), default=StatusTransacao.PENDENTE)
    
    data_vencimento = Column(Date, nullable=False)
    data_pagamento = Column(Date, nullable=True)
    data_competencia = Column(Date, nullable=False) # Para DRE
    
    valor_original = Column(Float, nullable=False)
    valor_juros = Column(Float, default=0.0)
    valor_multa = Column(Float, default=0.0)
    valor_desconto = Column(Float, default=0.0)
    valor_pago = Column(Float, nullable=True)
    
    # Integração Gateway
    gateway_id = Column(String(100), nullable=True) # ID da cobrança no Asaas/Iugu
    gateway_link = Column(String(255), nullable=True)
    gateway_linha_digitavel = Column(String(255), nullable=True)
    gateway_pix_payload = Column(Text, nullable=True)
    
    categoria = relationship("CategoriaFinanceira")
    membro = relationship("Membro")
```

### Folder Structure
**Backend (`backend_py/`):**
- `models/finance_models.py` (ou inclusão em `models.py`)
- `schemas/finance_schemas.py` (Pydantic models)
- `services/finance_service.py` (Lógica de CRUD, DRE, Fluxo de Caixa)
- `services/payment_gateway_service.py` (Integração Asaas/Iugu)
- `services/notification_service.py` (WhatsApp API)
- `controllers/finance_controller.py` (FastAPI Routers)
- `controllers/webhook_controller.py` (Callbacks do Gateway)

**Frontend (`frontend/src/`):**
- `pages/Financeiro/`
  - `DashboardFinanceiro.tsx` (Dashboard Administrativo Financeiro, separado do dashboard principal da Loja)
  - `LancamentosList.tsx`
  - `LancamentoForm.tsx` (Contas a pagar/receber)
  - `ConfiguracoesFinanceiras.tsx` (Categorias, Orçamentos)
- `pages/Obreiro/`
  - `MeuExtrato.tsx` (Portal do autoatendimento)
- `services/financeService.ts` (Chamadas Axios)

---

## Task Breakdown

| Task ID | Name | Agent | Skills | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|----------|--------------|-------------------------|
| 1 | Database & Models | `backend-specialist` | database-design | P0 | None | Models code -> Alembic migration -> Table created |
| 2 | CRUD Services | `backend-specialist` | api-patterns | P1 | 1 | Schema definitions -> FastAPI endpoints -> Returns JSON |
| 3 | Gateway Integration | `backend-specialist` | nodejs-best-practices | P1 | 2 | API keys -> Gateway wrapper -> Creates external charge |
| 4 | Webhook Receiver | `backend-specialist` | api-patterns | P1 | 3 | Webhook JSON -> Parsed Event -> Updates Transaction Status |
| 5 | Finance UI (Admin) | `frontend-specialist` | frontend-design | P2 | 2 | Backend API -> React Pages -> Display list & forms |
| 6 | Portal do Obreiro | `frontend-specialist` | frontend-design | P2 | 2 | Backend API -> Extrato Page -> Shows PIX/Boleto |

## ✅ PHASE X: VERIFICATION
- [ ] Lint & Type Check
- [ ] Security Scan (OWASP / Leak check)
- [ ] Testes de API (Webhooks Mockados)
- [ ] Validação de UX (Acessibilidade nas tabelas de lançamento)
