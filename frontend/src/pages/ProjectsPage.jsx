import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Briefcase,
  Plus,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  X,
  AlertTriangle
} from 'lucide-react';

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [smtpAccounts, setSmtpAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyModal, setNewKeyModal] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dailyLimit: 1000,
    monthlyLimit: 30000,
    rateLimitPerMinute: 60,
    allowedSenders: '',
    allowedSmtpAccounts: []
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const [projRes, smtpRes] = await Promise.all([
        api.getProjects(),
        api.getSmtpAccounts()
      ]);
      setProjects(projRes.projects || []);
      setSmtpAccounts(smtpRes.accounts || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        allowedSenders: formData.allowedSenders ? formData.allowedSenders.split(',').map(s => s.trim()) : []
      };
      const res = await api.createProject(payload);
      setCreateModalOpen(false);
      setNewKeyModal({
        projectName: res.project.name,
        apiKey: res.apiKey
      });
      fetchProjects();
    } catch (err) {
      alert(`Error creating project: ${err.message}`);
    }
  };

  const handleRegenerate = async (id, name) => {
    if (!confirm(`Are you sure you want to regenerate the API key for "${name}"? The existing key will stop working immediately.`)) {
      return;
    }
    try {
      const res = await api.regenerateApiKey(id);
      setNewKeyModal({
        projectName: name,
        apiKey: res.apiKey
      });
      fetchProjects();
    } catch (err) {
      alert(`Error regenerating key: ${err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      fetchProjects();
    } catch (err) {
      alert(`Error deleting project: ${err.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Multi-Tenancy"
        title="Client Applications & Scoped Keys"
        subtitle="Manage authorized application tenants (Vexillar, TARS CRM, external APIs) with independent rate limits and quotas."
        action={
          <button
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                dailyLimit: 1000,
                monthlyLimit: 30000,
                rateLimitPerMinute: 60,
                allowedSenders: '',
                allowedSmtpAccounts: []
              });
              setCreateModalOpen(true);
            }}
            className="bg-primary hover:bg-primary-pressed text-on-primary px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Project</span>
          </button>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10">
        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((proj) => {
            const sentToday = proj.todayUsage?.sent || 0;
            const reservedToday = proj.todayUsage?.reserved || 0;
            const totalToday = sentToday + reservedToday;
            const dailyPercent = Math.min(100, Math.round((totalToday / proj.dailyLimit) * 100));

            return (
              <div
                key={proj._id}
                className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 flex flex-col justify-between space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-sans font-extrabold text-[18px] text-ink leading-tight">
                      {proj.name}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold uppercase border ${
                        proj.isActive
                          ? 'bg-canvas-tint text-band-forest border-band-forest/30'
                          : 'bg-canvas-tint text-error border-error/30'
                      }`}
                    >
                      {proj.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {proj.description && (
                    <p className="text-[14px] text-ink/70 mb-4">{proj.description}</p>
                  )}

                  {/* Key Prefix Tag */}
                  <div className="flex items-center gap-2 text-[12px] font-mono text-ink/80 bg-canvas-warm p-2.5 rounded-sm border border-hairline mb-5">
                    <Key className="w-3.5 h-3.5 text-ink shrink-0" />
                    <span className="truncate">{proj.keyPrefix}... (hashed at rest)</span>
                  </div>

                  {/* Daily Quota Progress Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-ink/70">Daily Limit Consumed</span>
                      <span className="font-semibold text-ink font-mono">
                        {totalToday} / {proj.dailyLimit} ({dailyPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-canvas-warm h-1.5 rounded-none overflow-hidden border border-hairline">
                      <div
                        className={`h-full transition-all duration-500 ${
                          dailyPercent > 90 ? 'bg-error' : dailyPercent > 70 ? 'bg-accent-gold' : 'bg-primary'
                        }`}
                        style={{ width: `${dailyPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Configuration specs */}
                  <div className="text-[13px] space-y-1.5 text-ink/70 pt-3 border-t border-hairline">
                    <div className="flex justify-between">
                      <span>Monthly Limit:</span>
                      <span className="text-ink font-medium font-mono">{proj.monthlyLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Throughput Cap:</span>
                      <span className="text-ink font-medium font-mono">{proj.rateLimitPerMinute} req / min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowed Senders:</span>
                      <span className="text-ink font-medium">
                        {proj.allowedSenders?.length ? proj.allowedSenders.join(', ') : 'Wildcard Any'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-hairline flex items-center justify-between">
                  <button
                    onClick={() => handleRegenerate(proj._id, proj.name)}
                    className="border border-hairline hover:border-ink text-ink text-[13px] font-medium px-3 py-1.5 rounded-xs transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regen Key</span>
                  </button>

                  <button
                    onClick={() => handleDelete(proj._id, proj.name)}
                    className="text-error hover:underline text-[13px] font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Project Modal - ex-modal-card */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/50 backdrop-blur-none">
          <div className="bg-canvas border border-hairline rounded-md w-full max-w-lg p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <h2 className="font-serif text-[22px] font-normal text-ink flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-ink" />
                Register Client Application
              </h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-ink/60 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-ink text-[13px] font-medium mb-1">
                  Project Name <span className="text-brand-mark">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vexillar Production, TARS CRM"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>

              <div>
                <label className="block text-ink text-[13px] font-medium mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief context about this application"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">Daily Cap</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: parseInt(e.target.value, 10) })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">Monthly Cap</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.monthlyLimit}
                    onChange={(e) => setFormData({ ...formData, monthlyLimit: parseInt(e.target.value, 10) })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink text-[13px] font-medium mb-1">Rate Limit (Req / Min)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.rateLimitPerMinute}
                  onChange={(e) => setFormData({ ...formData, rateLimitPerMinute: parseInt(e.target.value, 10) })}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>

              <div>
                <label className="block text-ink text-[13px] font-medium mb-1">Allowed Sender Addresses (Optional)</label>
                <input
                  type="text"
                  placeholder="hello@example.com, alerts@example.com (comma separated)"
                  value={formData.allowedSenders}
                  onChange={(e) => setFormData({ ...formData, allowedSenders: e.target.value })}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="border border-hairline text-ink hover:bg-black/5 px-4 py-2 rounded-xs text-[14px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-pressed text-on-primary px-5 py-2 rounded-xs text-[14px] font-medium transition-colors"
                >
                  Issue API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show Key Once Modal */}
      {newKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/50 backdrop-blur-none">
          <div className="bg-canvas border border-hairline rounded-md w-full max-w-lg p-8 space-y-6">
            <h2 className="font-serif text-[22px] font-normal text-ink">
              New Project API Key Generated
            </h2>

            <div className="p-3 bg-canvas-warm border border-accent-gold rounded-sm text-[13px] text-ink flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-ink mt-0.5" />
              <span>
                Copy this key immediately. For zero-trust security, only cryptographic hashes are stored. You will not be able to retrieve this secret again.
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[12px] text-ink/70">Project: <strong>{newKeyModal.projectName}</strong></span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={newKeyModal.apiKey}
                  className="w-full bg-canvas-tint border border-field-border rounded-sm p-3 font-mono text-[13px] text-ink select-all"
                />
                <button
                  onClick={() => copyToClipboard(newKeyModal.apiKey)}
                  className="bg-primary hover:bg-primary-pressed text-on-primary p-3 rounded-xs transition-colors shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-accent-gold" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline flex justify-end">
              <button
                onClick={() => setNewKeyModal(null)}
                className="bg-primary hover:bg-primary-pressed text-on-primary px-5 py-2 rounded-xs text-[14px] font-medium transition-colors"
              >
                I Have Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
