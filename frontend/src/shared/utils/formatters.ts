export const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatPhone = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  
  // If it comes from backend as E.164 (e.g., 5511999999999), strip the 55
  if (v.length >= 12 && v.startsWith("55")) {
    v = v.substring(2);
  }
  
  if (v.length > 11) v = v.substring(0, 11); // Limit to 11 digits (DDD + 9 digits)
  
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); // Add DDD parenthesis
  v = v.replace(/(\d)(\d{4})$/, "$1-$2"); // Add hyphen
  return v;
};

export const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

export const formatState = (value: string) => {
  return value.toUpperCase().substring(0, 2);
};

export const formatDegree = (degree?: number | null, isInstalled?: boolean | null): string => {
  if (!degree) return "Desconhecido";
  if (degree === 1) return "Aprendiz";
  if (degree === 2) return "Companheiro";
  if (degree === 3) return isInstalled ? "Mestre Instalado" : "Mestre";
  return isInstalled ? `Grau ${degree} - Mestre Instalado` : `Grau ${degree}`;
};
