import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { VeyronLogo } from '../components/VeyronLogo.jsx';
import { Lock, Mail, User, Building, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useAuth();
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
    <div className="min-h-screen bg-canvas-warm flex flex-col justify-between py-12 px-4 selection:bg-accent-gold/40">
      <div className="w-full max-w-md mx-auto my-auto space-y-6">
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
                      className="w-full bg-canvas text-ink border border-field-border rounded-sm pl-10 pr-4 py-2.5 text-[14px] placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1.5">
                    Company / Application Project
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-disabled-ink absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Vexillar Technologies"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-canvas text-ink border border-field-border rounded-sm pl-10 pr-4 py-2.5 text-[14px] placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
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
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm pl-10 pr-4 py-2.5 text-[14px] placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
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
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm pl-10 pr-4 py-2.5 text-[14px] placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xs bg-error/10 border border-error/20 text-error text-[13px] flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-error" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xs bg-band-teal border border-band-forest/30 text-band-forest text-[13px] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-band-forest" />
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
    </div>
  );
}

export default LoginPage;
