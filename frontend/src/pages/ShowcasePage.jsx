import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  Zap,
  Layers,
  Key,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Code2,
  Lock,
  Cpu,
  RefreshCw,
  Mail,
  ArrowRight,
  HelpCircle,
  Database,
  Globe,
  DollarSign
} from 'lucide-react';

export function ShowcasePage({ onNavigateToAuth }) {
  const [guideMode, setGuideMode] = useState('hosted'); // 'hosted' | 'selfhost'
  const [activeLang, setActiveLang] = useState('curl'); // 'curl' | 'javascript' | 'python' | 'powershell'
  const [selectedNode, setSelectedNode] = useState('api');
  const [copiedCode, setCopiedCode] = useState(false);

  // Playground state for interactive code generation
  const [testRecipient, setTestRecipient] = useState('recipient@example.com');
  const [testSender, setTestSender] = useState('billing@yourdomain.com');
  const [testSmtpHost, setTestSmtpHost] = useState('smtp.hostinger.com');
  const [testSubject, setTestSubject] = useState('Welcome to our Platform!');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const copySnippet = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getCodeSnippet = () => {
    switch (activeLang) {
      case 'curl':
        return `curl -X POST https://veyron-gateway.duckdns.org/api/v1/emails/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer vsg_live_YOUR_API_KEY_HERE" \\
  -d '{
    "smtp": {
      "host": "${testSmtpHost}",
      "port": 465,
      "secure": true,
      "auth": {
        "user": "${testSender}",
        "pass": "YourSecureSmtpPassword"
      }
    },
    "from": "${testSender}",
    "to": ["${testRecipient}"],
    "subject": "${testSubject}",
    "html": "<h3>Welcome aboard!</h3><p>Dispatched reliably via Veyron Gateway.</p>",
    "text": "Welcome aboard! Dispatched reliably via Veyron Gateway."
  }'`;

      case 'javascript':
        return `// Dispatch transactional email from Node.js, Next.js, or Vercel
const response = await fetch('https://veyron-gateway.duckdns.org/api/v1/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer vsg_live_YOUR_API_KEY_HERE'
  },
  body: JSON.stringify({
    smtp: {
      host: '${testSmtpHost}',
      port: 465,
      secure: true,
      auth: {
        user: '${testSender}',
        pass: process.env.SMTP_PASSWORD
      }
    },
    from: '${testSender}',
    to: ['${testRecipient}'],
    subject: '${testSubject}',
    html: '<h3>Welcome aboard!</h3><p>Dispatched reliably via Veyron Gateway.</p>'
  })
});

const data = await response.json();
console.log('Queued Job ID:', data.jobId); // e.g. vms_617d1ed146aa`;

      case 'python':
        return `import os
import requests

url = "https://veyron-gateway.duckdns.org/api/v1/emails/send"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer vsg_live_YOUR_API_KEY_HERE"
}
payload = {
    "smtp": {
        "host": "${testSmtpHost}",
        "port": 465,
        "secure": True,
        "auth": {
            "user": "${testSender}",
            "pass": os.getenv("SMTP_PASSWORD")
        }
    },
    "from": "${testSender}",
    "to": ["${testRecipient}"],
    "subject": "${testSubject}",
    "html": "<h3>Welcome aboard!</h3><p>Dispatched reliably via Veyron Gateway.</p>"
}

response = requests.post(url, json=payload, headers=headers)
print("Delivery Status:", response.json())`;

      case 'powershell':
        return `$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer vsg_live_YOUR_API_KEY_HERE"
}

$body = @{
    smtp = @{
        host   = "${testSmtpHost}"
        port   = 465
        secure = $true
        auth   = @{
            user = "${testSender}"
            pass = "YourSecureSmtpPassword"
        }
    }
    from    = "${testSender}"
    to      = @("${testRecipient}")
    subject = "${testSubject}"
    html    = "<h3>Welcome aboard!</h3><p>Dispatched reliably via Veyron Gateway.</p>"
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri "https://veyron-gateway.duckdns.org/api/v1/emails/send" -Method Post -Headers $headers -Body $body
$response`;

      default:
        return '';
    }
  };

  const pipelineNodes = [
    {
      id: 'client',
      title: '1. Cloud App',
      subtitle: 'Render / Vercel / Railway',
      description: 'Your serverless backend dispatches standard HTTPS POST requests, overcoming outbound SMTP port 25/465/587 blocks.',
      badge: 'HTTPS REST',
      detail: 'Replaces bulky SMTP client libraries in cloud functions with lightweight, non-blocking fetch calls.'
    },
    {
      id: 'api',
      title: '2. Gateway API',
      subtitle: 'mail-api (Express 22 LTS)',
      description: 'Authenticates your API key (SHA-256), validates the payload with Zod, reserves quotas atomically, and issues a tracking Job ID.',
      badge: 'Auth & Zod',
      detail: 'Enforces rate limits, validates SSRF security for attachment URLs, and caches Idempotency-Key responses.'
    },
    {
      id: 'queue',
      title: '3. Redis 7 + BullMQ',
      subtitle: 'In-Memory Priority Queue',
      description: 'Dynamic SMTP passwords are encrypted with AES-256-GCM before entering Redis. Plaintext credentials are never written to disk.',
      badge: 'AES-256-GCM',
      detail: 'Tuned with 128 MB maxmemory to run smoothly on a free 1 GB RAM cloud instance without eviction.'
    },
    {
      id: 'worker',
      title: '4. Delivery Worker',
      subtitle: 'mail-worker (Nodemailer Pool)',
      description: 'Picks up jobs, decrypts credentials in isolated memory, establishes TLS socket connections, and manages exponential backoff.',
      badge: 'Concurrency 1-5',
      detail: 'Distinguishes temporary 4xx errors from permanent 5xx mailbox errors, automatically reconciling quotas.'
    },
    {
      id: 'smtp',
      title: '5. Upstream MTA',
      subtitle: 'Hostinger / Google / SES',
      description: 'Delivers the raw email through your authentic domain mailbox, preserving SPF, DKIM, DMARC, and custom headers.',
      badge: 'Strict MIME',
      detail: 'Returns official server delivery receipts (e.g. 250 2.0.0 OK) directly recorded into MongoDB Atlas.'
    }
  ];

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-12">
      {/* 1. HERO BAND & LIVE STATUS */}
      <section className="bg-canvas border border-hairline rounded-md p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-canvas-tint border border-hairline rounded-xs text-[12px] font-mono text-ink">
            <span className="w-2 h-2 rounded-full bg-band-forest animate-pulse"></span>
            <span>PRODUCTION GATEWAY ACTIVE</span>
            <span className="text-disabled-ink">|</span>
            <span className="text-link">https://veyron-gateway.duckdns.org</span>
          </div>

          <h1 className="font-serif text-[32px] sm:text-[42px] font-normal text-ink leading-tight">
            High-Throughput Outbound SMTP Relay Infrastructure
          </h1>
          <div className="w-12 h-1 bg-accent-gold"></div>

          <p className="text-[16px] text-ink/80 leading-relaxed max-w-3xl">
            Bypass free-tier serverless port restrictions on <b>Render, Vercel, and Railway</b>. Route millions of
            transactional emails over HTTPS into <b>Redis 7 + BullMQ</b> and deliver through your authentic business
            SMTP mailboxes with zero third-party subscription fees and byte-for-byte content preservation.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                setGuideMode('hosted');
                document.getElementById('guides-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-primary text-on-primary hover:bg-primary-pressed px-5 py-2.5 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-accent-gold" />
              <span>Explore Hosted Mode</span>
            </button>
            <button
              onClick={() => {
                setGuideMode('selfhost');
                document.getElementById('guides-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border border-hairline hover:border-ink bg-canvas-tint px-5 py-2.5 rounded-xs text-[14px] font-medium transition-colors flex items-center gap-2"
            >
              <Server className="w-4 h-4 text-ink" />
              <span>Explore Self-Host Mode</span>
            </button>
            {onNavigateToAuth && (
              <button
                onClick={onNavigateToAuth}
                className="text-link hover:underline text-[14px] font-medium flex items-center gap-1.5 ml-2"
              >
                <span>Request API Key Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. LIVE INTERACTIVE PIPELINE ARCHITECTURE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-serif text-[24px] text-ink font-normal">Interactive Delivery Pipeline</h2>
            <div className="w-8 h-1 bg-accent-gold mt-1.5 mb-2"></div>
            <p className="text-[13px] text-ink/70">
              Click on any stage of the delivery lifecycle to inspect security guards, cryptographic safeguards, and latency guarantees.
            </p>
          </div>
          <span className="text-[11px] font-mono text-disabled-ink uppercase tracking-wider">
            Average End-to-End Latency: ~1.2s - 2.8s
          </span>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {pipelineNodes.map((node) => {
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`p-4 text-left rounded-md border transition-all relative ${
                  isSelected
                    ? 'bg-canvas border-ink shadow-sm ring-1 ring-ink'
                    : 'bg-canvas-tint border-hairline hover:bg-canvas hover:border-disabled-ink'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-xs bg-canvas-warm border border-hairline text-ink">
                    {node.badge}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-accent-gold"></span>}
                </div>
                <h3 className="font-semibold text-[14px] text-ink">{node.title}</h3>
                <p className="text-[11px] text-disabled-ink font-mono mb-2">{node.subtitle}</p>
                <p className="text-[12px] text-ink/75 line-clamp-2">{node.description}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Node Deep-Dive Drawer */}
        {selectedNode && (
          <div className="bg-canvas border border-hairline rounded-md p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] uppercase font-bold text-link">Deep-Dive:</span>
                <span className="font-semibold text-ink text-[14px]">
                  {pipelineNodes.find((n) => n.id === selectedNode)?.title}
                </span>
              </div>
              <p className="text-[13px] text-ink/80">
                {pipelineNodes.find((n) => n.id === selectedNode)?.detail}
              </p>
            </div>
            <div className="text-[12px] font-mono bg-canvas-tint px-3 py-1.5 rounded-xs border border-hairline text-ink whitespace-nowrap">
              AES-256-GCM + Zod Verified
            </div>
          </div>
        )}
      </section>

      {/* 3. DUAL-TRACK USER GUIDES SECTION */}
      <section id="guides-section" className="space-y-6">
        <div className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-[26px] text-ink font-normal">Step-by-Step Implementation Guides</h2>
            <div className="w-8 h-1 bg-accent-gold mt-1.5 mb-2"></div>
            <p className="text-[13px] text-ink/70">
              Select your preferred operational mode for complete, friction-free integration instructions.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-canvas-tint border border-hairline rounded-xs">
            <button
              onClick={() => setGuideMode('hosted')}
              className={`px-4 py-2 rounded-xs text-[13px] font-medium transition-colors flex items-center gap-2 ${
                guideMode === 'hosted'
                  ? 'bg-canvas text-ink border border-hairline font-semibold'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-accent-gold" />
              <span>Mode 1: Hosted Gateway</span>
            </button>
            <button
              onClick={() => setGuideMode('selfhost')}
              className={`px-4 py-2 rounded-xs text-[13px] font-medium transition-colors flex items-center gap-2 ${
                guideMode === 'selfhost'
                  ? 'bg-canvas text-ink border border-hairline font-semibold'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-ink" />
              <span>Mode 2: Self-Host Blueprint</span>
            </button>
          </div>
        </div>

        {/* MODE 1: HOSTED GATEWAY GUIDE */}
        {guideMode === 'hosted' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Step 1 & 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-canvas border border-hairline rounded-md p-6 space-y-3">
                <div className="w-8 h-8 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[13px]">
                  01
                </div>
                <h3 className="font-semibold text-ink text-[16px]">Request Developer Account Access</h3>
                <p className="text-[13px] text-ink/70 leading-relaxed">
                  Navigate to the portal registration page, provide your Name, Email, and Project details.
                  Your request is queued for instant administrative approval.
                </p>
                <div className="pt-2">
                  <span className="text-[12px] font-mono text-disabled-ink bg-canvas-tint px-2.5 py-1 rounded-xs border border-hairline">
                    Endpoint: POST /api/v1/auth/register
                  </span>
                </div>
              </div>

              <div className="bg-canvas border border-hairline rounded-md p-6 space-y-3">
                <div className="w-8 h-8 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[13px]">
                  02
                </div>
                <h3 className="font-semibold text-ink text-[16px]">Retrieve Cryptographic API Key</h3>
                <p className="text-[13px] text-ink/70 leading-relaxed">
                  Upon approval, log in to your developer dashboard. Your personalized API key (prefixed with{' '}
                  <code className="font-mono text-[12px] bg-canvas-warm px-1.5 py-0.5 rounded-xs">vsg_live_...</code>) is
                  activated with dedicated daily quotas (1,000+ emails/day).
                </p>
                <div className="pt-2">
                  <span className="text-[12px] font-mono text-band-forest bg-band-teal/30 px-2.5 py-1 rounded-xs border border-band-teal">
                    Status: Instant Automatic Key Issuance
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Interactive Request Builder & Code Generator */}
            <div className="bg-canvas border border-hairline rounded-md p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[12px]">
                      03
                    </span>
                    <h3 className="font-semibold text-ink text-[17px]">Interactive Email Dispatcher Playground</h3>
                  </div>
                  <p className="text-[13px] text-ink/70 mt-1">
                    Customize your parameters below to generate copy-paste ready code in your preferred stack.
                  </p>
                </div>

                {/* Language Switcher */}
                <div className="inline-flex p-1 bg-canvas-tint border border-hairline rounded-xs text-[12px] font-mono">
                  {['curl', 'javascript', 'python', 'powershell'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1 rounded-xs capitalize transition-colors ${
                        activeLang === lang
                          ? 'bg-canvas text-ink font-bold border border-hairline'
                          : 'text-disabled-ink hover:text-ink'
                      }`}
                    >
                      {lang === 'javascript' ? 'Node.js' : lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">Target Recipient</label>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="w-full bg-canvas border border-field-border rounded-xs px-3 py-1.5 text-[13px] text-ink focus:border-ink outline-none"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">Sender Address</label>
                  <input
                    type="email"
                    value={testSender}
                    onChange={(e) => setTestSender(e.target.value)}
                    className="w-full bg-canvas border border-field-border rounded-xs px-3 py-1.5 text-[13px] text-ink focus:border-ink outline-none"
                    placeholder="billing@yourdomain.com"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">SMTP Host Relay</label>
                  <input
                    type="text"
                    value={testSmtpHost}
                    onChange={(e) => setTestSmtpHost(e.target.value)}
                    className="w-full bg-canvas border border-field-border rounded-xs px-3 py-1.5 text-[13px] text-ink focus:border-ink outline-none"
                    placeholder="smtp.hostinger.com"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    className="w-full bg-canvas border border-field-border rounded-xs px-3 py-1.5 text-[13px] text-ink focus:border-ink outline-none"
                    placeholder="Subject line"
                  />
                </div>
              </div>

              {/* Generated Code Display */}
              <div className="relative">
                <div className="flex items-center justify-between bg-ink-deep text-white/70 px-4 py-2 rounded-t-xs text-[12px] font-mono border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-accent-gold-soft" />
                    <span>Payload & Client Request ({activeLang})</span>
                  </div>
                  <button
                    onClick={() => copySnippet(getCodeSnippet())}
                    className="hover:text-white flex items-center gap-1.5 text-[11px] text-accent-gold-soft transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="bg-[#1a1816] text-[#e8e6e3] p-4 rounded-b-xs text-[12px] font-mono overflow-x-auto leading-relaxed border border-t-0 border-hairline">
                  {getCodeSnippet()}
                </pre>
              </div>
            </div>

            {/* Step 4: Tracking & Telemetry */}
            <div className="bg-canvas border border-hairline rounded-md p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[12px]">
                  04
                </span>
                <h3 className="font-semibold text-ink text-[16px]">Track Delivery Receipts & MTA Confirmation</h3>
              </div>
              <p className="text-[13px] text-ink/70">
                Every dispatch immediately returns a tracking Job ID (e.g. <code className="font-mono text-[12px]">vms_617d1ed146aa</code>).
                You can inspect the status in your developer logs or programmatically via GET request:
              </p>
              <div className="bg-canvas-tint p-3 rounded-xs border border-hairline font-mono text-[12px] text-ink flex items-center justify-between">
                <span>GET https://veyron-gateway.duckdns.org/api/v1/emails/&#123;jobId&#125;</span>
                <span className="text-band-forest font-semibold">250 2.0.0 OK Delivered</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: SELF-HOST BLUEPRINT GUIDE */}
        {guideMode === 'selfhost' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Step 1: Specs */}
            <div className="bg-canvas border border-hairline rounded-md p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[12px]">
                  01
                </span>
                <h3 className="font-semibold text-ink text-[17px]">Hardware & Cloud VM Target</h3>
              </div>
              <p className="text-[13px] text-ink/70">
                Veyron is engineered specifically to run inside an <b>Oracle Cloud Always-Free VM</b> (~1 GB RAM) or any $3-5/mo VPS.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[12px] font-mono">
                <div className="bg-canvas-tint p-3 rounded-xs border border-hairline">
                  <div className="text-disabled-ink mb-1">Memory Allocation</div>
                  <div className="text-ink font-bold">128 MB Redis MaxMemory</div>
                </div>
                <div className="bg-canvas-tint p-3 rounded-xs border border-hairline">
                  <div className="text-disabled-ink mb-1">Container Stack</div>
                  <div className="text-ink font-bold">API + Worker + Redis 7</div>
                </div>
                <div className="bg-canvas-tint p-3 rounded-xs border border-hairline">
                  <div className="text-disabled-ink mb-1">Operating System</div>
                  <div className="text-ink font-bold">Ubuntu 22.04 LTS</div>
                </div>
              </div>
            </div>

            {/* Step 2: Commands Blueprint */}
            <div className="bg-canvas border border-hairline rounded-md p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[12px]">
                  02
                </span>
                <h3 className="font-semibold text-ink text-[17px]">One-Click Docker Compose Deployment</h3>
              </div>
              <p className="text-[13px] text-ink/70">
                Clone the repository on your VM, set your master encryption keys, and launch the multi-container stack:
              </p>
              <div className="bg-ink-deep text-white/90 p-4 rounded-xs text-[12px] font-mono space-y-2 border border-hairline">
                <div className="text-disabled-ink"># 1. Clone repository</div>
                <div className="text-accent-gold-soft">git clone https://github.com/vitthalganeshshivane/Veyron-smtp-gateway.git && cd Veyron-smtp-gateway</div>
                <div className="text-disabled-ink pt-2"># 2. Configure environment</div>
                <div className="text-accent-gold-soft">cp .env.example .env && nano .env</div>
                <div className="text-disabled-ink pt-2"># 3. Launch Docker containers in detached mode</div>
                <div className="text-accent-gold-soft">docker compose up -d --build</div>
              </div>
            </div>

            {/* Step 3: Caddy SSL */}
            <div className="bg-canvas border border-hairline rounded-md p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[12px]">
                  03
                </span>
                <h3 className="font-semibold text-ink text-[17px]">Zero-Config HTTPS with Caddy Reverse Proxy</h3>
              </div>
              <p className="text-[13px] text-ink/70">
                Install Caddy to automatically procure and maintain Let's Encrypt TLS certificates over HTTP/2:
              </p>
              <div className="bg-[#1a1816] text-[#e8e6e3] p-4 rounded-xs text-[12px] font-mono border border-hairline">
                <div className="text-disabled-ink"># /etc/caddy/Caddyfile</div>
                <div>your-gateway.duckdns.org &#123;</div>
                <div className="pl-4 text-accent-gold-soft">reverse_proxy 127.0.0.1:3000</div>
                <div>&#125;</div>
              </div>
            </div>

            {/* Step 4: Health Check */}
            <div className="bg-canvas border border-hairline rounded-md p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent-gold/20 text-ink font-mono font-bold flex items-center justify-center text-[12px]">
                  04
                </span>
                <h3 className="font-semibold text-ink text-[17px]">Verify Public Health Status</h3>
              </div>
              <p className="text-[13px] text-ink/70">
                Execute a health check to verify MongoDB Atlas and Redis connections are live:
              </p>
              <div className="bg-canvas-tint p-3 rounded-xs border border-hairline font-mono text-[12px] text-ink flex items-center justify-between">
                <span>curl -i https://your-gateway.duckdns.org/api/v1/health</span>
                <span className="text-band-forest font-semibold">&#123; "status": "healthy", "redis": "connected" &#125;</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. COST & ROI COMPARISON MATRIX */}
      <section className="bg-canvas border border-hairline rounded-md p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-serif text-[24px] text-ink font-normal">Economic & Architectural Comparison</h2>
          <div className="w-8 h-1 bg-accent-gold mt-1.5 mb-2"></div>
          <p className="text-[13px] text-ink/70">
            How Veyron SMTP Gateway stacks up against traditional proprietary transactional providers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-hairline bg-canvas-tint text-ink font-semibold">
                <th className="p-3.5">Metric / Feature</th>
                <th className="p-3.5 text-brand-mark font-bold">Veyron SMTP Gateway</th>
                <th className="p-3.5 text-disabled-ink">SendGrid</th>
                <th className="p-3.5 text-disabled-ink">Resend</th>
                <th className="p-3.5 text-disabled-ink">Mailgun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              <tr>
                <td className="p-3.5 font-medium text-ink">Monthly Base Cost</td>
                <td className="p-3.5 font-bold text-band-forest">$0.00 (Self-Host or Free VM)</td>
                <td className="p-3.5 text-ink/70">$34.95 / mo</td>
                <td className="p-3.5 text-ink/70">$20.00 / mo</td>
                <td className="p-3.5 text-ink/70">$35.00 / mo</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-ink">Serverless Port Block Bypass</td>
                <td className="p-3.5 font-bold text-band-forest">Built-in HTTPS Relay</td>
                <td className="p-3.5 text-ink/70">REST API only</td>
                <td className="p-3.5 text-ink/70">REST API only</td>
                <td className="p-3.5 text-ink/70">REST API only</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-ink">Use Existing Domain Mailbox (Hostinger/Google)</td>
                <td className="p-3.5 font-bold text-band-forest">Native Dynamic SMTP</td>
                <td className="p-3.5 text-ink/70">No (Proprietary IP pools)</td>
                <td className="p-3.5 text-ink/70">No (Proprietary IP pools)</td>
                <td className="p-3.5 text-ink/70">No (Proprietary IP pools)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-ink">In-Memory Encryption</td>
                <td className="p-3.5 font-bold text-band-forest">AES-256-GCM</td>
                <td className="p-3.5 text-ink/70">Cloud Vendor Stored</td>
                <td className="p-3.5 text-ink/70">Cloud Vendor Stored</td>
                <td className="p-3.5 text-ink/70">Cloud Vendor Stored</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-ink">HTML / CSS Preservation</td>
                <td className="p-3.5 font-bold text-band-forest">100% Strict Byte-for-Byte</td>
                <td className="p-3.5 text-ink/70">Template parsing rules</td>
                <td className="p-3.5 text-ink/70">React Email focus</td>
                <td className="p-3.5 text-ink/70">MIME alteration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. ENGINEERING DEEP-DIVE CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-canvas border border-hairline rounded-md p-6 space-y-3">
          <div className="w-9 h-9 rounded-full bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
            <Lock className="w-4 h-4 text-brand-mark" />
          </div>
          <h3 className="font-semibold text-ink text-[16px]">AES-256-GCM Credential Shield</h3>
          <p className="text-[13px] text-ink/70 leading-relaxed">
            Dynamic SMTP passwords sent in API payloads are encrypted in-memory before entering BullMQ.
            Plaintext secrets are never stored in Redis or written to disk logs.
          </p>
        </div>

        <div className="bg-canvas border border-hairline rounded-md p-6 space-y-3">
          <div className="w-9 h-9 rounded-full bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
            <ShieldCheck className="w-4 h-4 text-link" />
          </div>
          <h3 className="font-semibold text-ink text-[16px]">SSRF Protection Guard</h3>
          <p className="text-[13px] text-ink/70 leading-relaxed">
            Remote attachment URLs undergo DNS pre-resolution and are strictly forbidden from connecting
            to loopback addresses, RFC 1918 private subnets, or AWS metadata IP ranges.
          </p>
        </div>

        <div className="bg-canvas border border-hairline rounded-md p-6 space-y-3">
          <div className="w-9 h-9 rounded-full bg-canvas-warm border border-hairline flex items-center justify-center text-ink">
            <RefreshCw className="w-4 h-4 text-band-forest" />
          </div>
          <h3 className="font-semibold text-ink text-[16px]">Exponential Backoff & Fail-Stop</h3>
          <p className="text-[13px] text-ink/70 leading-relaxed">
            Intelligently distinguishes transient network/greylisting errors (retrying with exponential backoff)
            from permanent 5xx mailbox errors, preserving server IP reputation.
          </p>
        </div>
      </section>

      {/* 6. ENGINEERING AUDIT & TECHNICAL DOUBTS FAQ */}
      <section className="bg-canvas border border-hairline rounded-md p-6 sm:p-8 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-canvas-tint border border-hairline rounded-xs text-[11px] font-mono text-ink mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-band-forest" />
            <span>ARCHITECTURE AUDIT & FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="font-serif text-[24px] text-ink font-normal">Technical Deep-Dive & Production Safeguards</h2>
          <div className="w-8 h-1 bg-accent-gold mt-1.5 mb-2"></div>
          <p className="text-[13px] text-ink/70">
            Crucial verification details regarding deliverability, authentication alignment, duplicate prevention, and privilege boundaries.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Does Veyron preserve sender authentication (SPF, DKIM, and DMARC)?',
              a: 'Yes, 100%. Because Veyron connects to your genuine domain SMTP server (e.g., Hostinger, Google Workspace, AWS SES) using authenticated credentials, the actual delivery to the destination MTA (Gmail/Outlook) is made directly from your provider’s authorized mail server IPs. Your domain’s SPF records already authorize these IPs, and your provider signs the email with your domain’s DKIM key. DMARC aligns cleanly because the From header matches the authenticated mailbox. If you pre-sign with custom DKIM, Veyron’s rawMime mode forwards the payload byte-for-byte without header alteration.'
            },
            {
              q: 'Could the fallback mechanism or queue retries accidentally send duplicate emails?',
              a: 'No. Account selection occurs strictly at API ingestion time. Once a job enters the queue, it is locked to that assigned account; Veyron never dynamically switches to a secondary SMTP account mid-flight or on timeout. To prevent duplicate submissions over flaky networks, Veyron supports the Idempotency-Key HTTP header. Furthermore, BullMQ uses Redis atomic locks with a 40-second lock window (lockDuration) so only a single worker stream can process an email at a time. The job is marked sent only when the upstream SMTP server returns an explicit 250 OK acknowledgment.'
            },
            {
              q: 'How reliable is the BullMQ worker in a 1 GB RAM cloud VM production environment?',
              a: 'The stack is tuned specifically for low-resource environments. Redis 7 is capped at 128 MB maxmemory with noeviction policy, ensuring the OS never runs out of memory. The BullMQ worker runs in an independent Docker container with process supervision (restart: unless-stopped). It features graceful shutdown handling for SIGTERM/SIGINT, which pauses worker polling, awaits the completion of in-flight deliveries, closes the Redis connection, and disconnects MongoDB before exiting.'
            },
            {
              q: 'Do existing registered users have legitimate administrator privileges?',
              a: 'No, privileges are strictly segregated. Master administrators exist in a separate admins collection (bootstrapped with ADMIN_INITIAL_EMAIL) with role: "superadmin". Standard registered developers exist in the users collection with role: "user". All administrative routes (/api/v1/users, /api/v1/smtp-accounts, /api/v1/system/health) are guarded by authenticateAdmin middleware which rejects non-admin users with HTTP 403 Forbidden. Regular users can only access their own API keys and logs.'
            },
            {
              q: 'Is a weekly digest triggered automatically and how are recipients selected?',
              a: 'Veyron is a pure transactional relay infrastructure and queue engine, not a marketing or newsletter SaaS. It has no automated cron jobs that compose or trigger weekly digests. If your client application (like a CRM or SaaS) generates a weekly summary, your application handles recipient selection and dispatches each message to Veyron’s /api/v1/emails/send or /api/v1/emails/bulk endpoint.'
            },
            {
              q: 'Do HTML email templates introduce dynamic rendering edge cases or dependency risks?',
              a: 'No, because Veyron enforces a strict Zero-Content-Modification Policy. Veyron does not run server-side template engines (no Handlebars, Mustache, or React-Email in the backend). Your applications send pre-rendered HTML/CSS or raw MIME, completely eliminating template parsing crashes, unescaped syntax errors, or missing library dependencies. In addition, all remote attachment URLs are validated against SSRF attacks.'
            }
          ].map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-hairline rounded-xs overflow-hidden transition-colors bg-canvas"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-canvas-tint transition-colors"
                >
                  <span className="font-medium text-[14px] text-ink flex items-center gap-2.5">
                    <span className="font-mono text-disabled-ink text-[12px]">0{index + 1}.</span>
                    <span>{item.q}</span>
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-disabled-ink shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-ink' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-1 pb-4 bg-canvas-tint text-[13px] text-ink/80 leading-relaxed border-t border-hairline">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ShowcasePage;
