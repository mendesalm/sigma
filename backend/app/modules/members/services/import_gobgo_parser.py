import re
from typing import List, Optional, Dict, Any
from app.modules.members.schemas.import_schemas import ImportMemberRow

def sanitize_masked_data(value: str) -> Optional[str]:
    if not value:
        return None
    if "***" in value:
        return None
    return value.strip()

def parse_date(date_str: str) -> str:
    # Converts DD/MM/YYYY to YYYY-MM-DD
    if not date_str:
        return ""
    parts = date_str.split("/")
    if len(parts) == 3:
        return f"{parts[2]}-{parts[1]}-{parts[0]}"
    return date_str.strip()

def to_title_case(text: str) -> str:
    if not text:
        return text
    exceptions = ["de", "da", "do", "das", "dos", "e"]
    words = re.split(r'(\s+)', text.lower())
    result = []
    for w in words:
        if w.strip() in exceptions:
            result.append(w)
        else:
            def cap_match(m):
                return m.group(1) + m.group(2).upper()
            w = re.sub(r'(^|[\(\)-])([a-z])', cap_match, w)
            result.append(w)
            
    res = "".join(result)
    res = res.replace("(N ", "(Nº ")
    return res

def clean_garbage(val: str) -> str:
    if not val:
        return val
    val = val.strip()
    prev = ""
    while val != prev:
        prev = val
        val = re.sub(r'\s+(?:\d\.?|[A-Z]:|\d{1,2}(?:\s+\d{1,2})+)$', '', val)
    return val.strip()

def format_lodge_string(lodge: str) -> str:
    if not lodge:
        return lodge
    # Examples: "4027 - Moderna Olavo Bilac", "2181  Joo Pedro Junqueira"
    match = re.match(r'^(\d+)\s*[^\w\s]+\s*(.+)$', lodge)
    if match:
        numero = match.group(1).strip()
        nome = match.group(2).strip()
        return f"Loja {nome}, nº {numero}"
    return lodge

