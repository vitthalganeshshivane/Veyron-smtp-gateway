import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { VeyronLogo } from '../components/VeyronLogo.jsx';
import { ShowcasePage } from './ShowcasePage.jsx';
import { Lock, Mail, User, Building, AlertTriangle, CheckCircle2, Sparkles, LogIn } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useAuth();
  const [viewMode, setViewMode] = useState('auth'); // 'auth' | 'showcase'
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      if (isRegister) {
        await register({ name, email, password, company });
        setSuccessMsg('Account registered successfully. Your request for API access is submitted for administrator review.');
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-warm flex flex-col justify-between selection:bg-accent-gold/40">
      {/* Top Navigation Bar on Landing Page */}
      <header className="h-[75px] bg-canvas border-b border-hairline px-6 lg:px-12 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <VeyronLogo size="md" />
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-canvas-tint border border-hairline rounded-xs text-[11px] font-mono text-ink">
            <span className="w-1.5 h-1.5 rounded-full bg-band-forest inline-block animate-pulse"></span>
            <span>Oracle Cloud VM Node Active</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'showcase' ? 'auth' : 'showcase')}
            className={`px-3.5 py-1.5 rounded-xs text-[13px] font-medium transition-colors flex items-center gap-2 border ${
              viewMode === 'showcase'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-canvas text-ink border-hairline hover:border-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
            <span>{viewMode === 'showcase' ? 'Back to Portal Login' : 'Explore Product Showcase & Tour'}</span>
          </button>
          {viewMode === 'showcase' && (
            <button
              onClick={() => {
                setViewMode('auth');
                setIsRegister(true);
              }}
              className="bg-primary hover:bg-primary-pressed text-on-primary px-3.5 py-1.5 rounded-xs text-[13px] font-medium transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Request Access</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === 'showcase' ? (
        <ShowcasePage onNavigateToAuth={() => { setViewMode('auth'); setIsRegister(true); }} />
      ) : (
        <div className="w-full max-w-md mx-auto my-auto py-12 px-4 space-y-6">
          {/* Brand Wordmark & Monogram */}
          <div className="flex justify-center mb-6">
            <VeyronLogo size="lg" />
          </div>

          {/* Auth Form Card - ex-auth-form-card from DESIGN.md */}
          <div className="bg-canvas border border-hairline rounded-md p-8">
            {/* Header with Georgia serif headline & 40x4px gold rule */}
            <div className="mb-6">
              <h1 className="font-serif text-[28px] font-normal text-ink leading-tight">
                {isRegister ? 'Request Gateway Access' : 'Sign In to Gateway'}
              </h1>
              <div className="w-10 h-1 bg-accent-gold mt-2.5 mb-3"></div>
              <p className="text-[14px] text-ink/70">
                {isRegister
                  ? 'Create developer credentials. Upon approval, an API key is issued for outbound relays.'
                  : 'Enter your account credentials to access developer keys, queues, and deliverability logs.'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 bg-canvas-tint border border-hairline rounded-xs mb-6 text-[13px] font-medium">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
                className={`py-2 rounded-xs transition-colors ${
                  !isRegister
                    ? 'bg-canvas text-ink border border-hairline font-semibold'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
                className={`py-2 rounded-xs transition-colors ${
                  isRegister
                    ? 'bg-canvas text-ink border border-hairline font-semibold'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                Request Access
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-ink text-[13px] font-medium mb-1.5">
                      Full Name <span className="text-brand-mark">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-disabled-ink absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alexandra Stone"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-canvas border border-field-border rounded-xs pl-10 pr-3.5 py-2 text-[14px] text-ink placeholder-disabled-ink focus:border-ink outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-ink text-[13px] font-medium mb-1.5">
                      Company or Project <span className="text-disabled-ink font-normal text-[12px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-disabled-ink absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Acme Corp / SaaS Project"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-canvas border border-field-border rounded-xs pl-10 pr-3.5 py-2 text-[14px] text-ink placeholder-disabled-ink focus:border-ink outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-ink text-[13px] font-medium mb-1.5">
                  Email Address <span className="text-brand-mark">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-disabled-ink absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="user@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-canvas border border-field-border rounded-xs pl-10 pr-3.5 py-2 text-[14px] text-ink placeholder-disabled-ink focus:border-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink text-[13px] font-medium mb-1.5">
                  Password <span className="text-brand-mark">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-disabled-ink absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-canvas border border-field-border rounded-xs pl-10 pr-3.5 py-2 text-[14px] text-ink placeholder-disabled-ink focus:border-ink outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xs bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-[13px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xs bg-band-forest/10 border border-band-forest/20 flex items-start gap-2.5 text-band-forest text-[13px]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-pressed text-on-primary py-2.5 px-4 rounded-xs text-[14px] font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-canvas-soft disabled:text-disabled-ink disabled:border disabled:border-hairline"
              >
                {loading ? (
                  <span>Communicating with gateway...</span>
                ) : isRegister ? (
                  'Submit Access Application'
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            {!isRegister && (
              <div className="mt-6 p-4 rounded-xs bg-canvas-tint border border-hairline text-[12px] text-ink space-y-1">
                <span className="font-semibold block text-ink">Master Admin Credentials:</span>
                <div className="flex items-center justify-between">
                  <span className="text-ink/70">Account:</span>
                  <code className="font-mono text-link font-medium">admin@veyron.internal</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink/70">Password:</span>
                  <span className="font-mono text-ink/80">Defined via ADMIN_INITIAL_PASSWORD</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-[12px] text-disabled-ink">
            Veyron SMTP Gateway · Dedicated Low-Memory Relay · Port 3000
          </div>
        </div>
      )}

      {/* Persistent Baseline Footer */}
      <footer className="h-[50px] bg-canvas border-t border-hairline px-6 lg:px-12 flex items-center justify-between text-[12px] text-disabled-ink shrink-0">
        <div>Veyron SMTP Gateway © 2026. Enterprise High-Throughput Outbound Infrastructure.</div>
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('showcase')} className="hover:text-ink transition-colors">
            Product Tour
          </button>
          <span>·</span>
          <span>Dual-Track Relay Architecture</span>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
