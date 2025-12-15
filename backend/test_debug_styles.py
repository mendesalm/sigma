import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from services.document_generation_service import DocumentGenerationService
from database import SessionLocal
from schemas.document_settings_schema import DocumentStyles

async def main():
    db = SessionLocal()
    from models import models
    session = db.query(models.MasonicSession).first()
    if not session:
        print("No sessions found in DB!")
        return
    session_id = session.id
    print(f"Using Session ID: {session_id}")
    db.close()
    
    # Re-init db for service as it might open its own or expect one passed? 
    # Service init opens nothing, methods open their own sessions usually or accept db.
    # The construction `DocumentGenerationService(SessionLocal())` is weird because `SessionLocal()` returns a session, but usually the service might expect something else or nothing.
    # Looking at the code: `def get_document_generation_service(db: Session = Depends(get_db)): return DocumentGenerationService(db)`
    # So it expects a session.
    service = DocumentGenerationService(SessionLocal())
    
    # Create valid styles using Schema to ensure all defaults are populated
    styles_model = DocumentStyles(
        page_margin="1cm",
        show_page_numbers=True,
        content_config={"alignment": "justify"}
        # other fields get defaults
    )
    styles = styles_model.model_dump()

    # Real execution without mocks to test strategy logic
    print("Generating document with REAL data...")
    try:
        pdf = await service.generate_balaustre_preview(session_id, custom_content={"styles": styles, "text": "<p>Test Content</p>"})
        print(f"PDF Generated, size: {len(pdf)}")
        
        # Check if debug file exists
        expected_file = f"debug_document_balaustre_{session_id}.html"
        if os.path.exists(expected_file):
            print(f"Found debug file: {expected_file}")
            with open(expected_file, 'r', encoding='utf-8') as f:
                print(f"File content head:\n{f.read(500)}")
        else:
                print(f"Debug file NOT found: {expected_file}")
                print(f"Dir contents: {os.listdir('.')}")
        
        # Check comparison file
        comp_file = f"debug_styles_comparison_{session_id}.json"
        if os.path.exists(comp_file):
            print(f"Found Comparison file: {comp_file}")
        else:
            print(f"Comparison file NOT found: {comp_file}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
