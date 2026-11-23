import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Activity,
  HardDrive,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  Server,
  FileCode2
} from 'lucide-react';

export function HealthPage() {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const [hRes, lRes] = await Promise.all([
        api.getSystemHealth(),
        api.getSystemLogs({ limit: 10 })
      ]);
      setHealth(hRes);
      setLogs(lRes.logs || []);
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const mem = health?.system?.memory || {
    rssMb: 0,
    heapUsedMb: 0,
    heapTotalMb: 0,
    osFreeMb: 0,
    osTotalMb: 0,
    redisUsed: 'N/A'
  };

  return (
    <div className="w-full flex flex-col">
      <HeroBand
        badge="VM Telemetry"
        title="Host Environment & RAM Budget"
        subtitle="Real-time resource utilization tuned for Oracle Cloud Free Tier instance (~1 GB RAM)."
        action={
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="border border-ink text-ink hover:bg-black/5 bg-canvas px-4 py-2 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Poll Diagnostics</span>
          </button>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* Memory Footprint Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-canvas border border-hairline rounded-md p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] uppercase font-semibold text-disabled-ink">
                Node.js Process RSS
              </span>
              <div className="w-7 h-7 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
                <HardDrive className="w-3.5 h-3.5 text-ink" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-ink font-sans font-mono leading-none">
                {mem.rssMb} MB
              </div>
              <span className="text-[12px] text-ink/70 mt-2 block">Optimized low footprint</span>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] uppercase font-semibold text-disabled-ink">
                V8 Heap Allocation
              </span>
              <div className="w-7 h-7 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
                <Cpu className="w-3.5 h-3.5 text-ink" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-ink font-sans font-mono leading-none">
                {mem.heapUsedMb} <span className="text-[16px] text-ink/50">/ {mem.heapTotalMb} MB</span>
              </div>
              <span className="text-[12px] text-ink/70 mt-2 block">V8 GC active</span>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] uppercase font-semibold text-disabled-ink">
                Redis Buffer Memory
              </span>
              <div className="w-7 h-7 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
                <Layers className="w-3.5 h-3.5 text-ink" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-ink font-sans font-mono leading-none">
                {mem.redisUsed}
              </div>
              <span className="text-[12px] text-ink/70 mt-2 block">128 MB maxmemory cap</span>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] uppercase font-semibold text-disabled-ink">
                Available Host RAM
              </span>
              <div className="w-7 h-7 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
                <Server className="w-3.5 h-3.5 text-ink" />
              </div>
            </div>
            <div>
              <div className="text-[28px] font-extrabold text-ink font-sans font-mono leading-none">
                {mem.osFreeMb} MB
              </div>
              <span className="text-[12px] text-ink/70 mt-2 block">Of {mem.osTotalMb} MB system total</span>
            </div>
          </div>
        </div>

        {/* Services Matrix */}
        <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6">
          <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
            Infrastructure Component Topology
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[14px]">
            <div className="p-4 rounded-sm bg-canvas-warm border border-hairline flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-ink" />
                <div>
                  <div className="font-semibold text-ink">MongoDB Atlas</div>
                  <div className="text-[12px] text-ink/65">External persistence tier</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-xs text-[11px] font-semibold bg-canvas text-band-forest border border-band-forest/30 uppercase">
                {health?.services?.mongodb?.status || 'Connected'}
              </span>
            </div>

            <div className="p-4 rounded-sm bg-canvas-warm border border-hairline flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-ink" />
                <div>
                  <div className="font-semibold text-ink">Redis 7 Container</div>
                  <div className="text-[12px] text-ink/65">Internal Docker network (AOF)</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-xs text-[11px] font-semibold bg-canvas text-band-forest border border-band-forest/30 uppercase">
                {health?.services?.redis?.status || 'Connected'}
              </span>
            </div>

            <div className="p-4 rounded-sm bg-canvas-warm border border-hairline flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-ink" />
                <div>
                  <div className="font-semibold text-ink">BullMQ Worker Process</div>
                  <div className="text-[12px] text-ink/65">
                    {health?.services?.queue?.concurrency || 5} concurrent streams
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-xs text-[11px] font-semibold bg-canvas text-band-forest border border-band-forest/30 uppercase">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-4">
          <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-ink" />
            Gateway Diagnostic & Audit Log
          </h2>

          {logs.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-disabled-ink bg-canvas-soft rounded-sm border border-hairline">
              No system warnings or fatal exceptions recorded.
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-sm bg-canvas-warm border border-hairline flex items-start justify-between text-[13px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-1.5 py-0.2 rounded-xs text-[10px] font-bold uppercase border ${
                          log.level === 'fatal' || log.level === 'error'
                            ? 'bg-canvas text-error border-error/30'
                            : 'bg-canvas text-ink border-hairline'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="font-mono text-ink font-semibold">{log.event}</span>
                    </div>
                    <p className="text-ink/80 text-[13px]">{log.message}</p>
                  </div>
                  <span className="text-[12px] text-disabled-ink shrink-0 ml-4 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HealthPage;
