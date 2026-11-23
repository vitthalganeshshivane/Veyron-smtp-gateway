import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Search,
  RefreshCw,
  Eye,
  RotateCcw,
  X,
  FileText
} from 'lucide-react';

export function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [retryStatus, setRetryStatus] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const res = await api.getEmailLogs(params);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleRetry = async (jobId) => {
    try {
      setRetryStatus('Initiating retry...');
      const res = await api.retryEmail(jobId);
      setRetryStatus(res.message || 'Queued for retry');
      fetchLogs();
      if (selectedLog && selectedLog.jobId === jobId) {
        setSelectedLog(prev => ({ ...prev, status: 'queued' }));
      }
    } catch (err) {
      setRetryStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Audit Ledger"
        title="Email Delivery Transactions"
        subtitle="Complete chronological audit ledger of outbound emails, SMTP handshakes, and transport receipts."
        action={
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="border border-ink text-ink hover:bg-black/5 bg-canvas px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-6">
        {/* Search and Filters Bar */}
        <div className="bg-canvas border border-hairline rounded-md p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-disabled-ink absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Job ID, Recipient, or Subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-canvas text-ink border border-field-border rounded-sm pl-10 pr-4 py-2 text-[14px] placeholder:text-disabled-ink focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-pressed text-on-primary px-4 py-2 rounded-xs text-[14px] font-medium transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-canvas border border-field-border text-ink text-[14px] rounded-sm px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent (SMTP Accepted)</option>
              <option value="queued">Queued in BullMQ</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed Delivery</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-canvas-tint border-b border-hairline text-ink text-[12px] uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold">Job ID</th>
                  <th className="py-3 px-4 font-semibold">Recipients</th>
                  <th className="py-3 px-4 font-semibold">Subject</th>
                  <th className="py-3 px-4 font-semibold">Project</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Attempts</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-disabled-ink text-[14px]">
                      No email transactions matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.jobId} className="hover:bg-canvas-soft transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[13px] text-link font-medium">
                        {log.jobId}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-ink">
                        {log.recipients?.[0] || 'N/A'}
                        {log.recipients?.length > 1 && (
                          <span className="ml-1.5 text-[11px] text-ink/70 bg-canvas-warm border border-hairline px-1.5 py-0.2 rounded-xs">
                            +{log.recipients.length - 1}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-ink max-w-[220px] truncate">{log.subject}</td>
                      <td className="py-3.5 px-4 text-ink/75">{log.projectName || 'Dynamic / Default'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold uppercase border ${
                            log.status === 'sent' || log.status === 'delivered'
                              ? 'bg-canvas-tint text-band-forest border-band-forest/30'
                              : log.status === 'queued'
                              ? 'bg-canvas-tint text-ink border-accent-gold'
                              : 'bg-canvas-tint text-error border-error/30'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-ink/70 font-mono text-[13px]">{log.attempts || 0}</td>
                      <td className="py-3.5 px-4 text-ink/60 text-[13px]">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="border border-hairline hover:border-ink p-1.5 rounded-xs text-ink transition-colors inline-flex"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(log.jobId)}
                            className="border border-error/40 text-error hover:bg-error/5 p-1.5 rounded-xs transition-colors inline-flex"
                            title="Retry dispatch"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-4 bg-canvas-tint border-t border-hairline flex items-center justify-between text-[13px] text-ink/75">
            <div>
              Showing {logs.length} of {total} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xs border border-hairline bg-canvas text-ink hover:bg-canvas-warm disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="font-mono text-[12px] px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xs border border-hairline bg-canvas text-ink hover:bg-canvas-warm disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal - ex-modal-card from DESIGN.md */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-deep/50 backdrop-blur-none">
          <div className="bg-canvas border border-hairline rounded-md w-full max-w-2xl max-h-[85vh] overflow-y-auto p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div>
                <h2 className="font-serif text-[22px] font-normal text-ink flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ink" />
                  Email Transaction Details
                </h2>
                <span className="text-[12px] font-mono text-link">{selectedLog.jobId}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-ink/60 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="p-3 bg-canvas-warm border border-hairline rounded-sm">
                <span className="text-disabled-ink uppercase font-semibold text-[11px] block mb-1">Status</span>
                <span className="font-semibold text-ink uppercase">{selectedLog.status}</span>
              </div>
              <div className="p-3 bg-canvas-warm border border-hairline rounded-sm">
                <span className="text-disabled-ink uppercase font-semibold text-[11px] block mb-1">Project</span>
                <span className="font-semibold text-ink">{selectedLog.projectName || 'Dynamic'}</span>
              </div>
              <div className="p-3 bg-canvas-warm border border-hairline rounded-sm">
                <span className="text-disabled-ink uppercase font-semibold text-[11px] block mb-1">SMTP Transport</span>
                <span className="font-semibold text-ink">{selectedLog.smtpAccountName || 'Dynamic Credentials'}</span>
              </div>
              <div className="p-3 bg-canvas-warm border border-hairline rounded-sm">
                <span className="text-disabled-ink uppercase font-semibold text-[11px] block mb-1">Attempts</span>
                <span className="font-mono text-ink">{selectedLog.attempts || 1}</span>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <span className="font-semibold text-ink block mb-1">Sender (From):</span>
                <div className="p-2.5 bg-canvas-tint rounded-sm border border-hairline font-mono text-[12px] text-ink">
                  {selectedLog.from?.name ? `"${selectedLog.from.name}" <${selectedLog.from.address}>` : selectedLog.from?.address || 'N/A'}
                </div>
              </div>

              <div>
                <span className="font-semibold text-ink block mb-1">Recipients (To):</span>
                <div className="p-2.5 bg-canvas-tint rounded-sm border border-hairline font-mono text-[12px] text-ink">
                  {selectedLog.recipients?.join(', ')}
                </div>
              </div>

              <div>
                <span className="font-semibold text-ink block mb-1">Subject:</span>
                <div className="p-2.5 bg-canvas-tint rounded-sm border border-hairline text-ink">
                  {selectedLog.subject}
                </div>
              </div>

              {selectedLog.error && (
                <div>
                  <span className="font-semibold text-error block mb-1">SMTP Delivery Diagnostic / Error:</span>
                  <pre className="p-3 bg-error/5 border border-error/20 rounded-sm font-mono text-[12px] text-error overflow-x-auto whitespace-pre-wrap">
                    {selectedLog.error}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-hairline flex items-center justify-between">
              {retryStatus ? (
                <span className="text-[12px] font-mono text-ink/75">{retryStatus}</span>
              ) : <div />}

              <div className="flex gap-3">
                {selectedLog.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(selectedLog.jobId)}
                    className="bg-primary hover:bg-primary-pressed text-on-primary px-4 py-2 rounded-xs text-[14px] font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Delivery
                  </button>
                )}
                <button
                  onClick={() => setSelectedLog(null)}
                  className="border border-hairline text-ink hover:bg-black/5 px-4 py-2 rounded-xs text-[14px] font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogsPage;
