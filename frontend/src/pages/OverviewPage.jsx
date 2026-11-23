import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  SendHorizontal,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Briefcase,
  Server,
  RefreshCw,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export function OverviewPage({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, dailyRes, logsRes] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAnalyticsDaily(7),
        api.getEmailLogs({ limit: 5 })
      ]);
      setStats(overviewRes.stats);
      setDailyData(dailyRes.data);
      setRecentLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metricCards = [
    {
      label: 'Total Dispatched',
      value: stats?.totalEmails ?? '-',
      sub: 'All-time transactions',
      icon: SendHorizontal,
    },
    {
      label: 'Accepted by SMTP',
      value: stats?.sentEmails ?? '-',
      sub: `${stats?.successRate ?? 100}% Delivery Rate`,
      icon: CheckCircle2,
    },
    {
      label: 'Queued In BullMQ',
      value: stats?.queuedEmails ?? '-',
      sub: 'Awaiting transport dispatch',
      icon: Clock,
    },
    {
      label: 'Delivery Failures',
      value: stats?.failedEmails ?? '-',
      sub: 'Permanent or transient',
      icon: AlertTriangle,
    }
  ];

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Node Operations"
        title="Gateway Operations & Outbound Relays"
        subtitle="Real-time telemetry, queue throughput, and tenant distribution for high-frequency SMTP delivery."
        action={
          <button
            onClick={fetchData}
            disabled={loading}
            className="border border-ink text-ink hover:bg-black/5 bg-canvas px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Metric Cards - product-card from DESIGN.md */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="bg-canvas border border-hairline rounded-md p-6 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] uppercase font-semibold text-disabled-ink">
                    {c.label}
                  </span>
                  <div className="w-8 h-8 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
                    <Icon className="w-4 h-4 text-ink" />
                  </div>
                </div>
                <div>
                  <div className="text-[34px] font-extrabold text-ink font-sans leading-none">
                    {c.value}
                  </div>
                  {c.sub && (
                    <div className="text-[13px] text-ink/65 mt-2 flex items-center gap-1.5 font-medium">
                      <span>{c.sub}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts & Tenancy Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 7-Day Outbound Volume */}
          <div className="lg:col-span-2 bg-canvas border border-hairline rounded-md p-6 lg:p-8 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
                  7-Day Outbound Volume
                </h2>
                <p className="text-[14px] text-ink/70 mt-1">
                  Daily dispatched messages vs transport rejections
                </p>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-mono font-medium text-ink bg-canvas-warm border border-hairline px-2.5 py-1 rounded-xs">
                Redis 7 · BullMQ Concurrency 5
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#312d2a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#312d2a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c74634" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#c74634" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#aea8a2" fontSize={11} tickLine={false} />
                  <YAxis stroke="#aea8a2" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e4e1dd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#161513'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    stroke="#312d2a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSent)"
                    name="Sent"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="#c74634"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFailed)"
                    name="Failed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Infrastructure & Tenancy */}
          <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
                Tenancy & Routing
              </h2>
              <p className="text-[14px] text-ink/70 mt-1 mb-6">
                Active tenant isolation status
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-canvas-warm border border-hairline rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xs bg-canvas border border-hairline flex items-center justify-center text-ink">
                      <Briefcase className="w-4 h-4 text-ink" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-ink">Authorized Projects</div>
                      <div className="text-[12px] text-ink/65">External client applications</div>
                    </div>
                  </div>
                  <span className="text-[20px] font-extrabold text-ink font-sans">
                    {stats?.projects?.active || 0}
                  </span>
                </div>

                <div className="p-4 bg-canvas-warm border border-hairline rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xs bg-canvas border border-hairline flex items-center justify-center text-ink">
                      <Server className="w-4 h-4 text-ink" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-ink">Configured Relays</div>
                      <div className="text-[12px] text-ink/65">Dedicated SMTP accounts</div>
                    </div>
                  </div>
                  <span className="text-[20px] font-extrabold text-ink font-sans">
                    {stats?.smtpAccounts?.active || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline space-y-2.5">
              <button
                onClick={() => onNavigate('projects')}
                className="w-full bg-primary hover:bg-primary-pressed text-on-primary py-2.5 px-4 rounded-xs text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>Manage Client Projects</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('smtp')}
                className="w-full border border-ink text-ink hover:bg-black/5 py-2.5 px-4 rounded-xs text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span>Configure SMTP Accounts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Delivery Activity Table */}
        <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
              Recent Delivery Transactions
            </h2>
            <button
              onClick={() => onNavigate('logs')}
              className="text-[13px] text-link hover:underline font-medium flex items-center gap-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-disabled-ink bg-canvas-soft rounded-sm border border-hairline">
              No transactions logged yet. Dispatch an email using your API key.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="bg-canvas-tint border-b border-hairline text-ink text-[12px] uppercase">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Job ID</th>
                    <th className="py-3 px-4 font-semibold">Recipient</th>
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Project</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {recentLogs.map((log) => (
                    <tr key={log.jobId} className="hover:bg-canvas-soft transition-colors">
                      <td className="py-3 px-4 font-mono text-[13px] text-link font-medium">
                        {log.jobId}
                      </td>
                      <td className="py-3 px-4 text-ink">{log.recipients?.[0] || 'N/A'}</td>
                      <td className="py-3 px-4 text-ink max-w-[220px] truncate">{log.subject}</td>
                      <td className="py-3 px-4 text-ink/75">{log.projectName || 'Dynamic / Default'}</td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-ink/60 text-[13px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
