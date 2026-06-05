import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

// Ícone SUPER DETALHADO - ViewBox 200x200, renderizado em 45x45px
export const MasonicHomeIconDetailed: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 200 200">
      {/* Pavimento Mosaico (base) - Padrão xadrez detalhado */}
      <g opacity="0.4">
        {/* Linha 1 */}
        <rect x="20" y="170" width="15" height="15" fill="currentColor" />
        <rect x="50" y="170" width="15" height="15" fill="currentColor" />
        <rect x="80" y="170" width="15" height="15" fill="currentColor" />
        <rect x="110" y="170" width="15" height="15" fill="currentColor" />
        <rect x="140" y="170" width="15" height="15" fill="currentColor" />
        <rect x="170" y="170" width="15" height="15" fill="currentColor" />
        {/* Linha 2 */}
        <rect x="35" y="185" width="15" height="15" fill="currentColor" />
        <rect x="65" y="185" width="15" height="15" fill="currentColor" />
        <rect x="95" y="185" width="15" height="15" fill="currentColor" />
        <rect x="125" y="185" width="15" height="15" fill="currentColor" />
        <rect x="155" y="185" width="15" height="15" fill="currentColor" />
      </g>
      
      {/* Coluna Esquerda (Jachin) - ULTRA DETALHADA */}
      <g>
        {/* Base da coluna (três níveis) */}
        <rect x="35" y="150" width="30" height="8" fill="currentColor" opacity="0.8" />
        <rect x="38" y="142" width="24" height="8" fill="currentColor" opacity="0.75" />
        <rect x="41" y="134" width="18" height="8" fill="currentColor" opacity="0.7" />
        
        {/* Fuste da coluna com caneluras (sulcos verticais) */}
        <rect x="44" y="55" width="12" height="79" fill="currentColor" opacity="0.95" />
        {/* Caneluras */}
        <line x1="46" y1="60" x2="46" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="50" y1="60" x2="50" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="54" y1="60" x2="54" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        
        {/* Capitel Coríntio detalhado */}
        <rect x="38" y="45" width="24" height="10" fill="currentColor" opacity="0.85" />
        <path d="M 35 45 L 35 35 L 40 32 L 50 30 L 60 32 L 65 35 L 65 45 Z" fill="currentColor" opacity="0.9" />
        {/* Folhas de acanto no capitel */}
        <ellipse cx="45" cy="37" rx="8" ry="3" fill="currentColor" opacity="0.6" />
        <ellipse cx="55" cy="37" rx="8" ry="3" fill="currentColor" opacity="0.6" />
        <rect x="42" y="40" width="16" height="2" fill="currentColor" opacity="0.7" />
        {/* Volutas */}
        <circle cx="40" cy="37" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="60" cy="37" r="3" fill="currentColor" opacity="0.5" />
      </g>
      
      {/* Coluna Direita (Boaz) - Simétrica e detalhada */}
      <g>
        {/* Base da coluna (três níveis) */}
        <rect x="135" y="150" width="30" height="8" fill="currentColor" opacity="0.8" />
        <rect x="138" y="142" width="24" height="8" fill="currentColor" opacity="0.75" />
        <rect x="141" y="134" width="18" height="8" fill="currentColor" opacity="0.7" />
        
        {/* Fuste da coluna com caneluras */}
        <rect x="144" y="55" width="12" height="79" fill="currentColor" opacity="0.95" />
        {/* Caneluras */}
        <line x1="146" y1="60" x2="146" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="150" y1="60" x2="150" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <line x1="154" y1="60" x2="154" y2="130" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        
        {/* Capitel Coríntio detalhado */}
        <rect x="138" y="45" width="24" height="10" fill="currentColor" opacity="0.85" />
        <path d="M 135 45 L 135 35 L 140 32 L 150 30 L 160 32 L 165 35 L 165 45 Z" fill="currentColor" opacity="0.9" />
        {/* Folhas de acanto */}
        <ellipse cx="145" cy="37" rx="8" ry="3" fill="currentColor" opacity="0.6" />
        <ellipse cx="155" cy="37" rx="8" ry="3" fill="currentColor" opacity="0.6" />
        <rect x="142" y="40" width="16" height="2" fill="currentColor" opacity="0.7" />
        {/* Volutas */}
        <circle cx="140" cy="37" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="160" cy="37" r="3" fill="currentColor" opacity="0.5" />
      </g>
      
      {/* Frontão/Entablamento superior DETALHADO */}
      <g opacity="0.85">
        {/* Arquitrave (3 faixas) */}
        <rect x="30" y="28" width="140" height="4" fill="currentColor" />
        <rect x="30" y="32" width="140" height="4" fill="currentColor" opacity="0.9" />
        <rect x="30" y="36" width="140" height="4" fill="currentColor" opacity="0.8" />
        
        {/* Friso com triglifos e métopes */}
        <rect x="25" y="22" width="150" height="6" fill="currentColor" opacity="0.9" />
        {/* Triglifos */}
        <rect x="40" y="23" width="8" height="4" fill="currentColor" opacity="0.6" />
        <rect x="85" y="23" width="8" height="4" fill="currentColor" opacity="0.6" />
        <rect x="108" y="23" width="8" height="4" fill="currentColor" opacity="0.6" />
        <rect x="152" y="23" width="8" height="4" fill="currentColor" opacity="0.6" />
        
        {/* Cornija */}
        <rect x="20" y="18" width="160" height="4" fill="currentColor" opacity="0.9" />
        
        {/* Frontão triangular detalhado */}
        <path d="M 15 18 L 100 5 L 185 18 L 180 20 L 100 8 L 20 20 Z" fill="currentColor" opacity="0.75" />
        
        {/* Tímpano (centro do frontão) com decoração */}
        <circle cx="100" cy="12" r="6" fill="currentColor" opacity="0.9" />
        <path d="M 100 7 L 103 10 L 106 12 L 103 14 L 100 17 L 97 14 L 94 12 L 97 10 Z" fill="currentColor" opacity="0.8" />
      </g>
      
      {/* Porta central dupla DETALHADA */}
      <g>
        <rect x="75" y="110" width="50" height="60" rx="3" fill="currentColor" opacity="0.6" />
        {/* Divisória da porta dupla */}
        <line x1="100" y1="110" x2="100" y2="170" stroke="currentColor" strokeWidth="2" opacity="0.7" />
        {/* Maçanetas */}
        <circle cx="92" cy="140" r="3" fill="currentColor" opacity="0.9" />
        <circle cx="108" cy="140" r="3" fill="currentColor" opacity="0.9" />
        {/* Painéis decorativos  */}
        <rect x="80" y="120" width="15" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <rect x="105" y="120" width="15" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <rect x="80" y="145" width="15" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <rect x="105" y="145" width="15" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </g>
      
      {/* Base/Degraus em múltiplas camadas */}
      <rect x="15" y="158" width="170" height="6" fill="currentColor" opacity="0.5" />
      <rect x="20" y="164" width="160" height="6" fill="currentColor" opacity="0.45" />
      <rect x="25" y="170" width="150" height="6" fill="currentColor" opacity="0.4" />
      <rect x="30" y="176" width="140" height="8" fill="currentColor" opacity="0.35" />
      
      {/* Sombras para profundidade 3D */}
      <line x1="65" y1="55" x2="65" y2="150" stroke="#000" strokeWidth="2" opacity="0.25" />
      <line x1="165" y1="55" x2="165" y2="150" stroke="#000" strokeWidth="2" opacity="0.25" />
      
      {/* Detalhes adicionais - molduras nas paredes */}
      <rect x="70" y="80" width="60" height="25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </SvgIcon>
  );
};

// Versão simplificada anterior (backup)
export const MasonicHomeIcon4: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M 2 11 L 12 3 L 22 11 L 20 11 L 12 5 L 4 11 Z" fill="currentColor" opacity="0.95" />
      <rect x="4" y="11" width="16" height="10" fill="currentColor" opacity="0.5" />
      <rect x="6" y="11" width="2.5" height="10" fill="currentColor" opacity="1.0" />
      <rect x="15.5" y="11" width="2.5" height="10" fill="currentColor" opacity="1.0" />
      <rect x="10" y="15" width="4" height="6" fill="currentColor" opacity="0.85" />
      <rect x="3" y="21" width="18" height="1.5" fill="currentColor" opacity="0.75" />
    </SvgIcon>
  );
};

// ATIVO: Versão ULTRA DETALHADA
export const MasonicHomeIcon = MasonicHomeIconDetailed;

export default MasonicHomeIcon;
