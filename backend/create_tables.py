from sqlalchemy import create_engine
from models.models import Base

# LEIA: Substitua pela sua string de conexão real
DATABASE_URL = "mysql+pymysql://Sistema:V3eH5oWu6cQUsJkmLqCrUjB7trWP6yGgK%4033@69.62.89.211:3306/sigma_db"

def create_tables():
    engine = create_engine(DATABASE_URL)
    print("Connecting to the database...")
    try:
        # Apenas para testar a conexão
        with engine.connect() as connection:
            print("Connection successful.")
            print("Creating all tables based on models...")
            Base.metadata.create_all(bind=engine)
            print("All tables created successfully!")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    create_tables()
