import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  RefreshCw,
  Search,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

export function UsersApprovalPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [limits, setLimits] = useState({
    dailyLimit: 1000,
    monthlyLimit: 30000,
    rateLimitPerMinute: 60
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.getUsers(params);
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleOpenApprove = (u) => {
    setSelectedUser(u);
    setLimits({
      dailyLimit: u.dailyLimit || 1000,
      monthlyLimit: u.monthlyLimit || 30000,
      rateLimitPerMinute: u.rateLimitPerMinute || 60
    });
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    try {
      await api.approveUser(selectedUser.id, limits);
      setApproveModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleReject = async (id, email) => {
    if (!confirm(`Reject API access for ${email}?`)) return;
    try {
      await api.rejectUser(id);
      fetchUsers();
    } catch (err) {
      alert(`Reject error: ${err.message}`);
    }
  };

  const handleRevoke = async (id, email) => {
    if (!confirm(`Revoke API Key and suspend access for ${email}?`)) return;
    try {
      await api.revokeUserKey(id);
      fetchUsers();
    } catch (err) {
      alert(`Revoke error: ${err.message}`);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Access Governance"
        title="User Onboarding & API Approvals"
        subtitle="Review developer registrations, approve sending eligibility, and issue cryptographically scoped API keys."
        action={
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="border border-ink text-ink hover:bg-black/5 bg-canvas px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Roster</span>
          </button>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-6">
        {/* Filter and Search Bar */}
        <div className="bg-canvas border border-hairline rounded-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['pending', 'approved', 'rejected', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xs text-[12px] font-medium uppercase tracking-normal transition-colors ${
                  statusFilter === st
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'bg-canvas-tint text-ink/70 hover:text-ink border border-hairline'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="w-full sm:w-80 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-disabled-ink absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-canvas text-ink border border-field-border rounded-sm pl-9 pr-3 py-1.5 text-[14px] placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-canvas-tint border-b border-hairline text-ink text-[12px] uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Company / App</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">API Key Prefix</th>
                  <th className="py-3 px-4 font-semibold">Daily Quota</th>
                  <th className="py-3 px-4 font-semibold">Created Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-disabled-ink text-[14px]">
                      No users found with status "{statusFilter}".
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-canvas-soft transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink leading-tight">{u.name}</div>
                        <div className="text-[12px] text-ink/65 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-ink">{u.company || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold uppercase border ${
                            u.status === 'approved'
                              ? 'bg-canvas-tint text-band-forest border-band-forest/30'
                              : u.status === 'pending'
                              ? 'bg-canvas-tint text-ink border-accent-gold'
                              : 'bg-canvas-tint text-error border-error/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.apiKey ? (
                          <div className="flex items-center gap-1.5 font-mono text-[12px] text-link">
                            <Key className="w-3.5 h-3.5 text-link" />
                            <span>{u.keyPrefix || u.apiKey.slice(0, 16)}...</span>
                          </div>
                        ) : (
                          <span className="text-disabled-ink italic text-[13px]">Unissued</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px]">
                        {u.dailyLimit?.toLocaleString() || 1000} req/day
                      </td>
                      <td className="py-3.5 px-4 text-ink/60 text-[13px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {u.status !== 'approved' ? (
                          <button
                            onClick={() => handleOpenApprove(u)}
                            className="bg-primary hover:bg-primary-pressed text-on-primary px-3 py-1.5 rounded-xs text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevoke(u.id, u.email)}
                            className="border border-error/50 text-error hover:bg-error/5 px-2.5 py-1.5 rounded-xs text-[13px] font-medium transition-colors inline-flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        )}

                        {u.status === 'pending' && (
                          <button
                            onClick={() => handleReject(u.id, u.email)}
                            className="border border-hairline text-ink hover:bg-black/5 px-2.5 py-1.5 rounded-xs text-[13px] font-medium transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Approve Modal - ex-modal-card from DESIGN.md */}
      {approveModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/50 backdrop-blur-none">
          <div className="bg-canvas border border-hairline rounded-md w-full max-w-md p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <h2 className="font-serif text-[22px] font-normal text-ink flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-ink" />
                Approve & Issue API Key
              </h2>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="text-ink/60 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-canvas-warm border border-hairline rounded-sm text-[13px] space-y-1">
              <div>Applicant: <strong className="text-ink">{selectedUser.name}</strong></div>
              <div>Email: <span className="font-mono text-link">{selectedUser.email}</span></div>
              {selectedUser.company && (
                <div>Organization: <span className="text-ink">{selectedUser.company}</span></div>
              )}
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={limits.dailyLimit}
                    onChange={(e) => setLimits({ ...limits, dailyLimit: parseInt(e.target.value, 10) })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
                <div>
                  <label className="block text-ink text-[13px] font-medium mb-1">
                    Monthly Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={limits.monthlyLimit}
                    onChange={(e) => setLimits({ ...limits, monthlyLimit: parseInt(e.target.value, 10) })}
                    className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink text-[13px] font-medium mb-1">
                  Rate Limit (Req / Min)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={limits.rateLimitPerMinute}
                  onChange={(e) => setLimits({ ...limits, rateLimitPerMinute: parseInt(e.target.value, 10) })}
                  className="w-full bg-canvas text-ink border border-field-border rounded-sm p-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-focus"
                />
              </div>

              <div className="p-3 bg-canvas-tint border border-hairline rounded-sm text-[12px] text-ink/80">
                Approving this user automatically generates an active gateway API key (<code className="font-mono text-link">vsg_live_...</code>).
              </div>

              <div className="pt-4 border-t border-hairline flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApproveModalOpen(false)}
                  className="border border-hairline text-ink hover:bg-black/5 px-4 py-2 rounded-xs text-[14px] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-pressed text-on-primary px-5 py-2 rounded-xs text-[14px] font-medium transition-colors"
                >
                  Activate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersApprovalPage;
