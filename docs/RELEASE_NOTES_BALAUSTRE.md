# Balaustre Refactoring - Release Notes (2025-12-19)

## Summary
Complete refactoring of the Balaustre document generation and editing flow to address data synchronization issues, editor redundancy, and state corruption.

## Key Changes

### Frontend
- **BalaustreEditor.tsx**:
    - Removed "Personalizar" button and sidebar (styling is now Webmaster-only).
    - Added "Resetar pelo Modelo" button (calls `/rebuild-balaustre`).
    - Fixed `handleRegenerateText` to exclude `text` and `custom_text` from payload, forcing a fresh server-side render.
- **BalaustreDocumentForm.tsx**:
    - Removed "Advanced Mode" (redundant RichText editor).
    - Simplified imports and dependencies.
    - Cleaned up JSX syntax errors.

### Backend
- **Session Routes (`session_routes.py`)**:
    - Added `POST /{session_id}/rebuild-balaustre`: Forces a hard reset of the document content using the latest DB data and Template.
    - Added `GET /{session_id}/debug-generation`: Returns internal log of the strategy execution for troubleshooting.
- **Balaustre Strategy (`balaustre_strategy.py`)**:
    - Implemented Linear Data Flow (DB -> Overrides -> Template).
    - Added Safety Fallback: Injects default template if Lodge configuration is missing/empty.
    - Improved HTML/Entity sanitization.

## How to Test
1. Open a Balaustre for a session.
2. If content is wrong/blank, click **"Resetar pelo Modelo"**.
3. open **"Dados do Balaústre"**, edit fields (e.g., Ordem do Dia).
4. Click **"Aplicar e Regenerar Texto"**.
5. Verify that the main editor updates with the new data formatted according to the template.
