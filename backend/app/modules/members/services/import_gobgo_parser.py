import re
from typing import List, Optional, Dict, Any
from app.modules.members.schemas.import_schemas import ImportMemberRow

def sanitize_masked_data(value: str) -> Optional[str]:
    if not value: return None
    if "***" in value: return None
    return value.strip()

def parse_date(date_str: str) -> str:
    if not date_str: return ""
    parts = date_str.split("/")
    if len(parts) == 3: return f"{parts[2]}-{parts[1]}-{parts[0]}"
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
    if not val: return val
    val = val.strip()
    prev = ""
    while val != prev:
        prev = val
        val = re.sub(r'\s+(?:\d\.?|[A-Z]:|\d{1,2}(?:\s+\d{1,2})+)$', '', val)
    return val.strip()

def format_lodge_string(lodge: str) -> str:
    if not lodge: return lodge
    match = re.match(r'^(\d+)\s*[^\w\s]+\s*(.+)$', lodge)
    if match:
        numero = match.group(1).strip()
        nome = match.group(2).strip()
        return f"Loja {nome}, nº {numero}"
    return lodge

def extract_gob_go_data(text: str) -> Optional[ImportMemberRow]:
    if "FICHA CADASTRAL" not in text and "GRANDE ORIENTE" not in text:
        return None
        
    row = ImportMemberRow()
    warnings = []
    
    # BASIC FIELDS
    cim_match = re.search(r'CIM\s+(\d+)\s*\|', text)
    if cim_match: row.cim = cim_match.group(1).strip()
    
    name_match = re.search(r'Nome\s+(.*?)(?:\n|$)', text, re.IGNORECASE)
    if name_match: row.name = to_title_case(clean_garbage(name_match.group(1)))
        
    email_match = re.search(r'Email\s+([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', text, re.IGNORECASE)
    if email_match: row.email = email_match.group(1).strip()
        
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
            
    degree_match = re.search(r'CIM\s+\d+\s*\|\s*([^|]+)\s*\|', text)
    if degree_match:
        degree_str = degree_match.group(1).strip().lower()
        if 'aprendiz' in degree_str: row.degree = '1'
        elif 'companheiro' in degree_str: row.degree = '2'
        elif 'mestre' in degree_str: row.degree = '3'
            
    marital_match = re.search(r'Estado Civil\s+(.*?)(?:\n|$)', text)
    if marital_match: row.marital_status = marital_match.group(1).strip()
        
    father_match = re.search(r'Pai\s+(.*?)(?:\n|$)', text)
    if father_match: row.father_name = to_title_case(clean_garbage(father_match.group(1)))
        
    mother_match = re.search(r'M.e\s+(.*?)(?:\n|$)', text)
    if mother_match: row.mother_name = to_title_case(clean_garbage(mother_match.group(1)))
    
    # NEW PERSONAL FIELDS
    bd_match = re.search(r'Data Nascimento\s+([\d/]{10})', text)
    if bd_match: row.birth_date = parse_date(bd_match.group(1))
    
    pb_match = re.search(r'Naturalidade\s+(.*?)(?:\n|$)', text)
    if pb_match: row.place_of_birth = to_title_case(clean_garbage(pb_match.group(1)))
    
    prof_match = re.search(r'Profiss.o\s+(.*?)(?:\n|$)', text)
    if prof_match: row.occupation = to_title_case(clean_garbage(prof_match.group(1)))
    
    edu_match = re.search(r'Escolaridade\s+(.*?)(?:\n|$)', text)
    if edu_match: row.education_level = to_title_case(clean_garbage(edu_match.group(1)))
    
    phone_match = re.search(r'Celular\s+([\d\(\)\s\-]+)', text)
    if phone_match: row.phone = phone_match.group(1).strip()
    else:
        phone_alt = re.search(r'Telefone\s+([\d\(\)\s\-]+)', text)
        if phone_alt: row.phone = phone_alt.group(1).strip()
        
    cep_match = re.search(r'CEP\s+([\d\-]+)', text)
    if cep_match: row.zip_code = cep_match.group(1).strip()
    
    rua_match = re.search(r'Rua\s+(.*?)(?:\n|$)', text)
    if rua_match: row.street_address = clean_garbage(rua_match.group(1))
    
    bairro_match = re.search(r'Bairro\s+(.*?)(?:\n|$)', text)
    if bairro_match: row.neighborhood = to_title_case(clean_garbage(bairro_match.group(1)))
    
    cidade_match = re.search(r'Cidade\s+(.*?)(?:\n|$)', text)
    if cidade_match: row.city = to_title_case(clean_garbage(cidade_match.group(1)))

    # LODGE INFO
    mother_lodge_match = re.search(r'Loja M.e:\s*(.*?)(?:\n|$)', text)
    if mother_lodge_match: row.mother_lodge = format_lodge_string(to_title_case(clean_garbage(mother_lodge_match.group(1))))
    
    collect_lodge_match = re.search(r'Loja de Recolhimento:\s*(.*?)(?:\n|$)', text)
    if collect_lodge_match: row.collecting_lodge = format_lodge_string(to_title_case(clean_garbage(collect_lodge_match.group(1))))
        
    placet_match = re.search(r'Placete Inicia..o\s+(.*?)(?:\n|$)', text)
    if placet_match: row.initiation_certificate = placet_match.group(1).strip()
        
    # MASONIC HISTORY BLOCKS
    def extract_masonic_block(regex_name: str) -> Optional[Dict[str, Any]]:
        pattern = rf'{regex_name}.*?(?=\n\s*\n|\n[A-ZÀ-Ú ]+\s*\(Grau|\nFILIA.ES|\nDESLIGAMENTOS|\n[A-ZÀ-Ú ]+$|\Z)'
        block_match = re.search(pattern, text, flags=re.DOTALL | re.MULTILINE | re.IGNORECASE)
        if not block_match: return None
        block_text = block_match.group(0)
        data = {}
        ds_match = re.search(r'Data\s+S[\s\S]{0,15}?o\s+([\d/]{10})', block_text, re.IGNORECASE)
        if ds_match: data['session_date'] = parse_date(ds_match.group(1))
        de_match = re.search(r'Data\s+E[\s\S]{0,15}?a\s+([\d/]{10})', block_text, re.IGNORECASE)
        if de_match: data['entry_date'] = parse_date(de_match.group(1))
        proc_match = re.search(r'Processo\s+(.*?)(?=\n|Registro|Loja|Data|$)', block_text, re.IGNORECASE)
        if proc_match: data['process_number'] = clean_garbage(proc_match.group(1).strip())
        reg_match = re.search(r'Registro\s+(.*?)(?=\n|Loja|Data|Processo|$)', block_text, re.IGNORECASE)
        if reg_match: data['registry_number'] = clean_garbage(reg_match.group(1).strip())
        loja_match = re.search(r'Loja\s+(.*?)(?=\n|Data|Processo|Registro|CIM|$)', block_text, re.IGNORECASE)
        if loja_match: data['raw_lodge_name'] = to_title_case(clean_garbage(loja_match.group(1).strip()))
        return data

    def add_event(event_type_enum: str, regex: str):
        block = extract_masonic_block(regex)
        if not block: return
        mapped = {
            "event_type": event_type_enum,
            "session_date": block.get("session_date"),
            "entry_date": block.get("entry_date"),
            "process_number": block.get("process_number"),
            "registry_number": block.get("registry_number"),
            "raw_lodge_name": block.get("raw_lodge_name") 
        }
        if event_type_enum == "INITIATION" and row.initiation_certificate:
            mapped["placet_number"] = row.initiation_certificate
        row.masonic_history.append(mapped)

    add_event("INITIATION", r'Inicia..o \(Grau 1\)')
    add_event("ELEVATION", r'Eleva..o \(Grau 2\)')
    add_event("EXALTATION", r'Exalta..o \(Grau 3\)')
    add_event("INSTALLATION", r'Instala..o \(Grau')
    
    # ITERATIVE BLOCKS (AFFILIATIONS, DISMISSALS)
    def parse_list_events(header_regex: str, event_type: str):
        match = re.search(rf'{header_regex}(.*?)(?=\n[A-ZÀ-Ú ]+$|\n[A-ZÀ-Ú ]+\s*\(Grau|\Z)', text, flags=re.DOTALL | re.MULTILINE | re.IGNORECASE)
        if not match: return
        block = match.group(1).strip()
        chunks = re.split(r'\n(?=Loja)', block)
        for chunk in chunks:
            if not chunk.strip(): continue
            ev = {"event_type": event_type}
            lj = re.search(r'^Loja\s+(.*?)(?:\n|$)', chunk)
            if lj: ev["raw_lodge_name"] = format_lodge_string(to_title_case(clean_garbage(lj.group(1))))
            de = re.search(r'Data\s+E[\s\S]{0,15}?a\s+([\d/]{10})', chunk, re.IGNORECASE)
            if de: ev["entry_date"] = parse_date(de.group(1))
            pr = re.search(r'Processo\s+(.*?)(?:\n|$)', chunk, re.IGNORECASE)
            if pr: ev["process_number"] = clean_garbage(pr.group(1))
            rg = re.search(r'Registro\s+(.*?)(?:\n|$)', chunk, re.IGNORECASE)
            if rg: ev["registry_number"] = clean_garbage(rg.group(1))
            if ev.get("raw_lodge_name"): row.masonic_history.append(ev)

    parse_list_events(r'FILIA..ES\n', "AFFILIATION")
    parse_list_events(r'DESLIGAMENTOS\n', "DISMISSAL")

    # TITLES AND DIPLOMAS
    dip_match = re.search(r'T.TULOS E DIPLOMAS\n(.*?)(?=\n[A-ZÀ-Ú ]+$|\Z)', text, flags=re.DOTALL | re.MULTILINE | re.IGNORECASE)
    if dip_match:
        block = dip_match.group(1).strip()
        chunks = re.split(r'\n(?=T.tulo)', block, flags=re.IGNORECASE)
        for chunk in chunks:
            if not chunk.strip(): continue
            dec = {}
            ti = re.search(r'^T.tulo\s+(.*?)(?:\n|$)', chunk, re.IGNORECASE)
            if ti: dec["title"] = clean_garbage(ti.group(1))
            dt = re.search(r'Data\s+([\d/]{10})', chunk, re.IGNORECASE)
            if dt: dec["award_date"] = parse_date(dt.group(1))
            rm = re.search(r'Registro\s+(.*?)(?:\n|$)', chunk, re.IGNORECASE)
            if rm: dec["remarks"] = f"Registro: {clean_garbage(rm.group(1))}"
            if dec.get("title"): row.decorations.append(dec)

    # FAMILY MEMBERS
    fam_match = re.search(r'DADOS FAMILIARES\n(.*?)\Z', text, re.DOTALL | re.IGNORECASE)
    if fam_match:
        block = fam_match.group(1).strip()
        c_match = re.search(r'C.njuge\s+(.*?)(?:\n|$)', block, re.IGNORECASE)
        if c_match:
            c = {"relationship_type": "Esposa", "full_name": to_title_case(clean_garbage(c_match.group(1)))}
            cn = re.search(r'Nascimento\s+([\d/]{10})', block, re.IGNORECASE)
            if cn: c["birth_date"] = parse_date(cn.group(1))
            ct = re.search(r'Telefone\s+([\d\(\)\s\-]+)', block, re.IGNORECASE)
            if ct: c["phone"] = ct.group(1).strip()
            row.family_members.append(c)
        
        filhos_match = re.search(r'Filhos\n(.*)', block, re.DOTALL | re.IGNORECASE)
        if filhos_match:
            chunks = re.split(r'\n(?=Nome)', filhos_match.group(1).strip(), flags=re.IGNORECASE)
            for chunk in chunks:
                if not chunk.strip(): continue
                f = {"relationship_type": "Filho"}
                fn = re.search(r'^Nome\s+(.*?)(?:\n|$)', chunk, re.IGNORECASE)
                if fn: f["full_name"] = to_title_case(clean_garbage(fn.group(1)))
                fnasc = re.search(r'Nascimento\s+([\d/]{10})', chunk, re.IGNORECASE)
                if fnasc: f["birth_date"] = parse_date(fnasc.group(1))
                if f.get("full_name"): row.family_members.append(f)

    row.warnings = warnings
    return row
