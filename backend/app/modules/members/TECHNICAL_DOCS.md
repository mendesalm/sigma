# Documentação Técnica e Operacional: Módulo Members

## Visão Geral
O módulo **Members** gerencia o cadastro dos usuários finais da plataforma Sigma (Maçons). Ele consolida informações pessoais, maçônicas, históricas e familiares em um perfil centralizado.

## Arquitetura
1. **Modelos (`models.py`)**:
   - `Member`: Entidade central. Possui dados como Nome, CPF, CIM e Data de Iniciação.
   - `MemberLodgeAssociation`: Tabela de ligação n:m entre Membros e Lojas.
   - `RoleHistory`: Histórico de cargos assumidos (ex: Secretário, Venerável Mestre).
2. **Rotas (`member_routes.py`)**:
   - CRUD padrão para Membros.
   - Restrições por ABAC/RBAC:
     - *SuperAdmins* podem ver e editar todos.
     - *Webmasters* podem ver e gerenciar apenas membros de suas Lojas/Obediências.
     - *Members* podem ver listas parciais, mas só podem editar o **próprio** perfil com restrições severas.
3. **Schemas e Validação (`member_schema.py`)**:
   - `MemberSelfUpdate`: Schema restritivo. Previne *Mass Assignment*, proibindo a auto-edição de campos gerenciais (ex: `degree`, `cim`, `status`) ou identidade irrefutável (ex: `cpf`, `full_name`).

## Regras de Negócio e Segurança
- **Proteção contra Mass Assignment**: Implementado rigorosamente em `/members/{id} (PUT)`. Membros logados só podem editar dados que passam pelo filtro de `MemberSelfUpdate`.
- **Auditoria de Ações**:
   - `CREATE_MEMBER`, `UPDATE_MEMBER` e `SELF_UPDATE_MEMBER` são registrados no `AuditLog`.
   - O `SELF_UPDATE_MEMBER` captura a lista exata de campos alterados pelo usuário no objeto de `details`.
- **Pesquisa por CIM**: Fluxo inicial no cadastro de novos membros (`check_cim`) para garantir que irmãos transferidos de Loja não criem contas duplicadas.

## Próximos Passos (Incremental)
- [ ] Integração com sistema de pagamentos de mensalidade/capitação no painel do membro.
- [ ] Exportação avançada de relatórios cadastrais em PDF.
