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
          <div class="flex items-center gap-3">
            <button onclick="switchTab('accounts')" class="text-indigo-400 hover:text-indigo-300 font-semibold underline">Manage Accounts &rarr;</button>
            <button onclick="switchTab('guides')" class="text-slate-400 hover:text-indigo-300 underline">Provider Guides &rarr;</button>
          </div>
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
      <button onclick="switchTab('guides')" id="tab-btn-guides" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap">
        <i class="fa-solid fa-book-bookmark mr-1.5"></i> Provider Guides
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
            <button onclick="switchTab('guides')" class="text-xs px-3.5 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 hover:text-white font-semibold transition flex items-center gap-1.5 shadow-md">
              <i class="fa-solid fa-book-bookmark"></i> Provider Guides
            </button>
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
            <div class="flex items-center justify-between mb-1">
              <label class="text-slate-300 font-semibold">Provider Type *</label>
              <button type="button" onclick="openCurrentProviderGuide()" class="text-[11px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 font-medium">
                <i class="fa-solid fa-book-open"></i> ดูคู่มือของเจ้านี้
              </button>
            </div>
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

    <!-- TAB: Provider Guides & Configuration (14 Email Providers) -->
    <section id="view-guides" class="hidden space-y-6">
      <div class="glass p-6 rounded-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-book-bookmark text-indigo-400"></i> คู่มือการเชื่อมต่อผู้ให้บริการแต่ละเจ้า (Provider Setup Guides)
            </h2>
            <p class="text-xs text-slate-400 mt-1">เลือกผู้ให้บริการด้านล่างเพื่อดูขั้นตอนการขอ API Key / OAuth Credentials, ค่าพารามิเตอร์ที่แนะนำ และตัวอย่าง JSON Payload พร้อมกดเชื่อมต่อได้ทันที</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="switchTab('accounts'); openAddAccountModal();" class="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20">
              <i class="fa-solid fa-plus"></i> Connect New Account
            </button>
          </div>
        </div>

        <!-- Provider Sub-Tabs Pill Navigation (14 Providers) -->
        <div class="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
          <button onclick="switchProviderGuideTab('ms-graph')" id="guide-tab-btn-ms-graph" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition whitespace-nowrap flex items-center gap-2 border border-indigo-400/50">
            <i class="fa-brands fa-microsoft text-blue-400"></i> Microsoft 365
          </button>
          <button onclick="switchProviderGuideTab('gmail')" id="guide-tab-btn-gmail" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-brands fa-google text-red-400"></i> Google Workspace
          </button>
          <button onclick="switchProviderGuideTab('aws-ses')" id="guide-tab-btn-aws-ses" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-brands fa-aws text-amber-400"></i> AWS SES
          </button>
          <button onclick="switchProviderGuideTab('resend')" id="guide-tab-btn-resend" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-paper-plane text-emerald-400"></i> Resend
          </button>
          <button onclick="switchProviderGuideTab('sendgrid')" id="guide-tab-btn-sendgrid" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-envelope-open-text text-cyan-400"></i> SendGrid
          </button>
          <button onclick="switchProviderGuideTab('postmark')" id="guide-tab-btn-postmark" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-box-archive text-yellow-400"></i> Postmark
          </button>
          <button onclick="switchProviderGuideTab('brevo')" id="guide-tab-btn-brevo" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-paperclip text-blue-400"></i> Brevo
          </button>
          <button onclick="switchProviderGuideTab('mailgun')" id="guide-tab-btn-mailgun" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-crosshairs text-rose-400"></i> Mailgun
          </button>
          <button onclick="switchProviderGuideTab('mailersend')" id="guide-tab-btn-mailersend" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-paper-plane text-violet-400"></i> MailerSend
          </button>
          <button onclick="switchProviderGuideTab('zeptomail')" id="guide-tab-btn-zeptomail" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-bolt text-teal-400"></i> ZeptoMail
          </button>
          <button onclick="switchProviderGuideTab('scaleway')" id="guide-tab-btn-scaleway" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-cloud text-purple-400"></i> Scaleway
          </button>
          <button onclick="switchProviderGuideTab('sparkpost')" id="guide-tab-btn-sparkpost" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-fire text-orange-400"></i> SparkPost
          </button>
          <button onclick="switchProviderGuideTab('mandrill')" id="guide-tab-btn-mandrill" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-brands fa-mailchimp text-amber-300"></i> Mandrill
          </button>
          <button onclick="switchProviderGuideTab('generic-smtp')" id="guide-tab-btn-generic-smtp" class="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <i class="fa-solid fa-server text-slate-300"></i> Generic SMTP
          </button>
        </div>

        <!-- 1. Microsoft 365 Guide Pane -->
        <div id="guide-pane-ms-graph" class="space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-blue-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl border border-blue-500/30">
                <i class="fa-brands fa-microsoft"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Microsoft 365 / Exchange Online <span class="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">providerType: ms-graph</span>
                </h3>
                <p class="text-xs text-slate-400">Microsoft Graph API (/v1.0/me/sendMail) พร้อมระบบ Autonomous Token Refresh & Sentbox Auto-Purge</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Azure Portal
              </a>
              <button onclick="quickConnectProvider('ms-graph')" class="text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect MS 365
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ App Credentials จาก Azure Entra ID
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://portal.azure.com/" target="_blank" class="text-indigo-400 underline font-semibold">Azure Portal</a> &rarr; <strong>Microsoft Entra ID</strong> &rarr; <strong>App registrations</strong> &rarr; กด <strong>+ New registration</strong></li>
                <li>ตั้งชื่อแอปพลิเคชัน (เช่น <code class="text-indigo-300">Thotsakan-Mailer</code>) &rarr; เลือก Account type เป็น <strong>Single tenant</strong> &rarr; กด <strong>Register</strong></li>
                <li>คัดลอกค่า <code class="text-amber-300 font-mono">Application (client) ID</code> และ <code class="text-amber-300 font-mono">Directory (tenant) ID</code> จากหน้า Overview</li>
                <li>ไปที่ <strong>API permissions</strong> &rarr; <strong>+ Add a permission</strong> &rarr; <strong>Microsoft Graph</strong> &rarr; เลือก <strong>Application permissions</strong> &rarr; ติ๊กเลือก <code class="text-emerald-400 font-mono">Mail.Send</code> &rarr; กด <strong>Grant admin consent</strong> (สำคัญมาก)</li>
                <li>ไปที่ <strong>Certificates & secrets</strong> &rarr; แถบ <strong>Client secrets</strong> &rarr; <strong>+ New client secret</strong> &rarr; กำหนดอายุ (แนะนำ 24 เดือน) &rarr; คัดลอกค่าในช่อง <code class="text-amber-300 font-mono">Value</code> ทันที</li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-indigo-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-ms-graph')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-ms-graph" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed">{
  "name": "Microsoft 365 Production",
  "providerType": "ms-graph",
  "fromEmail": "sender@yourcompany.onmicrosoft.com",
  "fromName": "Corporate Notification",
  "dailyQuotaLimit": 10000,
  "rateLimitPerMinute": 30,
  "credentials": {
    "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "clientId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "clientSecret": "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
  },
  "secretExpiresAt": "2028-09-20T00:00:00Z"
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-500/20">
                <i class="fa-solid fa-circle-info text-indigo-400 mr-1"></i> ระบบจะขอและหมุนเวียน Bearer Token ให้อัตโนมัติ (Autonomous Refresh) ทุก 60 นาที ไม่ต้องต่ออายุเอง
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Google Workspace / Gmail Guide Pane -->
        <div id="guide-pane-gmail" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-red-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl border border-red-500/30">
                <i class="fa-brands fa-google"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Google Workspace / Gmail API <span class="text-[11px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono">providerType: gmail</span>
                </h3>
                <p class="text-xs text-slate-400">Gmail REST API v1 (/gmail/v1/users/me/messages/send) ผ่าน OAuth2 Offline Refresh Token</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> GCP Console
              </a>
              <button onclick="quickConnectProvider('gmail')" class="text-xs px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect Google
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ OAuth2 Client ID & Refresh Token
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://console.cloud.google.com/" target="_blank" class="text-emerald-400 underline font-semibold">Google Cloud Console</a> &rarr; เปิดใช้งาน <strong>Gmail API</strong> ใน Library</li>
                <li>ไปที่ <strong>OAuth consent screen</strong> &rarr; กำหนด User Type &rarr; เพิ่ม Scope: <code class="text-emerald-400 font-mono">https://www.googleapis.com/auth/gmail.send</code></li>
                <li>ไปที่ <strong>Credentials</strong> &rarr; <strong>+ Create Credentials</strong> &rarr; เลือก <strong>OAuth client ID</strong> (Web application) &rarr; คัดลอก <code class="text-amber-300 font-mono">Client ID</code> และ <code class="text-amber-300 font-mono">Client Secret</code></li>
                <li>เข้าสู่ <a href="https://developers.google.com/oauthplayground/" target="_blank" class="text-emerald-400 underline font-semibold">OAuth 2.0 Playground</a> &rarr; ตั้งค่าใช้ Client ID & Secret ของคุณ &rarr; ขอสิทธิ์ <code class="text-emerald-400 font-mono">gmail.send</code> &rarr; คัดลอก <code class="text-amber-300 font-mono">Refresh token</code></li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-emerald-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-gmail')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-gmail" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">{
  "name": "Google Workspace Sender",
  "providerType": "gmail",
  "fromEmail": "sender@yourcompany.com",
  "fromName": "Support Team",
  "dailyQuotaLimit": 2000,
  "rateLimitPerMinute": 60,
  "credentials": {
    "clientId": "xxxx.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-xxxx",
    "refreshToken": "1//04xxxx"
  }
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
                <i class="fa-solid fa-shield-halved text-emerald-400 mr-1"></i> โควต้ามาตรฐานของ Google Workspace คือ 2,000 ฉบับ/วัน ต่อบัญชี
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Amazon AWS SES Guide Pane -->
        <div id="guide-pane-aws-ses" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-amber-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl border border-amber-500/30">
                <i class="fa-brands fa-aws"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Amazon Web Services Simple Email Service <span class="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">providerType: aws-ses</span>
                </h3>
                <p class="text-xs text-slate-400">AWS SES High-Throughput REST v2 Dispatcher พร้อมความจุระดับแสนฉบับต่อวัน</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://console.aws.amazon.com/ses/" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> AWS Console
              </a>
              <button onclick="quickConnectProvider('aws-ses')" class="text-xs px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect AWS SES
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ IAM Access Key & SES Setup
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://console.aws.amazon.com/iam/" target="_blank" class="text-amber-400 underline font-semibold">AWS IAM Console</a> &rarr; <strong>Users</strong> &rarr; กด <strong>Create user</strong> (เช่น <code class="text-amber-300">thotsakan-mailer</code>)</li>
                <li>กำหนด Policy อนุญาตสิทธิ์ <code class="text-emerald-400 font-mono">ses:SendRawEmail</code> และ <code class="text-emerald-400 font-mono">ses:SendEmail</code></li>
                <li>ไปที่แถบ <strong>Security credentials</strong> &rarr; <strong>Create access key</strong> &rarr; คัดลอก <code class="text-amber-300 font-mono">Access Key ID</code> และ <code class="text-amber-300 font-mono">Secret Access Key</code></li>
                <li>เข้าสู่ <strong>Amazon SES Console</strong> &rarr; <strong>Verified identities</strong> &rarr; กด <strong>Create identity</strong> เพื่อยืนยัน Domain หรือ Sender Email</li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-amber-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-aws-ses')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-aws-ses" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed">{
  "name": "AWS SES Primary Cluster",
  "providerType": "aws-ses",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Core Service",
  "dailyQuotaLimit": 50000,
  "rateLimitPerMinute": 300,
  "credentials": {
    "apiKey": "AKIAIOSFODNN7EXAMPLE",
    "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "ap-southeast-1"
  }
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20">
                <i class="fa-solid fa-bolt text-amber-400 mr-1"></i> รองรับ AWS SES ทุก Region (ap-southeast-1, us-east-1, eu-west-1, ฯลฯ)
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Resend Guide Pane -->
        <div id="guide-pane-resend" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/30">
                <i class="fa-solid fa-paper-plane"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Resend <span class="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">providerType: resend</span>
                </h3>
                <p class="text-xs text-slate-400">Developer-first Modern Email Platform พร้อม REST API ที่รวดเร็ว</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://resend.com/overview" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Resend Dashboard
              </a>
              <button onclick="quickConnectProvider('resend')" class="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect Resend
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ Resend API Key
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://resend.com/overview" target="_blank" class="text-emerald-400 underline font-semibold">Resend Dashboard</a> &rarr; ไปที่เมนู <strong>API Keys</strong></li>
                <li>คลิกปุ่ม <strong>Create API Key</strong></li>
                <li>ตั้งชื่อ Key &rarr; เลือกสิทธิ์ <strong>Full access</strong> หรือ <strong>Sending access</strong></li>
                <li>คัดลอก API Key ที่ขึ้นต้นด้วย <code class="text-amber-300 font-mono">re_...</code></li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-emerald-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-resend')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-resend" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">{
  "name": "Resend Provider",
  "providerType": "resend",
  "fromEmail": "notification@yourdomain.com",
  "fromName": "System Alert",
  "dailyQuotaLimit": 10000,
  "rateLimitPerMinute": 60,
  "credentials": {
    "apiKey": "re_123456789_abcdef"
  }
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
                <i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i> รองรับ DKIM/SPF DNS Verify อัตโนมัติในเมนู DNS Verify ของเรา
              </div>
            </div>
          </div>
        </div>

        <!-- 5. SendGrid Guide Pane -->
        <div id="guide-pane-sendgrid" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-cyan-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl border border-cyan-500/30">
                <i class="fa-solid fa-envelope-open-text"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Twilio SendGrid <span class="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">providerType: sendgrid</span>
                </h3>
                <p class="text-xs text-slate-400">Enterprise High-Scale Delivery Platform พร้อม Mail Send REST API v3</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> SendGrid Keys
              </a>
              <button onclick="quickConnectProvider('sendgrid')" class="text-xs px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect SendGrid
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ SendGrid API Key
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://app.sendgrid.com/" target="_blank" class="text-cyan-400 underline font-semibold">SendGrid Dashboard</a> &rarr; เมนู <strong>Settings</strong> &rarr; <strong>API Keys</strong></li>
                <li>คลิกปุ่ม <strong>Create API Key</strong></li>
                <li>เลือกสิทธิ์เป็น <strong>Restricted Access</strong> &rarr; ในหมวด <strong>Mail Send</strong> ให้เลื่อนเป็น <strong>Full Access</strong></li>
                <li>คลิก <strong>Create & View</strong> &rarr; คัดลอก API Key ที่ขึ้นต้นด้วย <code class="text-amber-300 font-mono">SG....</code></li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-cyan-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-sendgrid')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-sendgrid" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">{
  "name": "SendGrid Primary",
  "providerType": "sendgrid",
  "fromEmail": "support@yourdomain.com",
  "fromName": "Customer Care",
  "dailyQuotaLimit": 25000,
  "rateLimitPerMinute": 200,
  "credentials": {
    "apiKey": "SG.xxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
  }
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/20">
                <i class="fa-solid fa-lock text-cyan-400 mr-1"></i> SendGrid API Key ถูกเข้ารหัสผ่าน AES-256-GCM ปลอดภัยในระดับ Hardware-bound
              </div>
            </div>
          </div>
        </div>

        <!-- 6. Postmark Guide Pane -->
        <div id="guide-pane-postmark" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-yellow-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xl border border-yellow-500/30">
                <i class="fa-solid fa-box-archive"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  ActiveCampaign Postmark <span class="text-[11px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-mono">providerType: postmark</span>
                </h3>
                <p class="text-xs text-slate-400">Industry leader ด้านอัตราการตก Inbox สูงสุดด้วย Server API Token</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://account.postmarkapp.com/servers" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Postmark Servers
              </a>
              <button onclick="quickConnectProvider('postmark')" class="text-xs px-3.5 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect Postmark
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-yellow-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ Server API Token
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://account.postmarkapp.com/" target="_blank" class="text-yellow-400 underline font-semibold">Postmark Console</a> &rarr; เลือก Server ของคุณ (เช่น Transactional Server)</li>
                <li>ไปที่แถบ <strong>API Tokens</strong></li>
                <li>คัดลอกค่า <strong>Server API Token</strong> (รหัส GUID)</li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-yellow-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-postmark')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-postmark" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-yellow-300 overflow-x-auto leading-relaxed">{
  "name": "Postmark Transactional",
  "providerType": "postmark",
  "fromEmail": "service@yourdomain.com",
  "fromName": "Postmark Dispatcher",
  "dailyQuotaLimit": 50000,
  "rateLimitPerMinute": 300,
  "credentials": {
    "apiKey": "25f18c64-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-yellow-950/30 p-2.5 rounded-lg border border-yellow-500/20">
                <i class="fa-solid fa-gauge-high text-yellow-400 mr-1"></i> เหมาะสำหรับอีเมลสำคัญระดับ OTP และ Password Reset
              </div>
            </div>
          </div>
        </div>

        <!-- 7. Brevo Guide Pane -->
        <div id="guide-pane-brevo" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-blue-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl border border-blue-500/30">
                <i class="fa-solid fa-paperclip"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Brevo (formerly Sendinblue) <span class="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">providerType: brevo</span>
                </h3>
                <p class="text-xs text-slate-400">European Transactional Email Relay พร้อม REST API v3</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://app.brevo.com/settings/keys/api" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Brevo API
              </a>
              <button onclick="quickConnectProvider('brevo')" class="text-xs px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect Brevo
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-blue-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ Brevo API Key
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://app.brevo.com/" target="_blank" class="text-blue-400 underline font-semibold">Brevo Dashboard</a> &rarr; คลิกชื่อโปรไฟล์มุมขวาบน &rarr; เลือก <strong>SMTP & API</strong></li>
                <li>ไปที่แถบ <strong>API keys</strong></li>
                <li>คลิก <strong>Generate a new API key</strong> &rarr; ตั้งชื่อ Key</li>
                <li>คัดลอก API Key ที่ขึ้นต้นด้วย <code class="text-amber-300 font-mono">xkeysib-...</code></li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-blue-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-brevo')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-brevo" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto leading-relaxed">{
  "name": "Brevo Mail Service",
  "providerType": "brevo",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Brevo System",
  "dailyQuotaLimit": 9000,
  "rateLimitPerMinute": 60,
  "credentials": {
    "apiKey": "xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-blue-950/30 p-2.5 rounded-lg border border-blue-500/20">
                <i class="fa-solid fa-globe text-blue-400 mr-1"></i> รองรับมาตรฐานความปลอดภัย GDPR เต็มรูปแบบ
              </div>
            </div>
          </div>
        </div>

        <!-- 8. Mailgun Guide Pane -->
        <div id="guide-pane-mailgun" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-rose-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl border border-rose-500/30">
                <i class="fa-solid fa-crosshairs"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Mailgun by Sinch <span class="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">providerType: mailgun</span>
                </h3>
                <p class="text-xs text-slate-400">High-volume Transactional Mail REST API พร้อมระบบ Domain Routing</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://app.mailgun.com/settings/api_security" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Mailgun Security
              </a>
              <button onclick="quickConnectProvider('mailgun')" class="text-xs px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect Mailgun
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ Mailgun API Key & Domain
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://app.mailgun.com/" target="_blank" class="text-rose-400 underline font-semibold">Mailgun Dashboard</a> &rarr; ไปที่เมนู <strong>API Security</strong></li>
                <li>ในหมวด <strong>Mailgun API keys</strong> &rarr; คัดลอก <strong>Primary API key</strong> (ขึ้นต้นด้วย <code class="text-amber-300 font-mono">key-...</code>)</li>
                <li>ไปที่เมนู <strong>Sending</strong> &rarr; <strong>Domains</strong> &rarr; ตรวจสอบชื่อ Domain หรือ Host สำหรับส่ง</li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-rose-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-mailgun')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-mailgun" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto leading-relaxed">{
  "name": "Mailgun Cluster",
  "providerType": "mailgun",
  "fromEmail": "info@mg.yourdomain.com",
  "fromName": "Mailgun Dispatcher",
  "dailyQuotaLimit": 10000,
  "rateLimitPerMinute": 100,
  "credentials": {
    "apiKey": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "host": "mg.yourdomain.com"
  }
}</pre>
              </div>
              <div class="text-[11px] text-slate-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-500/20">
                <i class="fa-solid fa-circle-info text-rose-400 mr-1"></i> รองรับทั้ง US (api.mailgun.net) และ EU Region (api.eu.mailgun.net)
              </div>
            </div>
          </div>
        </div>

        <!-- 9. MailerSend Guide Pane -->
        <div id="guide-pane-mailersend" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-violet-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center text-xl border border-violet-500/30">
                <i class="fa-solid fa-paper-plane"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  MailerSend <span class="text-[11px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">providerType: mailersend</span>
                </h3>
                <p class="text-xs text-slate-400">Transactional Email API for Developers by MailerLite Team</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://app.mailersend.com/api-tokens" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> MailerSend Tokens
              </a>
              <button onclick="quickConnectProvider('mailersend')" class="text-xs px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect MailerSend
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-violet-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ API Token
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://www.mailersend.com/" target="_blank" class="text-violet-400 underline font-semibold">MailerSend Dashboard</a> &rarr; ไปที่เมนู <strong>API Tokens</strong></li>
                <li>คลิกปุ่ม <strong>Create Token</strong></li>
                <li>กำหนดสิทธิ์ <strong>Email: Full access</strong> &rarr; คัดลอก Token ที่ขึ้นต้นด้วย <code class="text-amber-300 font-mono">mlsn....</code></li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-violet-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-mailersend')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-mailersend" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-violet-300 overflow-x-auto leading-relaxed">{
  "name": "MailerSend Secondary",
  "providerType": "mailersend",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "MailerSend Relay",
  "dailyQuotaLimit": 10000,
  "rateLimitPerMinute": 60,
  "credentials": {
    "apiKey": "mlsn.xxxxxxxxxxxxxxxxxxxx"
  }
}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 10. ZeptoMail Guide Pane -->
        <div id="guide-pane-zeptomail" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-teal-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-xl border border-teal-500/30">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  ZeptoMail by Zoho <span class="text-[11px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">providerType: zeptomail</span>
                </h3>
                <p class="text-xs text-slate-400">Dedicated Transactional Email Service จาก Zoho Corporation</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://zeptomail.zoho.com/" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> ZeptoMail Console
              </a>
              <button onclick="quickConnectProvider('zeptomail')" class="text-xs px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect ZeptoMail
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-teal-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ Send Mail Token
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://zeptomail.zoho.com/" target="_blank" class="text-teal-400 underline font-semibold">ZeptoMail Console</a> &rarr; เลือก Mail Agent ของคุณ</li>
                <li>ไปที่แถบ <strong>Setup Info</strong></li>
                <li>ในหมวด <strong>Send Mail Token</strong> ให้คัดลอกค่า <code class="text-amber-300 font-mono">Zoho-enczapikey</code> (เช่น <code class="text-teal-300">PHtE6r0...</code>)</li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-teal-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-zeptomail')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-zeptomail" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-teal-300 overflow-x-auto leading-relaxed">{
  "name": "ZeptoMail Agent",
  "providerType": "zeptomail",
  "fromEmail": "sender@yourdomain.com",
  "fromName": "Zoho Agent",
  "dailyQuotaLimit": 10000,
  "rateLimitPerMinute": 60,
  "credentials": {
    "apiKey": "PHtE6r0xxxxxx"
  }
}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 11. Scaleway Guide Pane -->
        <div id="guide-pane-scaleway" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-purple-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl border border-purple-500/30">
                <i class="fa-solid fa-cloud"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Scaleway Transactional Email <span class="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">providerType: scaleway</span>
                </h3>
                <p class="text-xs text-slate-400">European Cloud Infrastructure Transactional Email Service</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://console.scaleway.com/iam/api-keys" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Scaleway Keys
              </a>
              <button onclick="quickConnectProvider('scaleway')" class="text-xs px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect Scaleway
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ API Secret Key
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://console.scaleway.com/" target="_blank" class="text-purple-400 underline font-semibold">Scaleway Console</a> &rarr; เมนู <strong>IAM</strong> &rarr; <strong>API Keys</strong></li>
                <li>คลิก <strong>Generate API Key</strong></li>
                <li>คัดลอกค่า <code class="text-amber-300 font-mono">Secret Key</code></li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-purple-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-scaleway')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-scaleway" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-purple-300 overflow-x-auto leading-relaxed">{
  "name": "Scaleway Transactional",
  "providerType": "scaleway",
  "fromEmail": "noreply@yourdomain.com",
  "fromName": "Scaleway Service",
  "dailyQuotaLimit": 10000,
  "rateLimitPerMinute": 60,
  "credentials": {
    "apiKey": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 12. SparkPost Guide Pane -->
        <div id="guide-pane-sparkpost" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-orange-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl border border-orange-500/30">
                <i class="fa-solid fa-fire"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  SparkPost / MessageBird <span class="text-[11px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 font-mono">providerType: sparkpost</span>
                </h3>
                <p class="text-xs text-slate-400">Enterprise High-Capacity Transmissions Engine</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://app.sparkpost.com/account/api-keys" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> SparkPost Keys
              </a>
              <button onclick="quickConnectProvider('sparkpost')" class="text-xs px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect SparkPost
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-orange-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ SparkPost API Key
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://app.sparkpost.com/" target="_blank" class="text-orange-400 underline font-semibold">SparkPost Dashboard</a> &rarr; เมนู <strong>Configuration</strong> &rarr; <strong>API Keys</strong></li>
                <li>คลิก <strong>Create API Key</strong></li>
                <li>กำหนดสิทธิ์ <strong>Transmissions: Read/Write</strong> &rarr; คัดลอก Key</li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-orange-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-sparkpost')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-sparkpost" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-orange-300 overflow-x-auto leading-relaxed">{
  "name": "SparkPost Cluster",
  "providerType": "sparkpost",
  "fromEmail": "sender@yourdomain.com",
  "fromName": "SparkPost Relay",
  "dailyQuotaLimit": 20000,
  "rateLimitPerMinute": 120,
  "credentials": {
    "apiKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 13. Mandrill Guide Pane -->
        <div id="guide-pane-mandrill" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-amber-500/30">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl border border-amber-500/30">
                <i class="fa-brands fa-mailchimp"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Mandrill by Mailchimp <span class="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">providerType: mandrill</span>
                </h3>
                <p class="text-xs text-slate-400">Mailchimp Transactional Email API for high-volume apps</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a href="https://mandrillapp.com/settings" target="_blank" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Mandrill Settings
              </a>
              <button onclick="quickConnectProvider('mandrill')" class="text-xs px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect Mandrill
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ขั้นตอนการขอ Mandrill API Key
              </h4>
              <ol class="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li>เข้าสู่ <a href="https://mandrillapp.com/" target="_blank" class="text-amber-400 underline font-semibold">Mailchimp Transactional Dashboard</a> &rarr; เมนู <strong>Settings</strong> &rarr; <strong>API Keys</strong></li>
                <li>คลิกปุ่ม <strong>+ New API Key</strong></li>
                <li>คัดลอกค่า Key ที่ขึ้นต้นด้วย <code class="text-amber-300 font-mono">md-...</code></li>
              </ol>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-amber-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-mandrill')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-mandrill" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed">{
  "name": "Mandrill Primary",
  "providerType": "mandrill",
  "fromEmail": "contact@yourdomain.com",
  "fromName": "Mandrill Dispatcher",
  "dailyQuotaLimit": 15000,
  "rateLimitPerMinute": 80,
  "credentials": {
    "apiKey": "md-xxxxxxxxxxxxxxxxxxxx"
  }
}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 14. Generic SMTP Relay Guide Pane -->
        <div id="guide-pane-generic-smtp" class="hidden space-y-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-600">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center text-xl border border-slate-600">
                <i class="fa-solid fa-server"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  Generic SMTP Relay <span class="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">providerType: generic-smtp</span>
                </h3>
                <p class="text-xs text-slate-400">เชื่อมต่อ On-Premise Mail Server, Postfix, Exim, Zimbra หรือเซิร์ฟเวอร์ SMTP ภายในองค์กร</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="quickConnectProvider('generic-smtp')" class="text-xs px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition flex items-center gap-1.5 shadow-md">
                <i class="fa-solid fa-plus"></i> Connect SMTP Server
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                <i class="fa-solid fa-list-ol"></i> ข้อมูลที่ต้องเตรียมสำหรับเซิร์ฟเวอร์ SMTP
              </h4>
              <ul class="list-disc list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                <li><strong>Server Host:</strong> Hostname หรือ IP Address ของ Mail Server (เช่น <code class="text-indigo-300">mail.company.com</code>)</li>
                <li><strong>Port:</strong> พอร์ต <code class="text-indigo-300">587</code> (สำหรับ STARTTLS แนะนำ) หรือ <code class="text-indigo-300">465</code> (SSL Direct) หรือ <code class="text-indigo-300">25</code></li>
                <li><strong>Authentication:</strong> Username และ Password หรือ App Specific Password</li>
                <li><strong>TLS/SSL:</strong> รองรับการเชื่อมต่อแบบเข้ารหัส TLS 1.2/1.3 มาตรฐานสากล</li>
              </ul>
            </div>

            <div class="bg-slate-950/70 p-5 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-code text-slate-400"></i> JSON Configuration Payload
                  </h4>
                  <button onclick="copyProviderPayload('code-payload-generic-smtp')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1">
                    <i class="fa-solid fa-copy"></i> Copy JSON
                  </button>
                </div>
                <pre id="code-payload-generic-smtp" class="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">{
  "name": "Corporate Postfix SMTP Relay",
  "providerType": "generic-smtp",
  "fromEmail": "notification@company.com",
  "fromName": "Internal Postfix Relay",
  "dailyQuotaLimit": 20000,
  "rateLimitPerMinute": 100,
  "credentials": {
    "host": "mail.company.com",
    "port": 587,
    "secure": false,
    "user": "smtp_user@company.com",
    "pass": "YourComplexPassword123"
  }
}</pre>
              </div>
            </div>
          </div>
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
        <div class="flex items-center gap-2">
          <button onclick="openLicenseCheckoutModal()" class="text-xs px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20">
            <i class="fa-solid fa-cart-shopping"></i> Buy / Upgrade License (Card & Crypto)
          </button>
          <button onclick="loadLicenseInfo()" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>
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

    <!-- Modal: License Checkout (NOWPayments & Gate.io) -->
    <div id="modal-license-checkout" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Purchase License (NOWPayments)</h3>
              <p class="text-[11px] text-slate-400">Card & Instant Crypto Settlement (Gate.io)</p>
            </div>
          </div>
          <button onclick="closeLicenseCheckoutModal()" class="text-slate-400 hover:text-white transition">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form id="licenseCheckoutForm" onsubmit="initiateLicenseCheckout(event)" class="p-6 space-y-4">
          <!-- Tier Selection -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-2">Select License Tier</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="cursor-pointer border border-slate-800 rounded-xl p-3 bg-slate-950/60 hover:border-indigo-500 transition block relative">
                <input type="radio" name="checkoutTier" value="PRO" checked class="absolute top-3 right-3 text-indigo-600 focus:ring-0">
                <div class="font-bold text-white text-sm">PRO Tier</div>
                <div class="text-emerald-400 font-extrabold text-lg mt-0.5">$49 <span class="text-[10px] text-slate-500 font-normal">/ year</span></div>
                <div class="text-[11px] text-slate-400 mt-1">Single Node • 14 Providers • Template Editor • Failover</div>
              </label>
              <label class="cursor-pointer border border-slate-800 rounded-xl p-3 bg-slate-950/60 hover:border-indigo-500 transition block relative">
                <input type="radio" name="checkoutTier" value="ENTERPRISE" class="absolute top-3 right-3 text-indigo-600 focus:ring-0">
                <div class="font-bold text-white text-sm">ENTERPRISE</div>
                <div class="text-indigo-400 font-extrabold text-lg mt-0.5">$199 <span class="text-[10px] text-slate-500 font-normal">/ year</span></div>
                <div class="text-[11px] text-slate-400 mt-1">Multi-Node Cluster • Custom Rate Limits • Priority Failover</div>
              </label>
            </div>
          </div>

          <!-- Customer Email -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Customer / Organization Email</label>
            <input type="email" id="checkout-email" required placeholder="billing@yourdomain.com" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
          </div>

          <!-- Target Machine ID -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-semibold text-slate-300">Target Machine ID (Auto-Detected)</label>
              <span class="text-[10px] text-emerald-400 font-mono">Bound to Current Node</span>
            </div>
            <input type="text" id="checkout-machine-id" readonly class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-indigo-300 select-all cursor-not-allowed">
          </div>

          <!-- Payment Methods Accepted Badge -->
          <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
            <div class="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <i class="fa-solid fa-shield-check text-emerald-400"></i> Supported Payment Channels:
            </div>
            <div class="text-[10px] text-slate-400 flex flex-wrap items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300"><i class="fa-brands fa-cc-visa text-blue-400 mr-1"></i> Visa / Mastercard</span>
              <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300"><i class="fa-brands fa-apple text-slate-200 mr-1"></i> Apple Pay</span>
              <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300"><i class="fa-brands fa-google text-slate-200 mr-1"></i> Google Pay</span>
              <span class="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">🪙 USDT / USDC (Polygon, BSC)</span>
              <span class="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">⚡ BTC / ETH / SOL & 300+ Coins</span>
            </div>
          </div>

          <!-- Checkout State Display -->
          <div id="checkout-state-box" class="hidden p-3 rounded-xl border font-mono text-xs"></div>

          <!-- Submit Button -->
          <button type="submit" id="btn-proceed-checkout" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20">
            <i class="fa-solid fa-lock"></i> Proceed to Secure Crypto & Card Checkout
          </button>
        </form>
      </div>
    </div>
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

    let checkoutPollTimer = null;

    function openLicenseCheckoutModal() {
      const machineId = document.getElementById('lic-machine-id').textContent.trim();
      if (machineId && machineId !== 'loading...') {
        document.getElementById('checkout-machine-id').value = machineId;
      }
      document.getElementById('modal-license-checkout').classList.remove('hidden');
    }

    function closeLicenseCheckoutModal() {
      document.getElementById('modal-license-checkout').classList.add('hidden');
      if (checkoutPollTimer) {
        clearInterval(checkoutPollTimer);
        checkoutPollTimer = null;
      }
      const stateBox = document.getElementById('checkout-state-box');
      stateBox.classList.add('hidden');
      stateBox.innerHTML = '';
      document.getElementById('btn-proceed-checkout').disabled = false;
    }

    async function initiateLicenseCheckout(e) {
      e.preventDefault();
      const email = document.getElementById('checkout-email').value.trim();
      const machineId = document.getElementById('checkout-machine-id').value.trim();
      const tierInput = document.querySelector('input[name="checkoutTier"]:checked');
      const tier = tierInput ? tierInput.value : 'PRO';

      if (!email) {
        alert('Please enter your email address');
        return;
      }

      const stateBox = document.getElementById('checkout-state-box');
      const btn = document.getElementById('btn-proceed-checkout');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Connecting to NOWPayments Gateway...';

      stateBox.classList.remove('hidden');
      stateBox.className = 'p-3 rounded-xl border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 font-mono text-xs space-y-1.5';
      stateBox.innerHTML = '<div>⏳ Initializing Secure Checkout Session (Crypto & Card)...</div>';

      try {
        // Ops portal URL or local proxy
        const portalUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? 'https://thotsakan-ops.thabot47.workers.dev' 
          : window.location.origin;

        const res = await fetch(portalUrl + '/api/v1/checkout/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier,
            customerEmail: email,
            targetMachineId: machineId || undefined,
            durationDays: 365,
          })
        });

        const data = await res.json();
        if (data.success && data.checkoutUrl) {
          stateBox.innerHTML = \`
            <div class="text-emerald-400 font-bold flex items-center gap-1.5">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Checkout Session Created!
            </div>
            <div class="text-slate-300 text-[11px]">Payment URL opened in new tab. Waiting for on-chain/card confirmation...</div>
            <a href="\${data.checkoutUrl}" target="_blank" class="block text-indigo-400 font-bold underline break-all mt-1">Open Payment Checkout Page</a>
          \`;

          // Open in popup or new tab
          window.open(data.checkoutUrl, '_blank');

          // Start Polling for Confirmation
          btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Awaiting Payment Confirmation...';
          startLicensePaymentPolling(portalUrl, data.paymentId);
        } else {
          stateBox.className = 'p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 font-mono text-xs';
          stateBox.innerHTML = '❌ ' + (data.error || 'Failed to create checkout session');
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> Try Again';
        }
      } catch (err) {
        stateBox.className = 'p-3 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 font-mono text-xs';
        stateBox.innerHTML = '❌ Network Error: ' + err.message;
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> Try Again';
      }
    }

    // Alias for backward compatibility
    const initiateSphereCheckout = initiateLicenseCheckout;

    function startLicensePaymentPolling(portalUrl, paymentId) {
      if (checkoutPollTimer) clearInterval(checkoutPollTimer);

      let attempts = 0;
      checkoutPollTimer = setInterval(async () => {
        attempts++;
        if (attempts > 120) { // 10 minutes timeout
          clearInterval(checkoutPollTimer);
          const stateBox = document.getElementById('checkout-state-box');
          stateBox.innerHTML = '<div class="text-amber-400">⏱️ Checkout session timed out. If you paid, paste the key manually or refresh.</div>';
          return;
        }

        try {
          const res = await fetch(portalUrl + '/api/v1/checkout/status/' + paymentId);
          if (!res.ok) return;
          const data = await res.json();

          if (data.status === 'succeeded' && data.license && data.license.licenseKey) {
            clearInterval(checkoutPollTimer);
            checkoutPollTimer = null;

            const stateBox = document.getElementById('checkout-state-box');
            stateBox.className = 'p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-mono text-xs space-y-1';
            stateBox.innerHTML = \`
              <div class="font-bold text-emerald-400">🎉 Payment Confirmed!</div>
              <div class="text-slate-300">Activating signed license key on this node...</div>
            \`;

            // Auto-Activate Key on local node
            const actRes = await fetch('/v1/license/activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ license_key: data.license.licenseKey })
            });
            const actData = await actRes.json();

            if (actData.success) {
              stateBox.innerHTML += \`
                <div class="text-white font-bold mt-1">✅ License Activated Successfully! (Tier: \${actData.result.tier})</div>
              \`;
              document.getElementById('lic-input-key').value = data.license.licenseKey;
              loadLicenseInfo();
              setTimeout(() => {
                closeLicenseCheckoutModal();
                alert('🎉 Congratulations! Your ' + actData.result.tier + ' license is now ACTIVE!');
              }, 2000);
            }
          }
        } catch (e) {}
      }, 3000);
    }

    const startSpherePaymentPolling = startLicensePaymentPolling;

    const providerGuideList = [
      'ms-graph', 'gmail', 'aws-ses', 'resend', 'sendgrid', 'postmark',
      'brevo', 'mailgun', 'mailersend', 'zeptomail', 'scaleway', 'sparkpost',
      'mandrill', 'generic-smtp'
    ];

    function switchProviderGuideTab(p) {
      providerGuideList.forEach(id => {
        const pane = document.getElementById('guide-pane-' + id);
        const btn = document.getElementById('guide-tab-btn-' + id);
        if (pane) pane.classList.add('hidden');
        if (btn) btn.className = 'px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 transition whitespace-nowrap flex items-center gap-2 border border-slate-800';
      });
      const activePane = document.getElementById('guide-pane-' + p);
      const activeBtn = document.getElementById('guide-tab-btn-' + p);
      if (activePane) activePane.classList.remove('hidden');
      if (activeBtn) activeBtn.className = 'px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition whitespace-nowrap flex items-center gap-2 border border-indigo-400/50';
    }

    function quickConnectProvider(p) {
      switchTab('accounts');
      openAddAccountModal();
      const sel = document.getElementById('acc-provider');
      if (sel) {
        sel.value = p;
        handleProviderChange();
      }
    }

    function openCurrentProviderGuide() {
      const p = document.getElementById('acc-provider').value || 'ms-graph';
      closeAddAccountModal();
      switchTab('guides');
      switchProviderGuideTab(p);
    }

    function copyProviderPayload(elementId) {
      const el = document.getElementById(elementId);
      if (!el) return;
      navigator.clipboard.writeText(el.textContent.trim());
      alert('📋 Configuration payload copied to clipboard!');
    }

    function switchTab(tab) {
      ['quick-send', 'accounts', 'guides', 'rules', 'suppression', 'dns-verify', 'logs', 'license'].forEach(t => {
        const el = document.getElementById('view-' + t);
        const btn = document.getElementById('tab-btn-' + t);
        if (el) el.classList.add('hidden');
        if (btn) btn.className = 'px-4 py-2 text-sm font-semibold rounded-lg text-slate-400 hover:text-white transition whitespace-nowrap';
      });
      const activeEl = document.getElementById('view-' + tab);
      const activeBtn = document.getElementById('tab-btn-' + tab);
      if (activeEl) activeEl.classList.remove('hidden');
      if (activeBtn) activeBtn.className = 'px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white transition whitespace-nowrap';
      
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
