import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Layers,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Trash2,
  RefreshCw,
  Cpu,
  ShieldCheck
} from 'lucide-react';

export function QueuePage() {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getQueueStats();
      setQueueData(res.queue);
    } catch (err) {
      console.error('Failed to fetch queue stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleClean = async (type) => {
    try {
      setActionMessage(`Cleaning ${type} jobs...`);
      const res = await api.cleanQueue(type);
      setActionMessage(res.message);
      fetchStats();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const counts = queueData?.counts || {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0
  };

  const metricCards = [
    { label: 'Waiting in Queue', count: counts.waiting, icon: Clock },
    { label: 'Active Relays', count: counts.active, icon: PlayCircle },
    { label: 'Completed Deliveries', count: counts.completed, icon: CheckCircle2 },
    { label: 'Failed Transmissions', count: counts.failed, icon: AlertTriangle },
    { label: 'Delayed / Backoff', count: counts.delayed, icon: PauseCircle },
  ];

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="Queue Engine"
        title="BullMQ & Redis Dispatch Pipeline"
        subtitle="Asynchronous delivery engine coordinating concurrent Nodemailer SMTP streams with automatic exponential backoff."
        action={
          <div className="flex items-center gap-3">
            {actionMessage && (
              <span className="text-[12px] font-mono text-ink bg-canvas border border-hairline px-3 py-1.5 rounded-xs">
                {actionMessage}
              </span>
            )}
            <button
              onClick={fetchStats}
              disabled={loading}
              className="border border-ink text-ink hover:bg-black/5 bg-canvas px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Poll Queue</span>
            </button>
          </div>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Metric Cards - product-card from DESIGN.md */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {metricCards.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={i}
                className="bg-canvas border border-hairline rounded-md p-6 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] uppercase font-semibold text-disabled-ink">
                    {m.label}
                  </span>
                  <div className="w-7 h-7 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
                    <Icon className="w-3.5 h-3.5 text-ink" />
                  </div>
                </div>
                <div className="text-[28px] font-extrabold text-ink font-sans leading-none">
                  {m.count}
                </div>
              </div>
            );
          })}
        </div>

        {/* Worker Telemetry & Queue Maintenance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Telemetry */}
          <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-5">
            <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-ink" />
              Worker Telemetry & Concurrency
            </h2>

            <div className="space-y-3.5 text-[14px]">
              <div className="flex items-center justify-between p-3.5 rounded-sm bg-canvas-warm border border-hairline">
                <span className="text-ink/75">Configured Concurrency</span>
                <span className="font-mono font-bold text-ink">
                  {queueData?.concurrency || 5} concurrent streams
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-sm bg-canvas-warm border border-hairline">
                <span className="text-ink/75">Active Worker Node Process</span>
                <span className="font-mono text-ink font-semibold">
                  {queueData?.activeWorkers ?? 1} process online
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-sm bg-canvas-warm border border-hairline">
                <span className="text-ink/75">Backoff Retry Strategy</span>
                <span className="font-mono text-ink/80">Exponential (5s, 10s, 20s)</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-sm bg-canvas-warm border border-hairline">
                <span className="text-ink/75">Target Architecture</span>
                <span className="font-mono text-ink/80">Oracle Cloud VM (~1 GB RAM)</span>
              </div>
            </div>
          </div>

          {/* Maintenance & RAM Optimization */}
          <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6 flex flex-col justify-between">
            <div>
              <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-ink" />
                Redis Buffer Maintenance
              </h2>
              <p className="text-[14px] text-ink/70 mb-6">
                Permanent transaction history is preserved in MongoDB Atlas. Cleaning Redis keys frees volatile RAM on your 1 GB Oracle VM instance.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleClean('completed')}
                  className="w-full bg-primary hover:bg-primary-pressed text-on-primary py-2.5 px-4 rounded-xs text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-accent-gold" />
                  Purge Completed Jobs from Redis Memory
                </button>

                <button
                  onClick={() => handleClean('failed')}
                  className="w-full border border-ink text-ink hover:bg-black/5 py-2.5 px-4 rounded-xs text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Purge Failed Jobs from Redis
                </button>
              </div>
            </div>

            <div className="p-4 rounded-sm bg-canvas-tint border border-hairline text-[12px] text-ink/80 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-ink" />
              <span>
                Memory Guard: Redis runs with <code className="font-mono font-semibold">maxmemory 128mb</code> and <code className="font-mono font-semibold">maxmemory-policy noeviction</code> to prevent message drops.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueuePage;
