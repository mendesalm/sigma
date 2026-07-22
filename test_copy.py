import re

def clean_garbage(val: str) -> str:
    if not val:
        return val
    val = val.strip()
    prev = ""
    while val != prev:
        prev = val
        val = re.sub(r'\s+(?:\d\.?|[A-Z]:|\d{1,2}(?:\s+\d{1,2})+)$', '', val)
    return val.strip()

def test_extract(block_text: str):
    data = {}
    
    # We use [\s\S]{0,15}? to allow broken words caused by pdfplumber over watermarks.
    ds_match = re.search(r'Data\s+S[\s\S]{0,15}?o\s+([\d/]{10})', block_text, re.IGNORECASE)
    if ds_match:
        data['data_sessao'] = ds_match.group(1)
        
    de_match = re.search(r'Data\s+E[\s\S]{0,15}?a\s+([\d/]{10})', block_text, re.IGNORECASE)
    if de_match:
        data['data_entrada'] = de_match.group(1)
        
    proc_match = re.search(r'Processo\s+(.*?)(?=\n|Registro|Loja|Data|$)', block_text, re.IGNORECASE)
    if proc_match:
        data['processo'] = clean_garbage(proc_match.group(1).strip())
        
    reg_match = re.search(r'Registro\s+(.*?)(?=\n|Loja|Data|Processo|$)', block_text, re.IGNORECASE)
    if reg_match:
        data['registro'] = clean_garbage(reg_match.group(1).strip())
        
    loja_match = re.search(r'Loja\s+(.*?)(?=\n|Data|Processo|Registro|CIM|$)', block_text, re.IGNORECASE)
    if loja_match:
        data['loja'] = clean_garbage(loja_match.group(1).strip())
        
    return data

raw_exaltacao = """0 7/ Exaltao (Grau 3) 0 7/
2/ 2/
5)
|
2 Data S
5
esso 26/09/2024
5)
|
2
5
7 7
2 8 7 Data Entrada 03/10/2024 2 8 7
7 7
2 2
M: Processo GSGO - 17860 M:
CI 8 CI8
28 7 5
(
Registro 163974 28 7 5
(
2 2
7 7
7M
2 Loja MODERNA OLAVO BILAC (N 4027)"""

print(test_extract(raw_exaltacao))
