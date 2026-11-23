import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
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
  Key,
  Sparkles
} from 'lucide-react';

export function ProductSubnav({ activeTab, onSelectTab }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const adminNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'showcase', label: 'Product Tour & Guides', icon: Sparkles },
    { id: 'approvals', label: 'User Approvals', icon: Users },
    { id: 'logs', label: 'Email Logs', icon: Mail },
    { id: 'queue', label: 'Queue Engine', icon: Layers },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'smtp', label: 'SMTP Accounts', icon: Server },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userNav = [
    { id: 'portal', label: 'API Key & Integration', icon: Key },
    { id: 'showcase', label: 'Product Tour & Guides', icon: Sparkles },
    { id: 'logs', label: 'My Email Logs', icon: Mail },
    { id: 'settings', label: 'Account Profile', icon: Settings },
  ];

  const items = isAdmin ? adminNav : userNav;

  return (
    <nav className="h-[64px] bg-ink-deep text-on-primary px-6 lg:px-12 flex items-center overflow-x-auto select-none sticky top-[85px] z-30 border-b border-white/10">
      <div className="flex items-center space-x-1 sm:space-x-4 h-full min-w-max">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative h-full flex items-center gap-2 px-3 text-[14px] font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-accent-gold-soft' : 'text-white/50'}`} />
              <span>{item.label}</span>

              {/* Subnav Active Indicator from DESIGN.md: 5px height accent-gold-soft bar */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[5px] bg-accent-gold-soft rounded-none" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default ProductSubnav;
