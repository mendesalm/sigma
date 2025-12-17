# Implementation Plan: Dynamic Document Builder

## Objective
Enable webmasters to create highly customized document templates (starting with Balaústre) by providing a user-friendly interface to inject dynamic backend variables (tokens) into a rich text editor.

## Proposed Architecture

### 1. Backend: Variable Discovery & Rendering
We need to expose the available data context to the frontend and ensure the generation service can render user-defined templates.

*   **Endpoint: `GET /api/documents/variables/{doc_type}`**
    *   Returns a structured JSON defining available variables (tokens) for the specified document type.
    *   Structure:
        ```json
        {
            "groups": [
                {
                    "id": "officers",
                    "label": "Oficiais",
                    "variables": [
                        { "key": "Veneravel", "label": "Venerável Mestre", "description": "Nome do Venerável Mestre atual" },
                        { "key": "Secretario", "label": "Secretário", "description": "Nome do Secretário atual" }
                        // ...
                    ]
                },
                {
                    "id": "session",
                    "label": "Sessão",
                    "variables": [
                        { "key": "DataSessao", "label": "Data da Sessão", "description": "Data formatada (ex: 20 de Outubro de 2023)" },
                        { "key": "HoraInicio", "label": "Hora de Início" }
                    ]
                }
            ]
        }
        ```

*   **Service Update: `DocumentGenerationService`**
    *   Enhance `generate_document` to fully support `custom_template_content`.
    *   Ensure the `context` dictionary passed to Jinja2 matches exactly the keys exposed in the variables endpoint.
    *   **Security:** Sanitize user input to prevent server-side template injection (SSTI) attacks, although Jinja2's autoescape helps. limiting access to specific safe attributes is crucial.

### 2. Frontend: The Builder Interface
Replace the static form fields with a dynamic builder.

*   **Component: `RichTextVariableEditor`**
    *   A wrapper around a Rich Text Editor (ReactQuill, TipTap, or Slate).
    *   **Custom Blots/Nodes:** Create a custom node type for "Variable" that renders as a non-editable pill/chip within the text (e.g., `[ Venerável Mestre ]`) but stores the token code (`{{ Veneravel }}`).

*   **Component: `VariablePalette`**
    *   A sidebar or floating panel listing the variable groups fetched from the backend.
    *   **Interaction:** drag-and-drop or click-to-insert into the active `RichTextVariableEditor`.

*   **Page Update: `BalaustreDocumentForm`**
    *   Integrate the `RichTextVariableEditor`.
    *   Load variables on mount using the new endpoint.
    *   Save the constructed HTML string (with tokens) to the `custom_text` (or a new `template_override`) field in `formData`.

## Phased Implementation Steps

## Phased Implementation Steps
 
 ### Phase 1: Backend Preparation [COMPLETED]
 1.  **Define Context Schema:** Formalize the dictionary of variables used in `BalaustreStrategy.collect_data`. [DONE]
 2.  **Create API Endpoint:** Implement `GET /api/documents/variables/balaustre` in `document_routes.py`. [DONE]
 3.  **Refine Rendering Strategy:** Ensure `BalaustreStrategy` can accept a raw template string from the request and render it with the context. [DONE - Implemented Two-Pass Rendering]
 
 ### Phase 2: Frontend Core Components [COMPLETED]
 4.  **Install Dependencies:** `react-quill`. [DONE]
 5.  **Build `VariablePalette`:** Create the UI component to display variables. [DONE]
 6.  **Enhance Editor:** Customize ReactQuillWrapper to support "Token" insertion. [DONE]
 
 ### Phase 3: Integration & Testing [COMPLETED]
 7.  **Integrate into `BalaustreDocumentForm`:** Added "Advanced Mode" switch to toggle between simple form and dynamic builder. [DONE]
 8.  **Preview Loop:** Verified frontend build and backend rendering logic. [DONE]
 9.  **Persist Defaults:** Currently saves to document draft. [Deferred to future feature request]

## Technical Considerations
*   **Template Engine:** We are using Jinja2 on the backend. The frontend tokens should map to Jinja2 syntax (e.g., `{{ variable_name }}`).
*   **Validation:** If a user deletes a brace `}` by accident, the backend render might fail. The frontend editor should convert tokens to atomic "objects" (immutable in the editor) to prevent syntax errors.
