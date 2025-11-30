import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

// Ícone de Cartão de Cadastro/Perfil para "Meu Cadastro"
export const SquareCompassIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Cartão/Documento */}
      <rect x="3" y="5" width="18" height="14" rx="1.5" fill="currentColor" opacity="0.2" />
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.2" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
      
      {/* Foto/Avatar do membro */}
      <g>
        <circle cx="8" cy="11" r="2.5" fill="currentColor" opacity="0.6" />
        {/* Cabeça */}
        <circle cx="8" cy="10.5" r="1.2" fill="currentColor" opacity="0.8" />
        {/* Corpo/Ombros */}
        <path d="M 5.5 13 Q 8 14.5 10.5 13" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8" />
      </g>
      
      {/* Linhas de dados pessoais */}
      <g opacity="0.7">
        <line x1="12" y1="8" x2="19" y2="8" stroke="currentColor" strokeWidth="0.8" />
        <line x1="12" y1="10.5" x2="19" y2="10.5" stroke="currentColor" strokeWidth="0.8" />
        <line x1="12" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="0.8" />
      </g>
      
      {/* Esquadro e Compasso pequeno (símbolo maçônico) */}
      <g opacity="0.5" transform="translate(15, 13) scale(0.35)">
        {/* Compasso */}
        <path d="M 0 0 L -2 4 L 2 4 Z" fill="currentColor" />
        <line x1="-2" y1="4" x2="-4" y2="8" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <line x1="2" y1="4" x2="4" y2="8" stroke="currentColor" strokeWidth="0.8" fill="none" />
        {/* Esquadro */}
        <path d="M -5 3 L -5 9 L -3.5 9 L -3.5 4.5 L 1 4.5 L 1 3 Z" fill="currentColor" opacity="0.8" />
      </g>
      
      {/* Borda decorativa superior */}
      <rect x="3" y="5" width="18" height="1.5" rx="1.5" fill="currentColor" opacity="0.4" />
      
      {/* Estrela ou selo no canto */}
      <circle cx="5" cy="7" r="0.8" fill="currentColor" opacity="0.6" />
      <path d="M 5 6.3 L 5.2 6.7 L 5.7 6.7 L 5.3 7 L 5.5 7.5 L 5 7.2 L 4.5 7.5 L 4.7 7 L 4.3 6.7 L 4.8 6.7 Z" fill="currentColor" opacity="0.8" />
    </SvgIcon>
  );
};

// Ícone de Livro de Presença para "Minhas Presenças"
export const AttendanceBookIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Livro */}
      <rect x="5" y="4" width="14" height="16" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="6" y="5" width="12" height="14" rx="0.5" fill="currentColor" opacity="0.5" />
      
      {/* Páginas */}
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
      <line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
      <line x1="8" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.8" />
      
      {/* Checkmarks */}
      <path d="M 9 8 L 10 9 L 11.5 7.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M 9 11 L 10 12 L 11.5 10.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M 9 14 L 10 15 L 11.5 13.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
      
      {/* Marca de livro */}
      <rect x="11.5" y="4" width="1" height="4" fill="currentColor" opacity="0.6" />
    </SvgIcon>
  );
};

