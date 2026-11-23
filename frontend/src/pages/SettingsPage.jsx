import React, { useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Settings,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);
      await api.changePassword(currentPassword, newPassword);
      setStatusMessage({ type: 'success', text: 'Password successfully updated' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Security Configuration"
        title="Gateway Security & Runtime Specs"
        subtitle="Manage master credentials, administrative profile security, and examine cryptographic runtime parameters."
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Profile & Password Form */}
        <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6 max-w-3xl">
          <div className="flex items-center gap-3.5 pb-4 border-b border-hairline">
            <div className="w-9 h-9 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
              <Lock className="w-4 h-4 text-ink" />
            </div>
            <div>
              <h2 className="font-sans font-extrabold text-[18px] text-ink leading-tight">
                Account Security Credentials
              </h2>
              <p className="text-[13px] text-ink/70">
                Authenticated as <span className="text-ink font-semibold font-mono">{user?.email}</span> ({user?.role || 'user'})
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-ink text-[13px] font-medium mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>

            <div>
              <label className="block text-ink text-[13px] font-medium mb-1">New Password (min 8 chars) *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>

            <div>
              <label className="block text-ink text-[13px] font-medium mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xs flex items-center gap-2.5 text-[13px] ${
                  statusMessage.type === 'success'
                    ? 'bg-canvas text-band-forest border border-band-forest/30'
                    : 'bg-canvas text-error border border-error/30'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-band-forest shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-pressed text-on-primary py-2.5 px-5 rounded-xs text-[14px] font-medium transition-colors"
            >
              {loading ? 'Updating Credentials...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* Runtime System Specifications */}
        <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6 max-w-3xl">
          <h2 className="font-sans font-extrabold text-[18px] text-ink leading-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ink" />
            Gateway Security Architecture
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
            <div className="p-4 bg-canvas-warm rounded-sm border border-hairline">
              <span className="text-disabled-ink font-semibold uppercase text-[11px] block mb-1">
                Credential Encryption at Rest
              </span>
              <span className="text-ink font-mono font-semibold">AES-256-GCM Authenticated Tag</span>
            </div>

            <div className="p-4 bg-canvas-warm rounded-sm border border-hairline">
              <span className="text-disabled-ink font-semibold uppercase text-[11px] block mb-1">
                Worker Concurrency Policy
              </span>
              <span className="text-ink font-mono font-semibold">5 Concurrent Streams per Process</span>
            </div>

            <div className="p-4 bg-canvas-warm rounded-sm border border-hairline">
              <span className="text-disabled-ink font-semibold uppercase text-[11px] block mb-1">
                Redis Eviction Defense
              </span>
              <span className="text-ink font-mono font-semibold">noeviction (Zero Data Loss)</span>
            </div>

            <div className="p-4 bg-canvas-warm rounded-sm border border-hairline">
              <span className="text-disabled-ink font-semibold uppercase text-[11px] block mb-1">
                SSRF Boundary Filter
              </span>
              <span className="text-ink font-mono font-semibold">DNS Rebind & Private Subnet Guard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
