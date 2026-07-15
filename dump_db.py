import os
import json
import datetime
from sqlalchemy import create_engine, MetaData
from decimal import Decimal

DB_URL = "postgresql+psycopg2://Sistema:Vdfskln49DSFkod@69.62.89.211:5432/oriente_data"

def default_serializer(obj):
    if isinstance(obj, (datetime.datetime, datetime.date, datetime.time)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif hasattr(obj, '__class__') and obj.__class__.__name__ == 'UUID':
        return str(obj)
    elif isinstance(obj, bytes):
        return obj.hex()
    raise TypeError(f"Type {type(obj)} not serializable")

def dump_database(engine, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    dump_data = {}
    
    with engine.connect() as conn:
        for table_name in metadata.tables:
            print(f"Salvando dados da tabela: {table_name}")
            table = metadata.tables[table_name]
            result = conn.execute(table.select())
            
            rows = []
            for row in result:
                row_dict = dict(row._mapping)
                rows.append(row_dict)
                
            dump_data[table_name] = rows
            
            # Save individual table to JSON
            with open(os.path.join(output_dir, f"{table_name}.json"), 'w', encoding='utf-8') as f:
                json.dump(rows, f, ensure_ascii=False, indent=2, default=default_serializer)

    # Save full dump
    with open(os.path.join(output_dir, "full_dump.json"), 'w', encoding='utf-8') as f:
        json.dump(dump_data, f, ensure_ascii=False, indent=2, default=default_serializer)

    print(f"Dump concluído! Dados salvos na pasta: {output_dir}")

if __name__ == "__main__":
    engine = create_engine(DB_URL)
    output_folder = "BACKUP_ORIENTE_DATA_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    dump_database(engine, output_folder)