// Ícone de Entrada/Portal Maçônico para "Minhas Visitações"
export const VisitationIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Arco superior (entrada do templo) */}
      <path d="M 5 8 Q 5 4 12 4 Q 19 4 19 8" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M 5 8 Q 5 5 12 5 Q 19 5 19 8" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5" />
      
      {/* Colunas laterais */}
      <g>
        {/* Coluna esquerda */}
        <rect x="5" y="8" width="2" height="10" fill="currentColor" opacity="0.8" />
        <rect x="4.5" y="7" width="3" height="1" fill="currentColor" opacity="0.7" />
        <rect x="4.5" y="18" width="3" height="1" fill="currentColor" opacity="0.7" />
        
        {/* Coluna direita */}
        <rect x="17" y="8" width="2" height="10" fill="currentColor" opacity="0.8" />
        <rect x="16.5" y="7" width="3" height="1" fill="currentColor" opacity="0.7" />
        <rect x="16.5" y="18" width="3" height="1" fill="currentColor" opacity="0.7" />
      </g>
      
      {/* Porta/Entrada */}
      <rect x="9" y="12" width="6" height="7" rx="0.5" fill="currentColor" opacity="0.4" />
      <line x1="12" y1="12" x2="12" y2="19" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <circle cx="11" cy="15.5" r="0.5" fill="currentColor" opacity="0.7" />
      
      {/* Símbolo de movimento/entrada (pegadas ou setas) */}
      <g opacity="0.6">
        {/* Seta dupla indicand entrada */}
        <path d="M 12 6 L 14 7.5 L 13 7.5 L 13 9 L 11 9 L 11 7.5 L 10 7.5 Z" fill="currentColor" />
        
        {/* Pegadas pequenas */}
        <ellipse cx="10" cy="20" rx="0.8" ry="0.5" fill="currentColor" opacity="0.5" />
        <ellipse cx="11.5" cy="20.8" rx="0.8" ry="0.5" fill="currentColor" opacity="0.5" />
        <ellipse cx="13" cy="21" rx="0.8" ry="0.5" fill="currentColor" opacity="0.5" />
      </g>
      
      {/* Base/Degraus */}
      <rect x="4" y="19" width="16" height="0.8" fill="currentColor" opacity="0.3" />
      <rect x="5" y="19.8" width="14" height="0.8" fill="currentColor" opacity="0.25" />
      <rect x="6" y="20.6" width="12" height="0.8" fill="currentColor" opacity="0.2" />
      
      {/* Estrela ou símbolo decorativo no topo */}
      <circle cx="12" cy="4.5" r="0.8" fill="currentColor" opacity="0.7" />
      <path d="M 12 3.8 L 12.3 4.4 L 13 4.5 L 12.5 5 L 12.6 5.7 L 12 5.3 L 11.4 5.7 L 11.5 5 L 11 4.5 L 11.7 4.4 Z" fill="currentColor" opacity="0.8" />
    </SvgIcon>
  );
};

// Ícone de Pergaminho para "Minhas Publicações"
export const ScrollIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Pergaminho */}
      <path d="M 6 4 Q 5 4 5 5 L 5 19 Q 5 20 6 20 L 18 20 Q 19 20 19 19 L 19 5 Q 19 4 18 4 Z" 
        fill="currentColor" opacity="0.3" />
      
      {/* Enrolamento superior */}
      <ellipse cx="12" cy="4" rx="6" ry="1.5" fill="currentColor" opacity="0.5" />
      
      {/* Enrolamento inferior */}
      <ellipse cx="12" cy="20" rx="6" ry="1.5" fill="currentColor" opacity="0.5" />
      
      {/* Texto no pergaminho */}
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      <line x1="8" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="0.6" opacity="0.7" />
      
      {/* Selo/Carimbo */}
      <circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.6" />
    </SvgIcon>
  );
};

// Ícone de Sino para "Meus Anúncios"
export const BellIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Sino */}
      <path d="M 12 4 L 8 8 L 8 14 Q 8 16 10 17 L 14 17 Q 16 16 16 14 L 16 8 Z" 
        fill="currentColor" opacity="0.6" />
      
      {/* Topo do sino */}
      <rect x="11" y="2" width="2" height="2" fill="currentColor" />
      <circle cx="12" cy="2" r="1" fill="currentColor" opacity="0.8" />
      
      {/* Base do sino */}
      <path d="M 8 17 Q 12 19 16 17" stroke="currentColor" strokeWidth="1.5" fill="none" />
      
      {/* Badalo */}
      <circle cx="12" cy="17" r="1.5" fill="currentColor" opacity="0.7" />
      
      {/* Ondas sonoras */}
      <path d="M 18 10 Q 20 12 18 14" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 6 10 Q 4 12 6 14" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 19 8 Q 22 12 19 16" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
      <path d="M 5 8 Q 2 12 5 16" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
    </SvgIcon>
  );
};

