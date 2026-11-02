import React from 'react';
import { Container } from './Container';

export const Footer: React.FC = () => {
  return (
    <footer
      className="w-full mt-auto"
      style={{ borderTop: '1px solid #46334b', background: 'rgba(16, 14, 19, 0.85)' }}
    >
      <Container size="lg">
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* left — wordmark + tagline */}
          <div className="flex items-center gap-3">
            {/* tiny ghost mark */}
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path
                d="M4 20 V10 Q4 4 11 4 Q18 4 18 10 V20 L15.5 17.5 L13 20 L11 17.5 L9 20 L6.5 17.5 Z"
                fill="#ff9d4d"
                fillOpacity="0.75"
              />
              <circle cx="8.5" cy="11" r="1.4" fill="#100e13" />
              <circle cx="13.5" cy="11" r="1.4" fill="#100e13" />
            </svg>
            <span className="text-xs" style={{ color: '#b9acbf' }}>
              <strong style={{ color: '#fff0dc' }}>HauntView</strong>
              &nbsp;·&nbsp;Local Web Testing Engine · 16 Automated Rites
            </span>
          </div>

          {/* right — event + stack */}
          <div className="flex items-center gap-3 text-xs" style={{ color: '#5a4a64' }}>
            <span style={{ color: '#ff791f' }}>Kiroween 2026</span>
            <span>·</span>
            <span>Playwright + axe-core</span>
            <span>·</span>
            <span>MIT License</span>
          </div>
        </div>
      </Container>

      {/* bottom bar — spirit board decorative arc */}
      <div className="w-full overflow-hidden" style={{ height: 28 }}>
        <svg
          viewBox="0 0 1200 28"
          preserveAspectRatio="none"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* subtle arc text band */}
          <defs>
            <path id="footArc" d="M 0 28 Q 600 -8 1200 28" />
          </defs>
          <text
            style={{ fontSize: 7, letterSpacing: '0.6em', fill: '#3a2545', fontFamily: 'serif' }}
          >
            <textPath href="#footArc" startOffset="50%" textAnchor="middle">
              ✦ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z ✦ 1 2 3 4 5 6 7 8 9 0 ✦
            </textPath>
          </text>
        </svg>
      </div>
    </footer>
  );
};
