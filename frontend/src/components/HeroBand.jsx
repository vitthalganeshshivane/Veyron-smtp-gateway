import React from 'react';

export function HeroBand({ title, subtitle, badge, action }) {
  return (
    <section className="w-full bg-canvas-warm border-b border-hairline py-10 px-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {badge && (
            <div className="inline-block text-[11px] uppercase font-bold tracking-normal text-ink bg-canvas px-2.5 py-1 rounded-xs border border-hairline mb-3">
              {badge}
            </div>
          )}
          {/* Display Serif Headline in Georgia (as specified in DESIGN.md) */}
          <h1 className="font-serif text-[34px] sm:text-[40px] font-normal text-ink leading-tight">
            {title}
          </h1>

          {/* System's Only Ornament: 40 x 4px gold bar */}
          <div className="w-10 h-1 bg-accent-gold mt-3 mb-3"></div>

          {subtitle && (
            <p className="text-[16px] text-ink/80 max-w-2xl font-normal leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroBand;
