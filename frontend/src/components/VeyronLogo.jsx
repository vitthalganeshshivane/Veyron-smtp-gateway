import React from 'react';

export function VeyronLogo({ size = 'md', inverted = false }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconDims = isSm ? 'w-6 h-6' : isLg ? 'w-10 h-10' : 'w-8 h-8';
  const textClass = isSm 
    ? 'text-lg' 
    : isLg 
    ? 'text-3xl' 
    : 'text-2xl';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Custom Geometric Veyron Relay Glyphs */}
      <svg
        className={`${iconDims} shrink-0`}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle geometric diamond backing */}
        <rect
          x="3"
          y="3"
          width="30"
          height="30"
          rx="4"
          fill={inverted ? '#ffffff' : '#312d2a'}
        />
        {/* Aerodynamic V-wing MTA relay contour */}
        <path
          d="M8 11 L18 26 L28 11"
          stroke="#c74634"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner fast-forward dispatch arrow */}
        <path
          d="M13 11 L18 19 L23 11"
          stroke="#f0cc71"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-extrabold tracking-normal ${textClass} text-brand-mark font-sans`}
          >
            VEYRON
          </span>
          <span
            className={`font-semibold text-[10px] tracking-normal uppercase px-1.5 py-0.5 rounded-xs ${
              inverted
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-canvas-tint text-ink border border-hairline'
            }`}
          >
            MTA
          </span>
        </div>
        <span
          className={`text-[10px] font-medium tracking-normal ${
            inverted ? 'text-white/70' : 'text-disabled-ink'
          }`}
        >
          SMTP Gateway Infrastructure
        </span>
      </div>
    </div>
  );
}

export default VeyronLogo;
