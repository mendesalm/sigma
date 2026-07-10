import React from 'react';
import './SigmaAnimatedLogo.css';

export type SigmaTheme = 'prata' | 'ouro' | 'carbono' | 'cyber';

interface SigmaAnimatedLogoProps {
  theme?: SigmaTheme;
  width?: number | string;
  height?: number | string;
  showText?: boolean;
  animated?: boolean;
}

export const SigmaAnimatedLogo: React.FC<SigmaAnimatedLogoProps> = ({ 
  theme = 'prata', 
  width = 260, 
  height = 260,
  showText = true,
  animated = true
}) => {
  return (
    <div className="sigma-logo-wrapper" data-theme={theme === 'prata' ? undefined : theme}>
      <div className="sigma-logo-container">
        <div className={`sigma-logo-symbol ${animated ? 'sigma-logo-animated' : ''}`} style={{ width, height, marginBottom: showText ? '40px' : '0' }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="metalSigma" x1="10%" y1="0%" x2="90%" y2="100%">
                <stop className="light" offset="0%" />
                <stop className="light" offset="20%" stopOpacity="0.9" />
                <stop className="mid" offset="50%" />
                <stop className="dark" offset="80%" />
                <stop className="deep" offset="100%" />
              </linearGradient>

              <linearGradient id="arc1Grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop className="light" offset="0%" />
                <stop className="mid" offset="40%" />
                <stop className="dark" offset="100%" />
              </linearGradient>
              
              <linearGradient id="arc2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop className="light" offset="0%" />
                <stop className="mid" offset="40%" />
                <stop className="dark" offset="100%" />
              </linearGradient>

              <linearGradient id="arc3Grad" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop className="light" offset="0%" />
                <stop className="mid" offset="40%" />
                <stop className="dark" offset="100%" />
              </linearGradient>

              <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
                <stop className="light" offset="0%" />
                <stop className="mid" offset="30%" />
                <stop className="dark" offset="70%" />
                <stop className="deep" offset="100%" />
              </radialGradient>

              <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.85" />
              </filter>
              
              <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.9" />
              </filter>
            </defs>

            <g filter="url(#shadow)">
              <polygon points="50,14 84,73 16,73" fill="none" stroke="var(--m-light)" strokeWidth="0.5" opacity="0.2" />

              <path d="M 16 73 A 50 50 0 0 1 50 14" fill="none" stroke="url(#arc1Grad)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 16 73 A 200 200 0 0 0 50 14" fill="none" stroke="url(#arc1Grad)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>

              <path d="M 50 14 A 50 50 0 0 1 84 73" fill="none" stroke="url(#arc2Grad)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 50 14 A 200 200 0 0 0 84 73" fill="none" stroke="url(#arc2Grad)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>

              <path d="M 84 73 A 50 50 0 0 1 16 73" fill="none" stroke="url(#arc3Grad)" strokeWidth="3" strokeLinecap="round" />
              <path d="M 84 73 A 200 200 0 0 0 16 73" fill="none" stroke="url(#arc3Grad)" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            </g>

            <g filter="url(#innerShadow)">
              <path d="M 33 28 
                       L 67 28 
                       L 67 38 
                       L 45 38 
                       L 56 50 
                       L 45 62 
                       L 67 62 
                       L 67 72 
                       L 33 72 
                       L 52 50 
                       Z" 
                    fill="url(#metalSigma)" />
            </g>

            <g filter="url(#innerShadow)">
              <circle cx="50" cy="14" r="8.5" fill="none" stroke="var(--m-light)" strokeWidth="0.5" opacity="0.3" />
              <circle cx="84" cy="73" r="8.5" fill="none" stroke="var(--m-light)" strokeWidth="0.5" opacity="0.3" />
              <circle cx="16" cy="73" r="8.5" fill="none" stroke="var(--m-light)" strokeWidth="0.5" opacity="0.3" />
              
              <circle cx="50" cy="14" r="5.5" fill="url(#sphereGrad)" />
              <circle cx="84" cy="73" r="5.5" fill="url(#sphereGrad)" />
              <circle cx="16" cy="73" r="5.5" fill="url(#sphereGrad)" />
            </g>
          </svg>
        </div>
        
        {showText && (
          <>
            <div className="sigma-logo-text" style={{ fontSize: typeof width === 'number' ? width * 0.17 : '46px' }}>SIGMA</div>
            <div className="sigma-subtitle" style={{ fontSize: typeof width === 'number' ? width * 0.05 : '14px' }}>Gestão & Fraternidade</div>
          </>
        )}
      </div>
    </div>
  );
};

export default SigmaAnimatedLogo;
