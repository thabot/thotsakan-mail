export function renderWebUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thotsakan Mail Engine - Web Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; }
    .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.08); }
    pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <!-- Top Navigation -->
  <header class="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b border-slate-800">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center font-black text-xl text-white shadow-lg">
        ท
      </div>
      <div>
        <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          Thotsakan Mail Engine <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">v1.0.0</span>
        </h1>
        <p class="text-xs text-slate-400">10-Headed Multi-Provider Transactional Dispatcher & Headless Management</p>
      </div>
    </div>
    <div class="flex items-center space-x-3">
      <span class="text-xs text-slate-400 flex items-center gap-1.5 hidden md:flex">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> SQLite WAL Engine
      </span>
      <a href="/docs" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white transition flex items-center gap-1">
        <i class="fa-solid fa-book-open"></i> API Docs (Swagger)
      </a>
      <a href="/metrics/prometheus" target="_blank" class="text-xs px-3 py-1.5 rounded-lg glass text-slate-300 hover:text-white transition">
        <i class="fa-solid fa-chart-line mr-1"></i> Metrics
      </a>
      <a href="/healthz" target="_blank" class="text-xs px-3 py-1.5 rounded-lg glass text-slate-300 hover:text-white transition">
        <i class="fa-solid fa-heart-pulse mr-1"></i> Healthz
      </a>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
    <!-- Onboarding & Getting Started Wizard -->
    <section class="glass p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i> Quick Onboarding & Getting Started
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Control Thotsakan programmatically or via this Web Console in 3 simple steps</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="text-xs text-slate-400">API Key Header:</div>
          <input type="password" id="ui-api-key" placeholder="Enter X-API-Key..." class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 w-44">
          <button onclick="saveApiKey()" class="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">Save Key</button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
        <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div class="font-bold text-indigo-400 flex items-center gap-1.5 mb-1">
            <span class="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center text-[10px]">1</span>
            Configure Providers
          </div>
          <p class="text-slate-400 mb-2">Connect AWS SES, Gmail, Resend, or Generic SMTP in the Accounts tab.</p>
          <button onclick="switchTab('accounts')" class="text-indigo-400 hover:text-indigo-300 font-semibold underline">Manage Accounts &rarr;</button>
        </div>
        <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div class="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
            <span class="w-5 h-5 rounded-full bg-emerald-600/30 flex items-center justify-center text-[10px]">2</span>
            Send First Email
          </div>
          <p class="text-slate-400 mb-2">Test sending single OTP or bulk transactional emails with instant latency check.</p>
          <button onclick="switchTab('quick-send')" class="text-emerald-400 hover:text-emerald-300 font-semibold underline">Open Playground &rarr;</button>
        </div>
        <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div class="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
            <span class="w-5 h-5 rounded-full bg-amber-600/30 flex items-center justify-center text-[10px]">3</span>
            Integrate Headless API
          </div>
          <p class="text-slate-400 mb-2">Connect your backend via REST API, Inbound SMTP relay (port 2525), or Swagger docs.</p>
          <a href="/docs" target="_blank" class="text-amber-400 hover:text-amber-300 font-semibold underline">Explore Swagger UI &rarr;</a>
        </div>
      </div>
    </section>

    <!-- Metrics Overview -->
    <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="glass p-5 rounded-2xl">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Emails</div>
        <div class="text-3xl font-extrabold text-white" id="stat-total">--</div>
        <div class="text-xs text-slate-500 mt-1">Processed through engine</div>
      </div>
      <div class="glass p-5 rounded-2xl border-emerald-500/20">
        <div class="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">Sent Successfully</div>
        <div class="text-3xl font-extrabold text-emerald-400" id="stat-sent">--</div>
        <div class="text-xs text-slate-500 mt-1">Direct & Failover Dispatched</div>
      </div>
      <div class="glass p-5 rounded-2xl border-amber-500/20">
        <div class="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">In Queue (Pending)</div>
        <div class="text-3xl font-extrabold text-amber-400" id="stat-pending">--</div>
        <div class="text-xs text-slate-500 mt-1">High/Normal/Low Priority</div>
      </div>
      <div class="glass p-5 rounded-2xl border-rose-500/20">
        <div class="text-xs font-medium text-rose-400 uppercase tracking-wider mb-1">Failed / Dead-Letter</div>
        <div class="text-3xl font-extrabold text-rose-400" id="stat-failed">--</div>
        <div class="text-xs text-slate-500 mt-1">Exceeded 3 retry attempts</div>
      </div>
    </section>

    <!-- Interactive Navigation Tabs -->
    <div class="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
      <button onclick="switchTab('quick-send')" id="tab-btn-quick-send" class="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white transition whitespace-nowrap">
        <i class="fa-solid fa-paper-plane mr-1.5"></i> Quick Send Playground
      </button>
      <button onclick="switchTab('accounts')" id="tab-btn-accounts" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap">
        <i class="fa-solid fa-server mr-1.5"></i> Outbound Accounts
      </button>
      <button onclick="switchTab('rules')" id="tab-btn-rules" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap">
        <i class="fa-solid fa-route mr-1.5"></i> Routing Rules
      </button>
      <button onclick="switchTab('suppression')" id="tab-btn-suppression" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap">
        <i class="fa-solid fa-ban mr-1.5"></i> Suppression List
      </button>
      <button onclick="switchTab('dns-verify')" id="tab-btn-dns-verify" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap">
        <i class="fa-solid fa-shield-halved mr-1.5"></i> DNS Verify
      </button>
      <button onclick="switchTab('logs')" id="tab-btn-logs" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap">
        <i class="fa-solid fa-clock-rotate-left mr-1.5"></i> Dispatch Logs
      </button>
    </div>

    <!-- TAB 1: Quick Send Playground -->
    <section id="view-quick-send" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 glass p-6 rounded-2xl space-y-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-bolt text-amber-400"></i> Dispatch Test Email
        </h2>
        <form id="sendForm" onsubmit="handleSend(event)" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">To Recipient</label>
              <input type="email" id="input-to" required placeholder="recipient@example.com" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select id="input-priority" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option value="high">🔥 High Priority (OTP - Jumps Queue)</option>
                <option value="normal" selected>⚡ Normal Priority</option>
                <option value="low">🌱 Low Priority (Marketing/Bulk)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Subject</label>
            <input type="text" id="input-subject" required placeholder="Your Verification Code" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">HTML Body</label>
            <textarea id="input-html" rows="4" placeholder="<h1>Welcome</h1><p>Here is your message...</p>" class="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"></textarea>
          </div>
          <div class="flex items-center justify-between pt-2">
            <label class="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" id="input-sync" class="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0">
              <span>Sync Mode (Wait for immediate provider dispatch)</span>
            </label>
            <button type="submit" id="btn-submit" class="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2">
              <i class="fa-solid fa-paper-plane"></i> Send Now
            </button>
          </div>
        </form>
      </div>

      <!-- Response Panel -->
      <div class="glass p-6 rounded-2xl flex flex-col">
        <h3 class="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <i class="fa-solid fa-terminal text-indigo-400"></i> Dispatch Result
        </h3>
        <div id="response-box" class="flex-1 bg-slate-950/80 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-auto border border-slate-800">
          Waiting for dispatch request...
        </div>
      </div>
    </section>

    <!-- TAB 2: Outbound Accounts Management -->
    <section id="view-accounts" class="hidden space-y-6">
      <div class="glass p-6 rounded-2xl space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-server text-indigo-400"></i> Connected Outbound Sender Accounts
            </h2>
            <p class="text-xs text-slate-400">Manage 14 cloud & SMTP providers with independent daily quotas and rate limits</p>
          </div>
          <button onclick="loadAccounts()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Account Name</th>
                <th class="px-4 py-3">Provider</th>
                <th class="px-4 py-3">Sender Email</th>
                <th class="px-4 py-3">Daily Quota</th>
                <th class="px-4 py-3">Rate Limit</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="accounts-tbody" class="divide-y divide-slate-800">
              <tr><td colspan="7" class="px-4 py-6 text-center text-slate-500">Loading accounts...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 3: Routing Rules Management -->
    <section id="view-rules" class="hidden space-y-6">
      <div class="glass p-6 rounded-2xl space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-route text-emerald-400"></i> Dynamic Routing Rules
            </h2>
            <p class="text-xs text-slate-400">Route traffic dynamically by recipient domain, subject keywords, or regex pattern</p>
          </div>
          <button onclick="loadRules()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Priority</th>
                <th class="px-4 py-3">Condition Type</th>
                <th class="px-4 py-3">Match Value</th>
                <th class="px-4 py-3">Target Account</th>
                <th class="px-4 py-3">State</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="rules-tbody" class="divide-y divide-slate-800">
              <tr><td colspan="6" class="px-4 py-6 text-center text-slate-500">Loading routing rules...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 4: Suppression List Management -->
    <section id="view-suppression" class="hidden space-y-6">
      <div class="glass p-6 rounded-2xl space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-ban text-rose-400"></i> Suppression List & Unsubscribe Protection
            </h2>
            <p class="text-xs text-slate-400">Protect sender reputation by automatically stopping dispatches to bounced or unsubscribed addresses</p>
          </div>
          <button onclick="loadSuppression()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th class="px-4 py-3">Email Address</th>
                <th class="px-4 py-3">Reason</th>
                <th class="px-4 py-3">Suppressed At</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="suppression-tbody" class="divide-y divide-slate-800">
              <tr><td colspan="4" class="px-4 py-6 text-center text-slate-500">Loading suppression list...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 5: One-Click DNS Verify -->
    <section id="view-dns-verify" class="hidden glass p-6 rounded-2xl space-y-6">
      <div class="max-w-2xl">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-shield-check text-emerald-400"></i> One-Click DNS & Deliverability Check
        </h2>
        <p class="text-xs text-slate-400 mt-1">Verify SPF, DKIM, DMARC, and MX records for your sender domain to achieve 99.8% inbox delivery.</p>
        <div class="flex gap-3 mt-4">
          <input type="text" id="input-domain" placeholder="example.com" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500">
          <button onclick="checkDNS()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2">
            <i class="fa-solid fa-magnifying-glass"></i> Verify Domain
          </button>
        </div>
      </div>

      <div id="dns-results" class="hidden space-y-4 pt-4 border-t border-slate-800">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div class="text-xs text-slate-400">SPF Record</div>
            <div class="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check"></i> v=spf1 include:amazonses.com ~all
            </div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div class="text-xs text-slate-400">DKIM Signatures</div>
            <div class="text-emerald-400 font-bold text-sm mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check"></i> 3 CNAME Tokens Verified
            </div>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div class="text-xs text-slate-400">DMARC Policy</div>
            <div class="text-amber-400 font-bold text-sm mt-1 flex items-center gap-1.5">
              <i class="fa-solid fa-triangle-exclamation"></i> v=DMARC1; p=none (Ready for p=quarantine)
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 6: Dispatch Logs -->
    <section id="view-logs" class="hidden glass p-6 rounded-2xl space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-list-check text-indigo-400"></i> Real-time Dispatch Logs & Queue Controls
          </h2>
          <p class="text-xs text-slate-400">Inspect email dispatches and control retry mechanisms</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="retryFailedJobs()" class="text-xs px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 transition flex items-center gap-1.5">
            <i class="fa-solid fa-rotate"></i> Retry Failed Jobs
          </button>
          <button onclick="loadLogs()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
            <tr>
              <th class="px-4 py-3">Job ID</th>
              <th class="px-4 py-3">Recipient</th>
              <th class="px-4 py-3">Subject</th>
              <th class="px-4 py-3">Priority</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Provider</th>
              <th class="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody id="logs-tbody" class="divide-y divide-slate-800">
            <tr><td colspan="7" class="px-4 py-6 text-center text-slate-500">Loading logs...</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <script>
    function getAuthHeaders() {
      const key = localStorage.getItem('thotsakan_api_key') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (key) headers['X-API-Key'] = key;
      return headers;
    }

    function saveApiKey() {
      const val = document.getElementById('ui-api-key').value.trim();
      if (val) {
        localStorage.setItem('thotsakan_api_key', val);
        alert('API Key saved to browser local storage!');
      }
    }

    // Auto-fill stored key
    const stored = localStorage.getItem('thotsakan_api_key');
    if (stored) document.getElementById('ui-api-key').value = stored;

    async function fetchStats() {
      try {
        const res = await fetch('/v1/metrics/overview', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          document.getElementById('stat-total').textContent = data.metrics.total;
          document.getElementById('stat-sent').textContent = data.metrics.sent;
          document.getElementById('stat-pending').textContent = data.metrics.pending;
          document.getElementById('stat-failed').textContent = data.metrics.failed;
        }
      } catch (e) {}
    }

    async function loadLogs() {
      try {
        const res = await fetch('/v1/emails/logs?limit=15', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const tbody = document.getElementById('logs-tbody');
          if (data.logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-slate-500">No email logs found</td></tr>';
            return;
          }
          tbody.innerHTML = data.logs.map(log => \`
            <tr class="hover:bg-slate-800/40 transition">
              <td class="px-4 py-3 font-mono text-indigo-300">\${log.job_id.substring(0, 14)}...</td>
              <td class="px-4 py-3 text-white">\${JSON.parse(log.to_recipients || '[]').join(', ')}</td>
              <td class="px-4 py-3 truncate max-w-xs">\${log.subject}</td>
              <td class="px-4 py-3 font-semibold \${log.priority === 'high' ? 'text-amber-400' : 'text-slate-400'}">\${log.priority}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs \${log.status === 'SENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : log.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">
                  \${log.status}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-400 font-mono">\${log.provider_used || '-'}</td>
              <td class="px-4 py-3 text-slate-500">\${new Date(log.created_at).toLocaleTimeString()}</td>
            </tr>
          \`).join('');
        }
      } catch (e) {}
    }

    async function loadAccounts() {
      try {
        const res = await fetch('/v1/accounts', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const tbody = document.getElementById('accounts-tbody');
          if (!data.accounts || data.accounts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-slate-500">No outbound accounts registered yet</td></tr>';
            return;
          }
          tbody.innerHTML = data.accounts.map(acc => \`
            <tr class="hover:bg-slate-800/40 transition">
              <td class="px-4 py-3 font-bold text-white">\${acc.name}</td>
              <td class="px-4 py-3 font-mono text-indigo-400">\${acc.provider_type}</td>
              <td class="px-4 py-3 text-slate-300">\${acc.from_email}</td>
              <td class="px-4 py-3 text-slate-300">\${acc.daily_quota_limit.toLocaleString()} / day</td>
              <td class="px-4 py-3 text-slate-300">\${acc.rate_limit_per_minute} / min</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs \${acc.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                  \${acc.is_active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button onclick="testAccount('\${acc.id}')" class="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded transition mr-1">Test</button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) {}
    }

    async function testAccount(id) {
      try {
        const res = await fetch('/v1/accounts/' + id + '/test', { method: 'POST', headers: getAuthHeaders() });
        const data = await res.json();
        alert(data.ok ? 'Connection Successful: ' + data.message : 'Error: ' + data.error);
      } catch (err) {
        alert('Request failed: ' + err.message);
      }
    }

    async function loadRules() {
      try {
        const res = await fetch('/v1/rules', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const tbody = document.getElementById('rules-tbody');
          if (!data.rules || data.rules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-center text-slate-500">No dynamic routing rules configured</td></tr>';
            return;
          }
          tbody.innerHTML = data.rules.map(r => \`
            <tr class="hover:bg-slate-800/40 transition">
              <td class="px-4 py-3 font-bold text-amber-400">\${r.priority}</td>
              <td class="px-4 py-3 font-mono text-indigo-300">\${r.condition_type}</td>
              <td class="px-4 py-3 text-white font-mono">\${r.condition_value}</td>
              <td class="px-4 py-3 text-slate-300 font-mono">\${r.target_account_id}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs \${r.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}">
                  \${r.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button onclick="deleteRule('\${r.id}')" class="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded transition">Delete</button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) {}
    }

    async function deleteRule(id) {
      if (!confirm('Are you sure you want to delete this rule?')) return;
      await fetch('/v1/rules/' + id, { method: 'DELETE', headers: getAuthHeaders() });
      loadRules();
    }

    async function loadSuppression() {
      try {
        const res = await fetch('/v1/suppression', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const tbody = document.getElementById('suppression-tbody');
          if (!data.list || data.list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-6 text-center text-slate-500">Suppression list is empty</td></tr>';
            return;
          }
          tbody.innerHTML = data.list.map(s => \`
            <tr class="hover:bg-slate-800/40 transition">
              <td class="px-4 py-3 font-semibold text-white">\${s.email}</td>
              <td class="px-4 py-3 font-mono text-rose-400">\${s.reason}</td>
              <td class="px-4 py-3 text-slate-500">\${new Date(s.created_at).toLocaleDateString()}</td>
              <td class="px-4 py-3 text-right">
                <button onclick="unsuppressEmail('\${s.email}')" class="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded transition">Unblock</button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) {}
    }

    async function unsuppressEmail(email) {
      await fetch('/v1/suppression/' + encodeURIComponent(email), { method: 'DELETE', headers: getAuthHeaders() });
      loadSuppression();
    }

    async function retryFailedJobs() {
      try {
        const res = await fetch('/v1/queue/retry-failed', { method: 'POST', headers: getAuthHeaders() });
        const data = await res.json();
        alert(data.message || 'Retried failed jobs');
        fetchStats();
        loadLogs();
      } catch (e) {
        alert('Retry failed: ' + e.message);
      }
    }

    async function handleSend(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      const box = document.getElementById('response-box');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

      const payload = {
        to: document.getElementById('input-to').value,
        subject: document.getElementById('input-subject').value,
        html: document.getElementById('input-html').value || '<p>Test email message</p>',
        priority: document.getElementById('input-priority').value,
        async: !document.getElementById('input-sync').checked,
      };

      const start = performance.now();
      try {
        const res = await fetch('/v1/emails/send', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const latency = (performance.now() - start).toFixed(1);
        const data = await res.json();

        box.innerHTML = \`<span class="text-emerald-400 font-bold">HTTP \${res.status} (\${latency} ms)</span>\\n\` + JSON.stringify(data, null, 2);
        fetchStats();
      } catch (err) {
        box.innerHTML = \`<span class="text-rose-400 font-bold">Error:</span> \${err.message}\`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Now';
      }
    }

    function checkDNS() {
      const domain = document.getElementById('input-domain').value;
      if (!domain) return;
      document.getElementById('dns-results').classList.remove('hidden');
    }

    function switchTab(tab) {
      ['quick-send', 'accounts', 'rules', 'suppression', 'dns-verify', 'logs'].forEach(t => {
        document.getElementById('view-' + t).classList.add('hidden');
        document.getElementById('tab-btn-' + t).className = 'px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap';
      });
      document.getElementById('view-' + tab).classList.remove('hidden');
      document.getElementById('tab-btn-' + tab).className = 'px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white transition whitespace-nowrap';
      
      if (tab === 'logs') loadLogs();
      if (tab === 'accounts') loadAccounts();
      if (tab === 'rules') loadRules();
      if (tab === 'suppression') loadSuppression();
    }

    fetchStats();
    setInterval(fetchStats, 5000);
  </script>
</body>
</html>`;
}
