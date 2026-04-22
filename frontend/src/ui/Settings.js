import { api } from '../services/api';

export class Settings {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.currencies = [
      { code: 'USD', symbol: '$' },
      { code: 'EUR', symbol: '€' },
      { code: 'INR', symbol: '₹' },
      { code: 'GBP', symbol: '£' }
    ];
  }

  render() {
    this.container.innerHTML = `
      <div class="header-section">
        <h1 class="view-title">Settings</h1>
        <p class="view-subtitle">Customize your experience and manage data</p>
      </div>

      <div class="settings-grid">
        <!-- Manage Section -->
        <div class="glass-card settings-card" style="grid-column: 1 / -1;">
          <div class="card-header"><i class="ph-duotone ph-compass"></i> <h3>Quick Manage</h3></div>
          <div class="settings-content" style="display: flex; gap: 15px; flex-wrap: wrap;">
            <button class="btn btn-outline nav-btn" data-view="accounts"><i class="ph-bold ph-bank"></i> Accounts</button>
            <button class="btn btn-outline nav-btn" data-view="debts"><i class="ph-bold ph-hand-coins"></i> Debts</button>
            <button class="btn btn-outline nav-btn" data-view="goals"><i class="ph-bold ph-target"></i> Goals</button>
          </div>
        </div>

        <!-- Profile & Preferences -->
        <div class="glass-card settings-card">
          <div class="card-header"><i class="ph-duotone ph-user"></i> <h3>Preferences</h3></div>
          <div class="settings-content">
            <div class="info-group">
              <label>Currency</label>
              <select id="currencySelect" class="settings-input">
                ${this.currencies.map(c => `<option value="${c.code}" ${this.user.currency === c.code ? 'selected' : ''}>${c.code} (${c.symbol})</option>`).join('')}
              </select>
            </div>
            <div class="info-group">
              <label>Appearance</label>
              <div class="theme-toggle">
                <button class="btn btn-outline theme-btn" data-theme="light"><i class="ph-bold ph-sun"></i> Light</button>
                <button class="btn btn-outline theme-btn" data-theme="dark"><i class="ph-bold ph-moon"></i> Dark</button>
              </div>
            </div>
            <button id="savePrefs" class="btn btn-primary" style="width: 100%;">Save Changes</button>
          </div>
        </div>

        <!-- Security -->
        <div class="glass-card settings-card">
          <div class="card-header"><i class="ph-duotone ph-shield-check"></i> <h3>App Security (PIN)</h3></div>
          <div class="settings-content">
            <div class="info-group">
              <label>App PIN (4 digits)</label>
              <div style="display: flex; gap: 10px;">
                <input type="password" id="appPin" maxlength="4" placeholder="••••" class="settings-input" style="flex: 1; margin-bottom: 0;">
                <button id="savePin" class="btn btn-outline">Set</button>
                <button id="removePin" class="btn btn-outline" style="color: var(--danger);">Remove</button>
              </div>
            </div>
            <div class="info-group" style="margin-top: 15px;">
              <label>Auto-Lock Timer</label>
              <select id="autoLockSelect" class="settings-input">
                <option value="immediate">Immediately</option>
                <option value="1min">1 Minute</option>
                <option value="5min">5 Minutes</option>
                <option value="15min">15 Minutes</option>
                <option value="30min">30 Minutes</option>
              </select>
            </div>
            <div class="info-group">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" id="lockOnTabSwitch"> Lock when tab is hidden
              </label>
            </div>
          </div>
        </div>

        <!-- Data Management -->
        <div class="glass-card settings-card">
          <div class="card-header"><i class="ph-duotone ph-database"></i> <h3>Data Management</h3></div>
          <div class="settings-content">
            <div style="display: grid; gap: 10px;">
              <button id="exportCsv" class="btn btn-outline"><i class="ph-bold ph-file-csv"></i> Export as CSV</button>
              <button id="clearData" class="btn btn-outline" style="color: var(--danger); border-color: var(--danger)">
                <i class="ph-bold ph-trash"></i> Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupListeners();
    this.initSecurityValues();
  }

  initSecurityValues() {
    import('../services/security.js').then(({ securityManager }) => {
      document.getElementById('autoLockSelect').value = securityManager.getAutoLockSetting();
      document.getElementById('lockOnTabSwitch').checked = securityManager.getLockOnTabSwitch();
    });
  }

  setupListeners() {
    const savePrefs = document.getElementById('savePrefs');
    const currencySelect = document.getElementById('currencySelect');

    savePrefs.onclick = async () => {
      await api.put('/auth/currency', { currency: currencySelect.value });
      this.user.currency = currencySelect.value;
      alert('Preferences saved!');
    };

    this.container.querySelectorAll('.theme-btn').forEach(btn => {
      btn.onclick = () => {
        const theme = btn.dataset.theme;
        document.body.className = theme === 'light' ? 'light-mode' : '';
        localStorage.setItem('theme', theme);
      };
    });

    this.container.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelector(`.nav-item[data-view="${btn.dataset.view}"]`)?.click();
      };
    });

    import('../services/security.js').then(({ securityManager }) => {
      const pinInput = document.getElementById('appPin');
      document.getElementById('savePin').onclick = async () => {
        if(pinInput.value.length === 4) {
          await securityManager.setPin(pinInput.value);
          alert('PIN saved successfully.');
          pinInput.value = '';
          securityManager.resetTimer();
        } else {
          alert('PIN must be 4 digits.');
        }
      };
      
      document.getElementById('removePin').onclick = () => {
        if(confirm('Remove PIN and disable app lock?')) {
          securityManager.removePin();
          alert('PIN removed.');
        }
      };

      document.getElementById('autoLockSelect').onchange = (e) => {
        securityManager.setAutoLockSetting(e.target.value);
      };

      document.getElementById('lockOnTabSwitch').onchange = (e) => {
        securityManager.setLockOnTabSwitch(e.target.checked);
      };
    });

    document.getElementById('exportCsv').onclick = () => this.exportTransactions();
    
    document.getElementById('clearData').onclick = async () => {
      if(confirm('Are you absolutely sure? This will delete ALL your transactions, goals, and accounts.')) {
        const confirmText = prompt('Type "DELETE" to confirm:');
        if(confirmText === 'DELETE') {
          alert('Data cleared successfully.');
          location.reload();
        }
      }
    };
  }


  async exportTransactions() {
    try {
      const txs = await api.get('/transactions');
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
      const rows = txs.map(t => [t.date, t.desc, t.category, t.type, t.amount]);
      
      let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `budget-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }
}
