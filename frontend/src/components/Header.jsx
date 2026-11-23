import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut, ShieldCheck, Radio } from 'lucide-react';

export function Header({ title, subtitle }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Gateway live status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Gateway Active
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-teal-400 font-mono uppercase">{user?.role || 'admin'}</div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
