import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { HeroBand } from '../components/HeroBand.jsx';
import {
  Key,
  Copy,
  Check,
  Clock,
  RotateCcw,
  Code,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ShieldAlert
} from 'lucide-react';

export function UserPortalPage() {
  const { user, setUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState(user);
  const [logs, setLogs] = useState([]);
  const [codeLanguage, setCodeLanguage] = useState('curl');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await api.getMe();
      setProfile(res.user);
      if (setUser) setUser(res.user);

      if (res.user.status === 'approved') {
        const logsRes = await api.getEmailLogs({ limit: 5 });
        setLogs(logsRes.logs || []);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate your API Key? Your existing key will be permanently revoked immediately.')) return;
    try {
      await api.regenerateMyKey();
      setStatusMessage('API Key regenerated successfully.');
      fetchProfile();
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const isApproved = profile?.status === 'approved';
  const isPending = profile?.status === 'pending';
  const isSuspended = profile?.status === 'suspended' || profile?.status === 'rejected';

  const apiKey = profile?.apiKey || 'vsg_live_pending_approval';

  const codeSnippets = {
    curl: `curl -X POST "${window.location.origin}/api/v1/emails/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "smtp": {
      "host": "smtp.hostinger.com",
      "port": 465,
      "secure": true,
      "auth": {
        "user": "${profile?.email || 'your-email@domain.com'}",
        "pass": "YOUR_SMTP_PASSWORD"
      }
    },
    "to": ["recipient@example.com"],
    "subject": "Hello via Veyron Outbound Relay",
    "html": "<h1>Welcome</h1><p>Relayed reliably through Veyron SMTP Gateway.</p>"
  }'`,

    node: `// Node.js (Fetch API / Express / Next.js)
const response = await fetch("${window.location.origin}/api/v1/emails/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    smtp: {
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "${profile?.email || 'your-email@domain.com'}",
        pass: "YOUR_SMTP_PASSWORD"
      }
    },
    to: ["recipient@example.com"],
    subject: "Order Confirmation",
    html: "<h1>Order Confirmed</h1><p>Delivered by Veyron Gateway</p>"
  })
});
const data = await response.json();
console.log(data); // { success: true, jobId: "vms_82fa912", status: "queued" }`,

    python: `# Python (requests)
import requests

url = "${window.location.origin}/api/v1/emails/send"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "smtp": {
        "host": "smtp.hostinger.com",
        "port": 465,
        "secure": True,
        "auth": {
            "user": "${profile?.email || 'your-email@domain.com'}",
            "pass": "YOUR_SMTP_PASSWORD"
        }
    },
    "to": ["recipient@example.com"],
    "subject": "Automated Dispatch Notice",
    "html": "<h1>Notification</h1><p>Transmitted via Veyron Relay</p>"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`
  };

  return (
    <div className="w-full flex flex-col">
      {/* Authentic Hero Band with Georgia display serif */}
      <HeroBand
        badge="Developer Environment"
        title="Developer Access & Integration"
        subtitle="Manage your cryptographic gateway API key and dispatch outbound emails using dynamic SMTP credentials directly from your applications."
        action={
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xs text-[12px] font-medium border flex items-center gap-2 ${
                isApproved
                  ? 'bg-canvas text-ink border-band-forest'
                  : isPending
                  ? 'bg-canvas text-ink border-accent-gold'
                  : 'bg-canvas text-error border-error'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isApproved ? 'bg-band-forest' : isPending ? 'bg-accent-gold' : 'bg-error'
                }`}
              />
              <span className="font-semibold uppercase">{profile?.status || 'PENDING'}</span>
            </span>
          </div>
        }
      />

      <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-10 space-y-8">
        {/* PENDING APPROVAL NOTICE */}
        {isPending && (
          <div className="bg-canvas border border-hairline rounded-md p-8">
            <div className="max-w-2xl">
              <div className="w-10 h-10 rounded-xs bg-canvas-warm border border-hairline flex items-center justify-center text-ink mb-4">
                <Clock className="w-5 h-5 text-accent-gold" />
              </div>
              <h2 className="font-serif text-[24px] font-normal text-ink mb-2">
                API Key Access Pending Administrator Approval
              </h2>
              <div className="w-10 h-1 bg-accent-gold mb-3"></div>
              <p className="text-[15px] text-ink/75 leading-relaxed mb-6">
                Your account is currently under review by the gateway administrator. Once an administrator validates and approves your developer application, your dedicated project API key will be generated and issued right here.
              </p>
              <button
                onClick={fetchProfile}
                className="bg-primary hover:bg-primary-pressed text-on-primary px-4 py-2.5 rounded-xs text-[14px] font-medium transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Refresh Approval Status
              </button>
            </div>
          </div>
        )}

        {/* SUSPENDED NOTICE */}
        {isSuspended && (
          <div className="bg-canvas border border-error/30 rounded-md p-8">
            <div className="w-10 h-10 rounded-xs bg-error/10 text-error flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-[24px] font-normal text-ink mb-2">
              API Access Suspended or Denied
            </h2>
            <div className="w-10 h-1 bg-error mb-3"></div>
            <p className="text-[15px] text-ink/75 max-w-2xl">
              Outbound transmission for this account has been suspended or denied by system policy. Please get in touch with your infrastructure administrator to reinstate gateway privileges.
            </p>
          </div>
        )}

        {/* APPROVED DEVELOPER EXPERIENCE */}
        {isApproved && (
          <div className="space-y-8">
            {/* API Key Surface - product-card from DESIGN.md */}
            <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
                <div>
                  <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight flex items-center gap-2">
                    <Key className="w-5 h-5 text-ink" />
                    Authorized Project API Key
                  </h2>
                  <p className="text-[14px] text-ink/70 mt-1">
                    Pass this credential in HTTP headers as <code className="font-mono text-link">Authorization: Bearer &lt;KEY&gt;</code>
                  </p>
                </div>

                <button
                  onClick={handleRegenerate}
                  className="border border-ink text-ink hover:bg-black/5 px-3.5 py-2 rounded-xs text-[13px] font-medium transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate Key
                </button>
              </div>

              {/* API Key Field */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 bg-canvas-tint border border-field-border rounded-sm px-4 py-3 font-mono text-[14px] text-ink select-all break-all">
                  {profile?.apiKey}
                </div>
                <button
                  onClick={() => copyToClipboard(profile?.apiKey)}
                  className="bg-primary hover:bg-primary-pressed text-on-primary px-5 py-3 rounded-xs text-[14px] font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-accent-gold" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>

              {statusMessage && (
                <div className="p-3 bg-canvas-warm border border-hairline text-ink text-[13px] rounded-xs font-mono">
                  {statusMessage}
                </div>
              )}

              {/* Quota Panels - stat-panel from DESIGN.md */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-canvas-warm border border-hairline rounded-md p-4">
                  <span className="text-[12px] uppercase tracking-normal font-semibold text-disabled-ink block mb-1">
                    Daily Quota
                  </span>
                  <div className="text-[20px] font-extrabold text-ink font-sans">
                    {profile?.dailyLimit?.toLocaleString() || 1000}
                    <span className="text-[13px] font-normal text-ink/60 ml-1.5">emails / day</span>
                  </div>
                </div>

                <div className="bg-canvas-warm border border-hairline rounded-md p-4">
                  <span className="text-[12px] uppercase tracking-normal font-semibold text-disabled-ink block mb-1">
                    Monthly Quota
                  </span>
                  <div className="text-[20px] font-extrabold text-ink font-sans">
                    {profile?.monthlyLimit?.toLocaleString() || 30000}
                    <span className="text-[13px] font-normal text-ink/60 ml-1.5">emails / month</span>
                  </div>
                </div>

                <div className="bg-canvas-warm border border-hairline rounded-md p-4">
                  <span className="text-[12px] uppercase tracking-normal font-semibold text-disabled-ink block mb-1">
                    Rate Limit
                  </span>
                  <div className="text-[20px] font-extrabold text-ink font-sans">
                    {profile?.rateLimitPerMinute || 60}
                    <span className="text-[13px] font-normal text-ink/60 ml-1.5">req / min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Snippets - Dynamic SMTP Agnostic Integration */}
            <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight flex items-center gap-2">
                    <Code className="w-5 h-5 text-ink" />
                    Dynamic SMTP Agnostic Integration
                  </h2>
                  <p className="text-[14px] text-ink/70 mt-1">
                    Pass your SMTP credentials (Hostinger, Google Workspace, custom MTA) dynamically per request.
                  </p>
                </div>

                {/* Language Switcher Tabs */}
                <div className="flex bg-canvas-tint border border-hairline rounded-xs p-1 text-[13px] font-medium">
                  {['curl', 'node', 'python'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLanguage(lang)}
                      className={`px-3.5 py-1.5 rounded-xs uppercase transition-colors ${
                        codeLanguage === lang
                          ? 'bg-canvas text-ink border border-hairline font-semibold'
                          : 'text-ink/60 hover:text-ink'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Container */}
              <div className="relative">
                <pre className="bg-ink-deep text-white p-5 rounded-sm text-[13px] font-mono overflow-x-auto leading-relaxed border border-hairline">
                  {codeSnippets[codeLanguage]}
                </pre>
                <button
                  onClick={() => copyToClipboard(codeSnippets[codeLanguage])}
                  className="absolute right-3.5 top-3.5 bg-canvas/10 hover:bg-canvas/20 text-white border border-white/20 px-3 py-1.5 rounded-xs text-[12px] font-mono transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Recent Email Logs Table */}
            <div className="bg-canvas border border-hairline rounded-md p-6 lg:p-8 space-y-4">
              <h2 className="font-sans font-extrabold text-[20px] text-ink leading-tight">
                Recent Dispatches
              </h2>
              {logs.length === 0 ? (
                <div className="py-12 text-center text-[14px] text-disabled-ink bg-canvas-soft rounded-sm border border-hairline">
                  No email transactions recorded for this key yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead className="bg-canvas-tint border-b border-hairline text-ink text-[12px] uppercase">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Job ID</th>
                        <th className="py-3 px-4 font-semibold">Recipient</th>
                        <th className="py-3 px-4 font-semibold">Subject</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {logs.map((log) => (
                        <tr key={log.jobId} className="hover:bg-canvas-soft transition-colors">
                          <td className="py-3 px-4 font-mono text-[13px] text-link font-medium">
                            {log.jobId}
                          </td>
                          <td className="py-3 px-4 text-ink">{log.recipients?.[0]}</td>
                          <td className="py-3 px-4 text-ink max-w-[240px] truncate">{log.subject}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-xs text-[11px] font-semibold uppercase border ${
                                log.status === 'sent'
                                  ? 'bg-canvas-tint text-band-forest border-band-forest/30'
                                  : 'bg-canvas-tint text-error border-error/30'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-ink/60 text-[13px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPortalPage;
