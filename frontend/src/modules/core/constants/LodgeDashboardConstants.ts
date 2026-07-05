export const LODGE_DASHBOARD_CONSTANTS = {
  glassBgDark: 'rgba(21, 27, 38, 0.4)',
  glassBgLight: 'rgba(255, 255, 255, 0.6)',
  glassBorderDark: 'rgba(255, 255, 255, 0.08)',
  glassBorderLight: 'rgba(0, 0, 0, 0.08)',
};

export const getGlassStyles = (mode: 'light' | 'dark') => ({
  background: mode === 'dark' ? LODGE_DASHBOARD_CONSTANTS.glassBgDark : LODGE_DASHBOARD_CONSTANTS.glassBgLight,
  backdropFilter: 'blur(12px)',
  border: `1px solid ${mode === 'dark' ? LODGE_DASHBOARD_CONSTANTS.glassBorderDark : LODGE_DASHBOARD_CONSTANTS.glassBorderLight}`,
  boxShadow: mode === 'dark' ? '0 4px 24px 0 rgba(0, 0, 0, 0.2)' : '0 4px 24px 0 rgba(0, 0, 0, 0.05)',
  borderRadius: 3,
});

export const ACCENT_COLOR = '#A3B1C6'; // Silver/Slate tone replacing the vibrant gold

export const EVENT_COLORS: Record<string, string> = {
  'sessao': '#5B8FB9', // Azul Suave
  'evento': '#5B8FB9',
  'aniversario': '#81C784', // Verde Suave
  'aniversario_familiar': '#81C784',
  'casamento': '#81C784',
  'iniciacao': '#9B72AA', // Púrpura Suave
  'elevacao': '#9B72AA',
  'exaltacao': '#9B72AA',
  'instalacao': '#9B72AA',
};

export const normalizeEventType = (type: string): string => {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t.includes('sessao')) return 'Sessão';
  if (t.includes('evento')) return 'Evento';
  if (t.includes('aniversario_familiar')) return 'Aniversário Familiar';
  if (t.includes('aniversário') || t.includes('aniversario')) return 'Aniversário';
  if (t.includes('casamento')) return 'Aniversário de Casamento';
  if (t.includes('iniciacao') || t.includes('iniciação')) return 'Iniciação';
  if (t.includes('elevacao') || t.includes('elevação')) return 'Elevação';
  if (t.includes('exaltacao') || t.includes('exaltação')) return 'Exaltação';
  if (t.includes('instalacao') || t.includes('instalação')) return 'Instalação';
  
  // Fallback
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
};
