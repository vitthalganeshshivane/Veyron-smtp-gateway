import React from 'react';
import {
  LayoutDashboard,
  Users,
  Mail,
  Layers,
  Briefcase,
  Server,
  BarChart3,
  Activity,
  Settings,
  SendHorizontal,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function Sidebar({ activeTab, onSelectTab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const adminNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'User Approvals', icon: Users },
    { id: 'logs', label: 'Email Logs', icon: Mail },
    { id: 'queue', label: 'Queue Monitor', icon: Layers },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'smtp', label: 'SMTP Accounts', icon: Server },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userNav = [
    { id: 'portal', label: 'My API Key & Code', icon: Key },
    { id: 'logs', label: 'My Email Logs', icon: Mail },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : userNav;

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-bold">
          <SendHorizontal className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            VEYRON <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">MTA</span>
          </h1>
          <p className="text-xs text-slate-400">{isAdmin ? 'Admin Console' : 'Developer Portal'}</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="flex items-center justify-between mb-1">
          <span>Role</span>
          <span className="text-teal-400 font-mono uppercase font-semibold">{user?.role || 'user'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Access</span>
          <span className={`font-mono font-semibold uppercase ${
            user?.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {user?.status || 'pending'}
          </span>
        </div>
      </div>
    </aside>
  );
}