// Ícone de Livros para "Meus Empréstimos"
export const BooksIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Livro 1 (inclinado à esquerda) */}
      <path d="M 4 18 L 6 6 L 10 7 L 8 19 Z" fill="currentColor" opacity="0.5" />
      <line x1="5" y1="12" x2="9" y2="13" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      
      {/* Livro 2 (reto no meio) */}
      <rect x="9" y="8" width="4" height="11" fill="currentColor" opacity="0.6" />
      <line x1="9" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      
      {/* Livro 3 (inclinado à direita) */}
      <path d="M 13 7 L 17 8 L 19 19 L 15 18 Z" fill="currentColor" opacity="0.5" />
      <line x1="14" y1="12.5" x2="18" y2="13.5" stroke="currentColor" strokeWidth="0.5" opacity="0.8" />
      
      {/* Prateleira */}
      <rect x="2" y="19" width="20" height="1.5" fill="currentColor" opacity="0.4" />
      
      {/* Marcador de empréstimo */}
      <circle cx="19" cy="6" r="2.5" fill="currentColor" opacity="0.7" />
      <path d="M 17.5 6 L 18.5 7 L 20.5 4.5" stroke="#fff" strokeWidth="0.8" fill="none" />
    </SvgIcon>
  );
};

// Ícone de Pena e Livro para "Cadastro" (Secretário/Chanceler)
export const QuillBookIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Livro */}
      <rect x="4" y="8" width="12" height="12" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="5" y="9" width="10" height="10" fill="currentColor" opacity="0.3" />
      
      {/* Linhas do livro */}
      <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <line x1="7" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <line x1="7" y1="16" x2="11" y2="16" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      
      {/* Pena */}
      <path d="M 14 4 Q 16 5 17 8 L 15 14 L 13 13 L 14 8 Q 13 6 14 4 Z" 
        fill="currentColor" opacity="0.7" />
      
      {/* Tinteiro */}
      <circle cx="18" cy="16" r="2.5" fill="currentColor" opacity="0.5" />
      <ellipse cx="18" cy="15" rx="2" ry="0.8" fill="currentColor" opacity="0.7" />
    </SvgIcon>
  );
};

// Ícone de Lista com Checks para "Presenças" (Secretário/Chanceler)
export const ChecklistIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Prancheta */}
      <rect x="6" y="3" width="12" height="18" rx="1" fill="currentColor" opacity="0.3" />
      
      {/* Clipe */}
      <rect x="10" y="2" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
      
      {/* Itens da lista com checks */}
      <circle cx="9" cy="8" r="1" fill="currentColor" opacity="0.5" />
      <path d="M 8.5 8 L 9 8.5 L 9.5 7.5" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <line x1="11" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="0.8" />
      
      <circle cx="9" cy="12" r="1" fill="currentColor" opacity="0.5" />
      <path d="M 8.5 12 L 9 12.5 L 9.5 11.5" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <line x1="11" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="0.8" />
      
      <circle cx="9" cy="16" r="1" fill="currentColor" opacity="0.5" />
      <path d="M 8.5 16 L 9 16.5 L 9.5 15.5" stroke="currentColor" strokeWidth="0.5" fill="none" />
      <line x1="11" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="0.8" />
    </SvgIcon>
  );
};

// Ícone de Colunas do Templo para "Sessões"
export const TempleColumnsIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {/* Frontão */}
      <path d="M 2 8 L 12 3 L 22 8 L 21 9 L 12 4.5 L 3 9 Z" fill="currentColor" opacity="0.6" />
      
      {/* Coluna 1 */}
      <rect x="5" y="9" width="2" height="10" fill="currentColor" />
      <rect x="4" y="8" width="4" height="1" fill="currentColor" opacity="0.7" />
      <rect x="4" y="19" width="4" height="1" fill="currentColor" opacity="0.7" />
      
      {/* Coluna 2 */}
      <rect x="11" y="9" width="2" height="10" fill="currentColor" />
      <rect x="10" y="8" width="4" height="1" fill="currentColor" opacity="0.7" />
      <rect x="10" y="19" width="4" height="1" fill="currentColor" opacity="0.7" />
      
      {/* Coluna 3 */}
      <rect x="17" y="9" width="2" height="10" fill="currentColor" />
      <rect x="16" y="8" width="4" height="1" fill="currentColor" opacity="0.7" />
      <rect x="16" y="19" width="4" height="1" fill="currentColor" opacity="0.7" />
      
      {/* Base */}
      <rect x="2" y="20" width="20" height="1.5" fill="currentColor" opacity="0.5" />
    </SvgIcon>
  );
};

export default {
  SquareCompassIcon,
  AttendanceBookIcon,
  VisitationIcon,
  ScrollIcon,
  BellIcon,
  BooksIcon,
  QuillBookIcon,
  ChecklistIcon,
  TempleColumnsIcon
};
