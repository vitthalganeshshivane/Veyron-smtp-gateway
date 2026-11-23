import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export function AnalyticsPage() {
  const [days, setDays] = useState(14);
  const [dailyData, setDailyData] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dailyRes, projRes] = await Promise.all([
        api.getAnalyticsDaily(days),
        api.getAnalyticsProjects()
      ]);
      setDailyData(dailyRes.data || []);
      setProjectStats(projRes.data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Deliverability Telemetry"
        title="Gateway Throughput & Analytics"
        subtitle="Historical transmission trends, deliverability rates, and cross-application volume allocation."
        action={
          <div className="flex items-center gap-3">
            <div className="flex bg-canvas-warm border border-hairline rounded-xs p-1 text-[13px] font-medium">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-xs transition-colors ${
                    days === d
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-ink/65 hover:text-ink'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="border border-ink text-ink hover:bg-black/5 bg-canvas px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Main Trend Chart */}
        <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
                Outbound Dispatch Timeline
              </h2>
              <p className="text-[14px] text-ink/70 mt-1">
                Accepted SMTP submissions vs transmission errors across {days} days
              </p>
            </div>
            <div className="flex items-center gap-5 text-[13px] font-medium">
              <span className="flex items-center gap-2 text-ink">
                <span className="w-3 h-3 rounded-xs bg-primary"></span>
                <span>Accepted (Sent)</span>
              </span>
              <span className="flex items-center gap-2 text-brand-mark">
                <span className="w-3 h-3 rounded-xs bg-brand-mark"></span>
                <span>Failed Deliveries</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSentAnalytic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#312d2a" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#312d2a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailedAnalytic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c74634" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#c74634" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e1dd" />
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
                  fill="url(#colorSentAnalytic)"
                  name="Sent"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke="#c74634"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFailedAnalytic)"
                  name="Failed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Breakdown Bar Chart & Tenancy Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6">
            <div>
              <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
                Tenant Volume Breakdown
              </h2>
              <p className="text-[14px] text-ink/70 mt-1">
                Total email traffic segmented by authorized client project
              </p>
            </div>

            <div className="h-64 w-full">
              {projectStats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[14px] text-disabled-ink">
                  No project transactions recorded yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e1dd" />
                    <XAxis dataKey="projectName" stroke="#aea8a2" fontSize={11} tickLine={false} />
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
                    <Bar dataKey="sent" fill="#312d2a" name="Sent" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="failed" fill="#c74634" name="Failed" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tenancy Reliability Table */}
          <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6 flex flex-col justify-between">
            <div>
              <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
                Tenant Reliability Score
              </h2>
              <p className="text-[14px] text-ink/70 mt-1 mb-6">
                Deliverability percentage per external client application
              </p>

              <div className="space-y-3">
                {projectStats.map((p, idx) => {
                  const total = p.total || (p.sent + p.failed);
                  const rate = total > 0 ? Math.round((p.sent / total) * 100) : 100;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-sm bg-canvas-warm border border-hairline flex items-center justify-between text-[14px]"
                    >
                      <div>
                        <div className="font-semibold text-ink">{p.projectName || 'Dynamic / Direct'}</div>
                        <div className="text-[12px] text-ink/65 font-mono">
                          {p.sent} dispatched · {p.failed} failed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-ink font-mono text-[16px]">{rate}%</div>
                        <div className="text-[11px] text-disabled-ink uppercase font-semibold">Success Rate</div>
                      </div>
                    </div>
                  );
                })}
                {projectStats.length === 0 && (
                  <div className="py-12 text-center text-[14px] text-disabled-ink">
                    No project analytics available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
