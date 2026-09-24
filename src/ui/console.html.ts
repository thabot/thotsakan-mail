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

    <!-- Global Expiry / Warning Banner -->
    <div id="warning-banner" class="hidden glass p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg animate-pulse">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base"></i>
        <span id="warning-banner-text">Warning message here</span>
      </div>
      <button onclick="document.getElementById('warning-banner').classList.add('hidden')" class="text-slate-400 hover:text-white text-xs">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

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
      <button onclick="switchTab('license')" id="tab-btn-license" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap">
        <i class="fa-solid fa-id-card-clip mr-1.5"></i> License & Node Identity
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
          <div class="flex items-center gap-2">
            <button onclick="openAddAccountModal()" class="text-xs px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
              <i class="fa-solid fa-plus"></i> Add Account
            </button>
            <button onclick="loadAccounts()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
              <i class="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
          </div>
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
                <th class="px-4 py-3">Health & Expiry</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="accounts-tbody" class="divide-y divide-slate-800">
              <tr><td colspan="8" class="px-4 py-6 text-center text-slate-500">Loading accounts...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Modal: Add / Connect Email Account -->
    <div id="modal-add-account" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="glass max-w-lg w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-server text-indigo-400"></i> Connect Outbound Sender Account
          </h3>
          <button onclick="closeAddAccountModal()" class="text-slate-400 hover:text-white text-sm">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="form-add-account" onsubmit="handleSaveAccount(event)" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Account Name *</label>
            <input type="text" id="acc-name" required placeholder="e.g. Microsoft 365 Production" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">From Email *</label>
              <input type="email" id="acc-from-email" required placeholder="noreply@yourdomain.com" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
            </div>
            <div>
              <label class="block text-slate-300 font-semibold mb-1">From Name (Display)</label>
              <input type="text" id="acc-from-name" placeholder="System Notification" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
            </div>
          </div>

          <div>
            <label class="block text-slate-300 font-semibold mb-1">Provider Type *</label>
            <select id="acc-provider" onchange="handleProviderChange()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500">
              <option value="ms-graph">Microsoft 365 (MS Graph API - Autonomous Refresh)</option>
              <option value="gmail">Google Workspace / Gmail (OAuth2)</option>
              <option value="aws-ses">Amazon AWS SES</option>
              <option value="resend">Resend</option>
              <option value="sendgrid">SendGrid</option>
              <option value="postmark">Postmark</option>
              <option value="brevo">Brevo (Sendinblue)</option>
              <option value="mailgun">Mailgun</option>
              <option value="generic-smtp">Generic SMTP Relay</option>
              <option value="mailersend">MailerSend</option>
              <option value="zeptomail">ZeptoMail</option>
              <option value="scaleway">Scaleway</option>
              <option value="sparkpost">SparkPost</option>
              <option value="mandrill">Mandrill</option>
            </select>
          </div>

          <!-- Dynamic Container: Microsoft 365 MS Graph -->
          <div id="fields-ms-graph" class="p-4 bg-slate-950/70 rounded-xl border border-indigo-500/30 space-y-3">
            <div class="text-indigo-400 font-bold flex items-center gap-1.5">
              <i class="fa-brands fa-microsoft"></i> Microsoft Entra ID (Azure) App Credentials
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              ใส่ค่าจาก Azure Portal (<code class="text-indigo-300">App registrations</code> พร้อมสิทธิ์ <code class="text-indigo-300">Mail.Send</code>) ระบบจะขอและต่ออายุ Token ให้อัตโนมัติตลอดชีพ
            </p>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">Directory (Tenant) ID *</label>
              <input type="text" id="m365-tenant-id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">Application (Client) ID *</label>
              <input type="text" id="m365-client-id" placeholder="yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">Client Secret Value *</label>
              <input type="password" id="m365-client-secret" placeholder="Secret Value string" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">Client Secret Expiry Date (วันหมดอายุ Secret - สำหรับแจ้งเตือนล่วงหน้า)</label>
              <input type="date" id="m365-secret-expiry" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs">
            </div>
          </div>

          <!-- Dynamic Container: Google Workspace -->
          <div id="fields-gmail" class="hidden p-4 bg-slate-950/70 rounded-xl border border-emerald-500/30 space-y-3">
            <div class="text-emerald-400 font-bold flex items-center gap-1.5">
              <i class="fa-brands fa-google"></i> Google Cloud OAuth2 Credentials
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">OAuth Client ID *</label>
              <input type="text" id="google-client-id" placeholder="xxxx.apps.googleusercontent.com" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">OAuth Client Secret *</label>
              <input type="password" id="google-client-secret" placeholder="GOCSPX-xxxx" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">Offline Refresh Token *</label>
              <input type="password" id="google-refresh-token" placeholder="1//04xxxx" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
          </div>

          <!-- Dynamic Container: AWS SES -->
          <div id="fields-aws-ses" class="hidden p-4 bg-slate-950/70 rounded-xl border border-amber-500/30 space-y-3">
            <div class="text-amber-400 font-bold flex items-center gap-1.5">
              <i class="fa-brands fa-aws"></i> Amazon AWS SES Credentials
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label class="block text-slate-300 mb-1 font-medium">Access Key ID *</label>
                <input type="text" id="aws-key" placeholder="AKIA..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
              </div>
              <div>
                <label class="block text-slate-300 mb-1 font-medium">Region *</label>
                <input type="text" id="aws-region" value="ap-southeast-1" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
              </div>
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium">Secret Access Key *</label>
              <input type="password" id="aws-secret" placeholder="AWS Secret Key" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
          </div>

          <!-- Dynamic Container: Generic SMTP -->
          <div id="fields-generic-smtp" class="hidden p-4 bg-slate-950/70 rounded-xl border border-slate-700 space-y-3">
            <div class="text-slate-200 font-bold flex items-center gap-1.5">
              <i class="fa-solid fa-envelope"></i> SMTP Server Relay Settings
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div class="md:col-span-2">
                <label class="block text-slate-300 mb-1 font-medium">Host *</label>
                <input type="text" id="smtp-host" placeholder="mail.yourdomain.com" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs">
              </div>
              <div>
                <label class="block text-slate-300 mb-1 font-medium">Port *</label>
                <input type="number" id="smtp-port" value="587" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label class="block text-slate-300 mb-1 font-medium">User</label>
                <input type="text" id="smtp-user" placeholder="user@domain.com" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs">
              </div>
              <div>
                <label class="block text-slate-300 mb-1 font-medium">Password</label>
                <input type="password" id="smtp-pass" placeholder="••••••••" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs">
              </div>
            </div>
          </div>

          <!-- Dynamic Container: Standard SaaS API Key (Resend, SendGrid, Postmark, Brevo, Mailgun, ฯลฯ) -->
          <div id="fields-standard-api" class="hidden p-4 bg-slate-950/70 rounded-xl border border-slate-700 space-y-3">
            <div class="text-slate-200 font-bold flex items-center gap-1.5">
              <i class="fa-solid fa-key"></i> SaaS Provider API Key
            </div>
            <div>
              <label class="block text-slate-300 mb-1 font-medium" id="lbl-standard-api-key">API Key *</label>
              <input type="password" id="standard-api-key" placeholder="API Key / Token" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs">
            </div>
          </div>

          <!-- Rate Limits & Quota -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Daily Quota Limit</label>
              <input type="number" id="acc-daily-quota" value="10000" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
            </div>
            <div>
              <label class="block text-slate-300 font-semibold mb-1">Rate Limit (per min)</label>
              <input type="number" id="acc-rate-limit" value="60" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button type="button" onclick="closeAddAccountModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg">
              <i class="fa-solid fa-save"></i> Save Account
            </button>
          </div>
        </form>
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

    <!-- TAB 7: License & Node Identity -->
    <section id="view-license" class="hidden glass p-6 rounded-2xl space-y-6">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-indigo-400"></i> Hybrid License & Node Identity
          </h2>
          <p class="text-xs text-slate-400 mt-1">Cryptographic Ed25519 Hardware-Bound License & Disaster Recovery Control</p>
        </div>
        <button onclick="loadLicenseInfo()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
          <i class="fa-solid fa-arrows-rotate"></i> Refresh
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Active Entitlement Tier</div>
          <div class="text-2xl font-black text-indigo-400" id="lic-tier">--</div>
          <div class="text-xs text-slate-500 mt-1" id="lic-status-badge">Status: --</div>
        </div>
        <div class="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Machine Hardware Binding</div>
          <div class="text-2xl font-black text-emerald-400" id="lic-binding">--</div>
          <div class="text-xs text-slate-500 mt-1" id="lic-binding-sub">Verified against hardware digest</div>
        </div>
        <div class="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
          <div class="text-xs text-slate-400 uppercase tracking-wider mb-1">Cluster Node Capacity</div>
          <div class="text-2xl font-black text-amber-400" id="lic-nodes">--</div>
          <div class="text-xs text-slate-500 mt-1">Coordinated via SQLite WAL</div>
        </div>
      </div>

      <!-- Machine ID Card -->
      <div class="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div class="text-xs font-bold text-slate-300 uppercase tracking-wider">Current Node Machine ID</div>
            <div class="text-xs text-slate-500">Provide this deterministic Machine ID to request a signed enterprise license</div>
          </div>
          <button onclick="copyMachineId()" class="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1.5 self-start md:self-auto font-semibold">
            <i class="fa-solid fa-copy"></i> Copy Machine ID
          </button>
        </div>
        <div class="bg-slate-900 px-4 py-3 rounded-lg border border-slate-800 font-mono text-sm text-indigo-300 select-all" id="lic-machine-id">
          loading...
        </div>
      </div>

      <!-- Activate Key Form -->
      <div class="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
        <div class="text-xs font-bold text-slate-300 uppercase tracking-wider">Apply / Activate License Key</div>
        <div class="text-xs text-slate-500">Paste your signed Ed25519 JWT license token to activate PRO or ENTERPRISE features instantly without restarting</div>
        <div class="flex flex-col md:flex-row gap-2">
          <input type="text" id="lic-input-key" placeholder="eyJhbGciOiJFZERTQSI..." class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500">
          <button onclick="activateLicenseKey()" class="text-xs px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-semibold flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-key"></i> Activate Key
          </button>
        </div>
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

    function openAddAccountModal() {
      document.getElementById('modal-add-account').classList.remove('hidden');
      handleProviderChange();
    }

    function closeAddAccountModal() {
      document.getElementById('modal-add-account').classList.add('hidden');
    }

    function handleProviderChange() {
      const p = document.getElementById('acc-provider').value;
      ['ms-graph', 'gmail', 'aws-ses', 'generic-smtp', 'standard-api'].forEach(id => {
        const el = document.getElementById('fields-' + id);
        if (el) el.classList.add('hidden');
      });

      if (p === 'ms-graph') {
        document.getElementById('fields-ms-graph').classList.remove('hidden');
      } else if (p === 'gmail') {
        document.getElementById('fields-gmail').classList.remove('hidden');
      } else if (p === 'aws-ses') {
        document.getElementById('fields-aws-ses').classList.remove('hidden');
      } else if (p === 'generic-smtp') {
        document.getElementById('fields-generic-smtp').classList.remove('hidden');
      } else {
        document.getElementById('fields-standard-api').classList.remove('hidden');
        document.getElementById('lbl-standard-api-key').textContent = p.toUpperCase() + ' API Key *';
      }
    }

    async function handleSaveAccount(e) {
      e.preventDefault();
      const p = document.getElementById('acc-provider').value;
      const name = document.getElementById('acc-name').value.trim();
      const fromEmail = document.getElementById('acc-from-email').value.trim();
      const fromName = document.getElementById('acc-from-name').value.trim();
      const dailyQuotaLimit = parseInt(document.getElementById('acc-daily-quota').value) || 10000;
      const rateLimitPerMinute = parseInt(document.getElementById('acc-rate-limit').value) || 60;

      let credentials = {};
      let secretExpiresAt = null;

      if (p === 'ms-graph') {
        credentials = {
          tenantId: document.getElementById('m365-tenant-id').value.trim(),
          clientId: document.getElementById('m365-client-id').value.trim(),
          clientSecret: document.getElementById('m365-client-secret').value.trim(),
        };
        const exp = document.getElementById('m365-secret-expiry').value;
        if (exp) secretExpiresAt = new Date(exp).toISOString();
      } else if (p === 'gmail') {
        credentials = {
          clientId: document.getElementById('google-client-id').value.trim(),
          clientSecret: document.getElementById('google-client-secret').value.trim(),
          refreshToken: document.getElementById('google-refresh-token').value.trim(),
        };
      } else if (p === 'aws-ses') {
        credentials = {
          apiKey: document.getElementById('aws-key').value.trim(),
          secretKey: document.getElementById('aws-secret').value.trim(),
          region: document.getElementById('aws-region').value.trim() || 'ap-southeast-1',
        };
      } else if (p === 'generic-smtp') {
        credentials = {
          host: document.getElementById('smtp-host').value.trim(),
          port: parseInt(document.getElementById('smtp-port').value) || 587,
          secure: parseInt(document.getElementById('smtp-port').value) === 465,
          user: document.getElementById('smtp-user').value.trim(),
          pass: document.getElementById('smtp-pass').value.trim(),
        };
      } else {
        credentials = {
          apiKey: document.getElementById('standard-api-key').value.trim(),
        };
      }

      const payload = {
        name,
        providerType: p,
        fromEmail,
        fromName: fromName || undefined,
        dailyQuotaLimit,
        rateLimitPerMinute,
        credentials,
        secretExpiresAt: secretExpiresAt || undefined,
      };

      try {
        const res = await fetch('/v1/accounts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok) {
          alert('🎉 Account Connected Successfully!');
          closeAddAccountModal();
          loadAccounts();
        } else {
          alert('❌ Failed to create account: ' + (data.error || JSON.stringify(data)));
        }
      } catch (err) {
        alert('Request failed: ' + err.message);
      }
    }

    async function loadAccounts() {
      try {
        const res = await fetch('/v1/accounts', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const tbody = document.getElementById('accounts-tbody');
          if (!data.accounts || data.accounts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-slate-500">No outbound accounts registered yet</td></tr>';
            return;
          }

          // Check for any expiring secrets across accounts to show top banner
          const warnings = data.accounts.filter(a => a.warning);
          const banner = document.getElementById('warning-banner');
          if (warnings.length > 0) {
            const first = warnings[0];
            document.getElementById('warning-banner-text').innerHTML = 
              '<strong>คำเตือนการบำรุงรักษา:</strong> บัญชี <em>' + first.name + '</em> (' + first.provider_type + ') - ' + first.warning.message;
            banner.classList.remove('hidden');
          } else {
            banner.classList.add('hidden');
          }

          tbody.innerHTML = data.accounts.map(acc => {
            const healthBadge = acc.warning 
              ? '<span class="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-max"><i class="fa-solid fa-triangle-exclamation"></i> ' + acc.warning.remainingDays + ' วันหมดอายุ</span>'
              : (acc.secret_expires_at 
                ? '<span class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300">Exp: ' + new Date(acc.secret_expires_at).toLocaleDateString() + '</span>' 
                : '<span class="text-slate-500">-</span>');

            return \`
            <tr class="hover:bg-slate-800/40 transition">
              <td class="px-4 py-3 font-bold text-white">\${acc.name}</td>
              <td class="px-4 py-3 font-mono text-indigo-400">\${acc.provider_type}</td>
              <td class="px-4 py-3 text-slate-300">\${acc.from_email}</td>
              <td class="px-4 py-3 text-slate-300">\${acc.daily_quota_limit.toLocaleString()} / day</td>
              <td class="px-4 py-3 text-slate-300">\${acc.rate_limit_per_minute} / min</td>
              <td class="px-4 py-3">\${healthBadge}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs \${acc.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                  \${acc.is_active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button onclick="testAccount('\${acc.id}')" class="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded transition mr-1">Test</button>
              </td>
            </tr>
            \`;
          }).join('');
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

    async function loadLicenseInfo() {
      try {
        const res = await fetch('/v1/license/status');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('lic-tier').textContent = data.tier;
          document.getElementById('lic-status-badge').textContent = 'Status: ' + data.status;
          
          if (data.machine) {
            document.getElementById('lic-machine-id').textContent = data.machine.machine_id;
            document.getElementById('lic-binding').textContent = data.machine.is_bound ? (data.machine.is_valid ? 'Locked & Verified' : 'Mismatch') : 'Unrestricted';
            document.getElementById('lic-binding-sub').textContent = data.machine.is_bound ? (data.machine.is_valid ? 'Hardware digest matches active license' : 'Machine digest does not match!') : 'License valid on any host node';
            document.getElementById('lic-nodes').textContent = (data.machine.instance_limit || 1) + ' Node(s)';
          }
        }
      } catch (e) {}
    }

    function copyMachineId() {
      const text = document.getElementById('lic-machine-id').textContent.trim();
      navigator.clipboard.writeText(text);
      alert('Machine ID copied to clipboard: ' + text);
    }

    async function activateLicenseKey() {
      const key = document.getElementById('lic-input-key').value.trim();
      if (!key) {
        alert('Please paste a license key token');
        return;
      }
      try {
        const res = await fetch('/v1/license/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ license_key: key })
        });
        const data = await res.json();
        if (data.success) {
          alert('🎉 License Activated Successfully! Tier: ' + data.result.tier);
          loadLicenseInfo();
        } else {
          alert('❌ License activation failed: ' + (data.error || 'Invalid or expired key'));
        }
      } catch (err) {
        alert('Activation failed: ' + err.message);
      }
    }

    function switchTab(tab) {
      ['quick-send', 'accounts', 'rules', 'suppression', 'dns-verify', 'logs', 'license'].forEach(t => {
        document.getElementById('view-' + t).classList.add('hidden');
        document.getElementById('tab-btn-' + t).className = 'px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap';
      });
      document.getElementById('view-' + tab).classList.remove('hidden');
      document.getElementById('tab-btn-' + tab).className = 'px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white transition whitespace-nowrap';
      
      if (tab === 'logs') loadLogs();
      if (tab === 'accounts') loadAccounts();
      if (tab === 'rules') loadRules();
      if (tab === 'suppression') loadSuppression();
      if (tab === 'license') loadLicenseInfo();
    }


    fetchStats();
    setInterval(fetchStats, 5000);
  </script>
</body>
</html>`;
}
