import React from 'react';
import { Container } from './Container';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#6C3CAA]/20 bg-[#0F0F14]/80 py-8 mt-auto">
      <Container size="lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#646478]">
          <div className="flex items-center gap-2">
            <span>👻</span>
            <span>
              <strong className="text-[#F5F5FA]">HauntView</strong> • Local Web Testing Engine with
              16 Automated Profiles
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#DC6428]">Kiroween 2026 Hackathon</span>
            <span>•</span>
            <span>Playwright Powered</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
