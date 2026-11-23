import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { Masthead } from './components/Masthead.jsx';
import { ProductSubnav } from './components/ProductSubnav.jsx';
import { Footer } from './components/Footer.jsx';

import { OverviewPage } from './pages/OverviewPage.jsx';
import { UsersApprovalPage } from './pages/UsersApprovalPage.jsx';
import { UserPortalPage } from './pages/UserPortalPage.jsx';
import { LogsPage } from './pages/LogsPage.jsx';
import { QueuePage } from './pages/QueuePage.jsx';
import { ProjectsPage } from './pages/ProjectsPage.jsx';
import { SmtpAccountsPage } from './pages/SmtpAccountsPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { HealthPage } from './pages/HealthPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

export function App() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Default tab based on role
  const [activeTab, setActiveTab] = useState(isAdmin ? 'overview' : 'portal');

  useEffect(() => {
    if (!isAdmin && activeTab === 'overview') {
      setActiveTab('portal');
    }
  }, [user, isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-warm flex items-center justify-center text-ink font-mono text-[14px]">
        <div className="flex items-center gap-3 bg-canvas p-6 rounded-md border border-hairline">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Initializing Veyron Gateway Infrastructure...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-canvas-warm text-ink flex flex-col antialiased">
      {/* 85px Masthead */}
      <Masthead />

      {/* 64px Sticky Subnav */}
      <ProductSubnav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col w-full">
        {activeTab === 'overview' && <OverviewPage onNavigate={setActiveTab} />}
        {activeTab === 'approvals' && <UsersApprovalPage />}
        {activeTab === 'portal' && <UserPortalPage />}
        {activeTab === 'logs' && <LogsPage />}
        {activeTab === 'queue' && <QueuePage />}
        {activeTab === 'projects' && <ProjectsPage />}
        {activeTab === 'smtp' && <SmtpAccountsPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'health' && <HealthPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* 105px Footer */}
      <Footer />
    </div>
  );
}

export default App;
