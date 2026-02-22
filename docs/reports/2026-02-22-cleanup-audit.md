# Auditoria e Limpeza de Arquivos - 22/02/2026

## Resumo
Durante esta sessão, foi realizada uma triagem e limpeza completa na raiz do repositório para remover scripts de utilidade antigos, arquivos de log, resultados de testes, de depuração e de cache que estavam sobrecarregando o diretório principal.

## Arquivos Removidos
- **Scripts Temporários e de Auditoria:** `audit_family.py`, `check_lodge_ids.py`, `check_photo_upload.py`, `fix_duplicates.py`, `inspect_enums.py`, `test_photo_structure.py`, `test_schema_validations.py`, `read_legacy.py`.
- **Logs e Relatórios:** Múltiplos arquivos `import_log*.txt`, `audit_*.txt`, `git_*.txt` e saídas de dados temporários (`today_*.txt`, `temp_balaustre*.txt`).
- **Arquivos de Depuração e Cache:** Relatórios de front-end gerados localmente e documentos PDF/HTML residuais como `debug_document_balaustre_*.html`, `test_weasy.pdf`, `frontend_payload_capture.json`. Diretórios `.ruff_cache/` e `logs_archive/`.

## Motivação
A grande quantidade de arquivos auxiliares não rastreados que se acumulavam na raiz gerava atrito visual. A remoção limpa o espaço de trabalho deixando apenas o código e recursos essenciais.

A limpeza respeitou os arquivos de produção e configuração e segue as melhores práticas de organização de repositório.
