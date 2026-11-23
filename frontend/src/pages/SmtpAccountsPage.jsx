import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Server,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit,
  X,
  Shield,
  Zap,
  Code
} from 'lucide-react';

const PROVIDER_PRESETS = {
  hostinger: {
    host: 'smtp.hostinger.com',
    port: 465,
    securityMode: 'SSL/TLS'
  },
  google: {
    host: 'smtp.gmail.com',
    port: 587,
    securityMode: 'STARTTLS'
  }
};

export function SmtpAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Dynamic on-the-fly test form state
  const [dynamicTest, setDynamicTest] = useState({
    host: 'smtp.hostinger.com',
    port: 465,
    user: '',
    pass: '',
    secure: true
  });
  const [dynamicTesting, setDynamicTesting] = useState(false);
  const [dynamicResult, setDynamicResult] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    providerType: 'hostinger',
    host: 'smtp.hostinger.com',
    port: 465,
    username: '',
    password: '',
    securityMode: 'SSL/TLS',
    fromEmail: '',
    fromName: 'Veyron Gateway',
    dailyLimit: 500,
    monthlyLimit: 15000,
    rateLimitPerMinute: 30,
    isActive: true
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.getSmtpAccounts();
      setAccounts(res.accounts || []);
    } catch (err) {
      console.error('Error fetching SMTP accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleProviderSelect = (provider) => {
    const preset = PROVIDER_PRESETS[provider];
    if (preset) {
      setFormData(prev => ({
        ...prev,
        providerType: provider,
        host: preset.host,
        port: preset.port,
        securityMode: preset.securityMode
      }));
    } else {
      setFormData(prev => ({ ...prev, providerType: 'custom' }));
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      providerType: 'hostinger',
      host: 'smtp.hostinger.com',
      port: 465,
      username: '',
      password: '',
      securityMode: 'SSL/TLS',
      fromEmail: '',
      fromName: 'Veyron Gateway',
      dailyLimit: 500,
      monthlyLimit: 15000,
      rateLimitPerMinute: 30,
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingId(acc._id);
    setFormData({
      name: acc.name,
      providerType: acc.providerType,
      host: acc.host,
      port: acc.port,
      username: acc.username,
      password: '',
      securityMode: acc.securityMode,
      fromEmail: acc.fromEmail,
      fromName: acc.fromName,
      dailyLimit: acc.dailyLimit,
      monthlyLimit: acc.monthlyLimit,
      rateLimitPerMinute: acc.rateLimitPerMinute,
      isActive: acc.isActive
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateSmtpAccount(editingId, formData);
      } else {
        await api.createSmtpAccount(formData);
      }
      setModalOpen(false);
      fetchAccounts();
    } catch (err) {
      alert(`Error saving SMTP Account: ${err.message}`);
    }
  };

  const handleTestConnection = async (id, name) => {
    try {
      setTestingId(id);
      setTestResult(null);
      const res = await api.testSmtpConnection(id);
      setTestResult({
        id,
        success: res.success,
        message: res.message || res.error
      });
      fetchAccounts();
    } catch (err) {
      setTestResult({
        id,
        success: false,
        message: err.message
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleRunDynamicTest = async (e) => {
    e.preventDefault();
    try {
      setDynamicTesting(true);
      setDynamicResult(null);
      const res = await fetch('/api/v1/emails/verify-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vsg_token')}`
        },
        body: JSON.stringify({
          smtp: {
            host: dynamicTest.host,
            port: dynamicTest.port,
            secure: dynamicTest.secure,
            auth: {
              user: dynamicTest.user,
              pass: dynamicTest.pass
            }
          }
        })
      });
      const data = await res.json();
      setDynamicResult({
        success: data.success,
        message: data.message || data.error
      });
    } catch (err) {
      setDynamicResult({
        success: false,
        message: err.message
      });
    } finally {
      setDynamicTesting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete SMTP Account "${name}"?`)) return;
    try {
      await api.deleteSmtpAccount(id);
      fetchAccounts();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Relay Transports"
        title="SMTP Relays & Transporters"
        subtitle="Configure centralized outbound transports (Hostinger, Google Workspace, Custom MTAs) or test ephemeral dynamic credentials."
        action={
          <button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary-pressed text-on-primary px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Static Transport</span>
          </button>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Dynamic Agnostic SMTP Feature Section */}
        <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
                  <Zap className="w-4 h-4 text-brand-mark" />
                </span>
                <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
                  Dynamic On-The-Fly SMTP Mode (Environment-Agnostic)
                </h2>
              </div>
              <p className="text-[14px] text-ink/75 max-w-3xl leading-relaxed">
                Client applications do not need pre-registered accounts. Any caller can provide SMTP host, port, and authentication directly in the JSON request body (<code className="font-mono text-link">req.body.smtp</code>) or via HTTP headers (<code className="font-mono text-link">X-SMTP-Host</code>, <code className="font-mono text-link">X-SMTP-User</code>, <code className="font-mono text-link">X-SMTP-Pass</code>). Credentials are encrypted at rest with AES-256-GCM before queueing.
              </p>
            </div>

            <div className="text-[12px] font-mono text-ink bg-canvas-warm px-3.5 py-2 rounded-sm border border-hairline shrink-0">
              POST /api/v1/emails/send
            </div>
          </div>

          {/* Quick Dynamic Verifier */}
          <div className="pt-4 border-t border-hairline">
            <span className="text-[13px] font-semibold text-ink block mb-3">
              Verify Any SMTP Server Handshake (Without Registering):
            </span>
            <form onSubmit={handleRunDynamicTest} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-[14px]">
              <input
                type="text"
                required
                placeholder="Host (smtp.hostinger.com)"
                value={dynamicTest.host}
                onChange={(e) => setDynamicTest({ ...dynamicTest, host: e.target.value })}
                className="bg-canvas text-ink border border-field-border rounded-sm p-2.5 placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
              />
              <input
                type="number"
                required
                placeholder="Port (465/587)"
                value={dynamicTest.port}
                onChange={(e) => setDynamicTest({ ...dynamicTest, port: e.target.value })}
                className="bg-canvas text-ink border border-field-border rounded-sm p-2.5 placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
              />
              <input
                type="text"
                required
                placeholder="Username / Email"
                value={dynamicTest.user}
                onChange={(e) => setDynamicTest({ ...dynamicTest, user: e.target.value })}
                className="bg-canvas text-ink border border-field-border rounded-sm p-2.5 placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={dynamicTest.pass}
                onChange={(e) => setDynamicTest({ ...dynamicTest, pass: e.target.value })}
                className="bg-canvas text-ink border border-field-border rounded-sm p-2.5 placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
              />
              <button
                type="submit"
                disabled={dynamicTesting}
                className="bg-primary hover:bg-primary-pressed text-on-primary py-2.5 px-4 rounded-xs text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Play className={`w-3.5 h-3.5 ${dynamicTesting ? 'animate-spin' : ''}`} />
                <span>{dynamicTesting ? 'Testing...' : 'Verify Now'}</span>
              </button>
            </form>

            {dynamicResult && (
              <div
                className={`mt-3 p-3 rounded-sm text-[13px] font-mono border ${
                  dynamicResult.success
                    ? 'bg-canvas text-band-forest border-band-forest/30'
                    : 'bg-canvas text-error border-error/30'
                }`}
              >
                {dynamicResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Pre-configured Account Cards */}
        <div className="space-y-4">
          <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
            Pre-Configured Shared SMTP Relays
          </h2>

          {accounts.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-disabled-ink bg-canvas-soft rounded-sm border border-hairline">
              No pre-configured SMTP accounts registered. You can add one or pass credentials directly in API payloads.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {accounts.map((acc) => {
                const isTesting = testingId === acc._id;
                const currentTest = testResult?.id === acc._id ? testResult : null;

                return (
                  <div
                    key={acc._id}
                    className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 flex flex-col justify-between space-y-6"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-sans font-extrabold text-[18px] text-ink leading-tight">
                            {acc.name}
                          </h3>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-xs uppercase bg-canvas-warm text-ink border border-hairline">
                            {acc.providerType}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold uppercase border ${
                            acc.isActive && !acc.isPaused
                              ? 'bg-canvas-tint text-band-forest border-band-forest/30'
                              : 'bg-canvas-tint text-error border-error/30'
                          }`}
                        >
                          {acc.isPaused ? 'Auth Paused' : acc.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[13px] text-ink/75 mb-4 font-mono">
                        <div>Host: <span className="text-ink font-semibold">{acc.host}:{acc.port}</span> ({acc.securityMode})</div>
                        <div>User: <span className="text-ink">{acc.username}</span></div>
                        <div className="font-sans text-ink/80 text-[13px]">
                          Sender: <span className="text-ink font-medium">"{acc.fromName}" &lt;{acc.fromEmail}&gt;</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-canvas-warm rounded-sm border border-hairline space-y-1.5 text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-ink/70">Daily Limit:</span>
                          <span className="text-ink font-semibold font-mono">{acc.dailyLimit.toLocaleString()} emails</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink/70">Verification Status:</span>
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              acc.verificationStatus === 'verified' ? 'text-band-forest' : 'text-accent-gold'
                            }`}
                          >
                            {acc.verificationStatus === 'verified' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                            <span className="capitalize">{acc.verificationStatus}</span>
                          </span>
                        </div>
                      </div>

                      {currentTest && (
                        <div
                          className={`mt-3 p-3 rounded-sm text-[12px] font-mono border ${
                            currentTest.success
                              ? 'bg-canvas text-band-forest border-band-forest/30'
                              : 'bg-canvas text-error border-error/30'
                          }`}
                        >
                          {currentTest.message}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-hairline flex items-center justify-between">
                      <button
                        onClick={() => handleTestConnection(acc._id, acc.name)}
                        disabled={isTesting}
                        className="border border-hairline hover:border-ink text-ink text-[13px] font-medium px-3 py-1.5 rounded-xs transition-colors flex items-center gap-1.5"
                      >
                        <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                        <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="border border-hairline hover:border-ink p-1.5 rounded-xs text-ink transition-colors"
                          title="Edit transport"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc._id, acc.name)}
                          className="border border-hairline hover:border-error text-error p-1.5 rounded-xs transition-colors"
                          title="Delete transport"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal - ex-modal-card */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/50 backdrop-blur-none">
          <div className="bg-canvas border border-hairline rounded-md w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <h2 className="font-serif text-[22px] font-normal text-ink flex items-center gap-2">
                <Server className="w-4 h-4 text-ink" />
                {editingId ? 'Edit SMTP Transport' : 'Add SMTP Relay Account'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-ink/60 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-ink text-[13px] font-medium mb-1.5">Provider Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {['hostinger', 'google', 'custom'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderSelect(p)}
                      className={`py-2 px-3 rounded-xs border text-[13px] font-medium capitalize transition-colors ${
                        formData.providerType === p
                          ? 'bg-primary text-on-primary border-primary font-semibold'
                          : 'bg-canvas-warm border-hairline text-ink hover:bg-canvas-tint'
                      }`}
                    >
                      {p === 'google' ? 'Google / Gmail' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-ink text-[13px] font-medium mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hostinger Primary Relay"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-ink text-[13px] font-medium mb-1">SMTP Host *</label>
                  <input
                    type="text"
                    required
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus font-mono"
                  />
                </div>
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">Port *</label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value, 10) })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">SMTP Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">
                    {editingId ? 'Password (leave blank to keep)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">Security Mode</label>
                  <select
                    value={formData.securityMode}
                    onChange={(e) => setFormData({ ...formData, securityMode: e.target.value })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  >
                    <option value="SSL/TLS">SSL/TLS (Port 465)</option>
                    <option value="STARTTLS">STARTTLS (Port 587)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">From Sender Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="hello@yourdomain.com"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">Daily Cap</label>
                  <input
                    type="number"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value, 10) })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
              </div>

              <div className="p-3 bg-canvas-warm border border-hairline rounded-sm text-[12px] text-ink/80 flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-ink" />
                <span>
                  Credentials are encrypted at rest with AES-256-GCM. Passwords are never returned in dashboard responses or logged.
                </span>
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-hairline text-ink hover:bg-black/5 px-4 py-2 rounded-xs text-[14px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-pressed text-on-primary px-5 py-2 rounded-xs text-[14px] font-medium transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmtpAccountsPage;
