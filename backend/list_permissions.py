from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Permission
from database import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

permissions = db.query(Permission).all()
print(f"{'ID':<5} {'Action':<40} {'Min Cred':<10} {'Description'}")
print("-" * 100)
for p in permissions:
    print(f"{p.id:<5} {p.action:<40} {p.min_credential:<10} {p.description or ''}")

db.close()
