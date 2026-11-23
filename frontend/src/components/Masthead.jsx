import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { VeyronLogo } from './VeyronLogo.jsx';
import { LogOut, Server, ShieldCheck, User } from 'lucide-react';

export function Masthead() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <header className="h-[85px] bg-canvas border-b border-hairline px-6 lg:px-12 flex items-center justify-between shrink-0 sticky top-0 z-40">
      {/* Brand Wordmark & Glyph */}
      <div className="flex items-center gap-8">
        <VeyronLogo size="md" />
        
        {/* System node indicator */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-canvas-tint border border-hairline rounded-sm text-ink text-[12px]">
          <span className="w-2 h-2 rounded-full bg-band-forest inline-block"></span>
          <span className="font-medium">Oracle VM Free Tier Node</span>
          <span className="text-disabled-ink">|</span>
          <span className="font-mono text-[11px] text-ink">RAM ~1GB Opt</span>
        </div>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
            {isAdmin ? <ShieldCheck className="w-4 h-4 text-brand-mark" /> : <User className="w-4 h-4 text-ink" />}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-[14px] font-semibold text-ink leading-tight">
              {user?.name || user?.email?.split('@')[0] || 'Administrator'}
            </div>
            <div className="text-[11px] text-disabled-ink flex items-center gap-1.5 leading-tight">
              <span>{user?.email}</span>
              <span className="text-[10px] uppercase font-bold text-ink bg-canvas-warm px-1.5 py-0.2 rounded-xs border border-hairline">
                {user?.role || 'user'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Sign Out */}
        <button
          onClick={logout}
          className="border border-hairline hover:border-ink bg-canvas text-ink text-[14px] font-medium px-3.5 py-2 rounded-xs transition-colors flex items-center gap-2"
          title="Sign out of Gateway"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default Masthead;