def extract_gob_go_data(text: str) -> Optional[ImportMemberRow]:
    # Check if it is a GOB-GO form
    if "FICHA CADASTRAL" not in text and "GRANDE ORIENTE" not in text:
        return None
        
    row = ImportMemberRow()
    warnings = []
    
    # BASIC FIELDS
    cim_match = re.search(r'CIM\s+(\d+)\s*\|', text)
    if cim_match:
        row.cim = cim_match.group(1).strip()
    
    name_match = re.search(r'Nome\s+(.*?)(?:\s+\d|$)', text, re.IGNORECASE)
    if name_match:
        row.name = to_title_case(clean_garbage(name_match.group(1)))
        
    email_match = re.search(r'Email\s+([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', text, re.IGNORECASE)
    if email_match:
        row.email = email_match.group(1).strip()
        
    cpf_match = re.search(r'CPF\s+([\d\.\-\*]+)', text)
    if cpf_match:
        val = sanitize_masked_data(cpf_match.group(1))
        row.cpf = val
        if not val and "***" in cpf_match.group(1):
            warnings.append("CPF continha máscara (***) e não foi importado.")
            
    rg_match = re.search(r'RG\s+([\d\.\-\*a-zA-Z\s]+)', text)
    if rg_match:
        rg_raw = rg_match.group(1).split(' - ')[0].strip() if ' - ' in rg_match.group(1) else rg_match.group(1).strip()
        val = sanitize_masked_data(rg_raw)
        row.rg = val
        if not val and "***" in rg_raw:
            warnings.append("RG continha máscara (***) e não foi importado.")
            
    # Degree from the top line: CIM 333786 | Mestre | Status: Ativo
    degree_match = re.search(r'CIM\s+\d+\s*\|\s*([^|]+)\s*\|', text)
    if degree_match:
        degree_str = degree_match.group(1).strip().lower()
        if 'aprendiz' in degree_str:
            row.degree = '1'
        elif 'companheiro' in degree_str:
            row.degree = '2'
        elif 'mestre' in degree_str:
            row.degree = '3'
            
    marital_match = re.search(r'Estado Civil\s+(.*?)(?:\n|$)', text)
    if marital_match:
        row.marital_status = marital_match.group(1).strip()
        
    father_match = re.search(r'Pai\s+(.*?)(?:\n|$)', text)
    if father_match:
        row.father_name = to_title_case(clean_garbage(father_match.group(1)))
        
    mother_match = re.search(r'M.e\s+(.*?)(?:\n|$)', text)
    if mother_match:
        row.mother_name = to_title_case(clean_garbage(mother_match.group(1)))

    # Lodge info
    mother_lodge_match = re.search(r'Loja M.e:\s*(.*?)(?:\n|$)', text)
    if mother_lodge_match:
        row.mother_lodge = format_lodge_string(to_title_case(clean_garbage(mother_lodge_match.group(1))))
    
    collect_lodge_match = re.search(r'Loja de Recolhimento:\s*(.*?)(?:\n|$)', text)
    if collect_lodge_match:
        row.collecting_lodge = format_lodge_string(to_title_case(clean_garbage(collect_lodge_match.group(1))))
        
    placet_match = re.search(r'Placete Inicia..o\s+(.*?)(?:\n|$)', text)
    if placet_match:
        row.initiation_certificate = placet_match.group(1).strip()
        
    # JSON DATA BLOCK (Iniciação, Elevação, Exaltação, Instalação)
    def extract_masonic_block(block_name: str, regex_name: str) -> Optional[Dict[str, Any]]:
        # Regex to find the block and extract fields until the next empty line or known block
        pattern = rf'{regex_name}.*?(?=\n\s*\n|\n[A-Z][a-z]+ \(Grau|\nFILIA.ES|\nDESLIGAMENTOS|\Z)'
        block_match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if not block_match:
            return None
            
        block_text = block_match.group(0)
        data = {}
        
        ds_match = re.search(r'Data\s+S[\s\S]{0,15}?o\s+([\d/]{10})', block_text, re.IGNORECASE)
        if ds_match: data['data_sessao'] = parse_date(ds_match.group(1))
        
        de_match = re.search(r'Data\s+E[\s\S]{0,15}?a\s+([\d/]{10})', block_text, re.IGNORECASE)
        if de_match: data['data_entrada'] = parse_date(de_match.group(1))
        
        proc_match = re.search(r'Processo\s+(.*?)(?=\n|Registro|Loja|Data|$)', block_text, re.IGNORECASE)
        if proc_match: data['processo'] = clean_garbage(proc_match.group(1).strip())
        
        reg_match = re.search(r'Registro\s+(.*?)(?=\n|Loja|Data|Processo|$)', block_text, re.IGNORECASE)
        if reg_match: data['registro'] = clean_garbage(reg_match.group(1).strip())
        
        loja_match = re.search(r'Loja\s+(.*?)(?=\n|Data|Processo|Registro|CIM|$)', block_text, re.IGNORECASE)
        if loja_match: data['loja'] = to_title_case(clean_garbage(loja_match.group(1).strip()))
        
        if data:
            return data
        return None

    def add_event(event_type_enum: str, regex: str):
        block = extract_masonic_block(event_type_enum, regex)
        if not block: return
            
        # Map keys to match MasonicEventCreate
        mapped = {
            "event_type": event_type_enum,
            "session_date": block.get("data_sessao"),
            "entry_date": block.get("data_entrada"),
            "process_number": block.get("processo"),
            "registry_number": block.get("registro"),
            # Extract lodge as a raw string for now, we'll try to match it in import_service
            "raw_lodge_name": block.get("loja") 
        }
        if event_type_enum == "INITIATION" and row.initiation_certificate:
            mapped["placet_number"] = row.initiation_certificate
        row.masonic_history.append(mapped)

    add_event("INITIATION", r'Inicia..o \(Grau 1\)')
    add_event("ELEVATION", r'Eleva..o \(Grau 2\)')
    add_event("EXALTATION", r'Exalta..o \(Grau 3\)')
    add_event("INSTALLATION", r'Instala..o \(Grau')

    row.warnings = warnings
    return row
