import React from 'react';

export function Footer() {
  return (
    <footer className="w-full bg-canvas border-t border-hairline py-8 px-6 lg:px-12 mt-auto">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-ink/75">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-brand-mark font-sans">VEYRON</span>
          <span>SMTP Gateway Infrastructure</span>
          <span className="text-disabled-ink">|</span>
          <span>Oracle Cloud VM Free Tier Profile (~1 GB RAM)</span>
        </div>

        <div className="flex items-center gap-6 text-[12px]">
          <span className="text-ink hover:text-link cursor-pointer transition-colors">Documentation</span>
          <span className="text-ink hover:text-link cursor-pointer transition-colors">API Reference</span>
          <span className="text-ink hover:text-link cursor-pointer transition-colors">BullMQ Diagnostics</span>
          <span className="text-disabled-ink">|</span>
          <span className="text-disabled-ink">Production Node v22 LTS</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
