import { api } from '../services/api';

export class Accounts {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.accounts = [];
  }

  async render() {
    this.container.innerHTML = `<div class="loader"></div>`;
    try {
      this.accounts = await api.get('/accounts');
      this.renderContent();
    } catch (err) {
      this.container.innerHTML = `<div class="error">Failed to load accounts</div>`;
    }
  }

  renderContent() {
    const totalBalance = this.accounts.reduce((sum, acc) => sum + acc.balance, 0);

    this.container.innerHTML = `
      <div class="header-section">
        <div>
          <h1 class="view-title">My Accounts</h1>
          <p class="view-subtitle">Manage your bank, cash, and credit cards</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="transferBtn" class="btn btn-outline" style="color: var(--primary); border-color: var(--primary);">
            <i class="ph-bold ph-arrows-left-right"></i> Transfer
          </button>
          <button id="addAccountBtn" class="btn btn-primary">
            <i class="ph-bold ph-plus"></i> Add Account
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: minmax(auto, 400px) 1fr; gap: 30px; margin-bottom: 30px; align-items: center;">
        
        <!-- Virtual Credit Card (Phase 5A) -->
        <div style="
          background: linear-gradient(135deg, #1e1b4b, #4338ca);
          border-radius: 20px;
          padding: 25px;
          color: white;
          box-shadow: 0 15px 35px rgba(67, 56, 202, 0.4);
          position: relative;
          overflow: hidden;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <!-- Plastic glare effect -->
          <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(to bottom right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 40%); transform: rotate(30deg); pointer-events: none;"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative;">
            <div style="font-size: 1.2rem; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
              <i class="ph-duotone ph-wallet" style="font-size: 1.5rem; color: #fbbf24;"></i>
              BudgetMaster
            </div>
            <i class="ph-bold ph-wifi-high" style="font-size: 1.5rem; transform: rotate(90deg); opacity: 0.8;"></i>
          </div>
          
          <div style="margin-top: 30px; position: relative;">
            <div style="font-family: 'Courier New', monospace; font-size: 1.6rem; letter-spacing: 3px; margin-bottom: 15px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              **** **** **** 8834
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;">Cardholder Name</div>
                <div style="font-size: 1.1rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">${this.user.username || 'Valued Member'}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;">Valid Thru</div>
                <div style="font-size: 1rem; font-weight: 600; letter-spacing: 1px;">12/28</div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card stat-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <label style="font-size: 1.1rem;">Total Liquid Assets</label>
          <div class="big-num" style="font-size: 3rem; color: var(--primary);">${this.user.currency || '$'}${totalBalance.toLocaleString()}</div>
          <p style="color: var(--text-sub); margin-top: 10px;">Consolidated balance across ${this.accounts.length} connected accounts.</p>
        </div>
      </div>


      <div class="accounts-grid">
        ${this.accounts.length === 0 ? `
          <div class="empty-state">
            <i class="ph-duotone ph-bank"></i>
            <p>No accounts added. Add your first account to track balances!</p>
          </div>
        ` : this.accounts.map(acc => `
          <div class="glass-card account-card" style="border-left: 5px solid ${acc.color}">
            <div class="account-header">
              <span class="account-icon">${acc.icon}</span>
              <div class="account-info">
                <h3>${acc.name}</h3>
                <p>${acc.type.toUpperCase()}</p>
              </div>
              <button class="icon-btn delete-account" data-id="${acc._id}"><i class="ph-bold ph-trash"></i></button>
            </div>
            <div class="account-balance">
              <label>Current Balance</label>
              <div class="balance-num">${this.user.currency || '$'}${acc.balance.toLocaleString()}</div>
            </div>
            <div class="account-actions">
               <button class="btn btn-sm btn-outline edit-balance" data-id="${acc._id}">Update Balance</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('addAccountBtn').onclick = () => this.showAddAccountModal();
    const transferBtn = document.getElementById('transferBtn');
    if(transferBtn) transferBtn.onclick = () => this.showTransferModal();

    
    this.container.querySelectorAll('.delete-account').forEach(btn => {
      btn.onclick = async () => {
        if(confirm('Are you sure? This will not delete transactions associated with this account.')) {
          await api.delete(`/accounts/${btn.dataset.id}`);
          this.render();
        }
      };
    });

    this.container.querySelectorAll('.edit-balance').forEach(btn => {
      btn.onclick = () => this.showUpdateBalanceModal(btn.dataset.id);
    });
  }

  showAddAccountModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Add New Account</h2>
        <form id="accountForm">
          <input type="text" id="accName" placeholder="Account Name (e.g. Chase Bank)" required>
          <select id="accType">
            <option value="bank">Bank Account</option>
            <option value="cash">Cash / Wallet</option>
            <option value="credit">Credit Card</option>
          </select>
          <input type="number" id="accBalance" placeholder="Initial Balance" value="0">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <input type="text" id="accIcon" placeholder="Icon (Emoji)" value="🏦">
            <input type="color" id="accColor" value="#6366f1" style="height: 50px; padding: 5px;">
          </div>
          <div class="modal-btns">
            <button type="button" class="btn btn-outline closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Account</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.closeModal').onclick = () => modal.remove();
    modal.querySelector('#accountForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('accName').value,
        type: document.getElementById('accType').value,
        balance: Number(document.getElementById('accBalance').value),
        icon: document.getElementById('accIcon').value,
        color: document.getElementById('accColor').value
      };
      await api.post('/accounts', data);
      modal.remove();
      this.render();
    };
  }

  showUpdateBalanceModal(id) {
    const acc = this.accounts.find(a => a._id === id);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Update Balance: ${acc.name}</h2>
        <form id="balanceForm">
          <input type="number" id="newBalance" value="${acc.balance}" required>
          <p style="font-size: 0.8rem; color: var(--text-sub); margin-bottom: 20px;">Manual override of account balance.</p>
          <div class="modal-btns">
            <button type="button" class="btn btn-outline closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Update</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.closeModal').onclick = () => modal.remove();
    modal.querySelector('#balanceForm').onsubmit = async (e) => {
      e.preventDefault();
      await api.put(`/accounts/${id}`, { balance: Number(document.getElementById('newBalance').value) });
      modal.remove();
      this.render();
    };
  }

  showTransferModal() {
    if (this.accounts.length < 2) {
      alert("You need at least two accounts to make a transfer.");
      return;
    }
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Transfer Funds</h2>
        <form id="transferForm">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
            <select id="fromAcc" required style="flex: 1;">
              <option value="">From Account...</option>
              ${this.accounts.map(a => `<option value="${a._id}">${a.name} (${this.format(a.balance)})</option>`).join('')}
            </select>
            <i class="ph-bold ph-arrow-right"></i>
            <select id="toAcc" required style="flex: 1;">
              <option value="">To Account...</option>
              ${this.accounts.map(a => `<option value="${a._id}">${a.name}</option>`).join('')}
            </select>
          </div>
          <input type="number" id="transferAmt" placeholder="Amount" required step="0.01">
          <input type="text" id="transferNote" placeholder="Note (optional)">
          <input type="date" id="transferDate" required>
          <div class="modal-btns">
            <button type="button" class="btn btn-outline closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Transfer</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#transferDate').valueAsDate = new Date();

    modal.querySelector('.closeModal').onclick = () => modal.remove();
    modal.querySelector('#transferForm').onsubmit = async (e) => {
      e.preventDefault();
      const from = document.getElementById('fromAcc').value;
      const to = document.getElementById('toAcc').value;
      const amount = Number(document.getElementById('transferAmt').value);
      
      if (from === to) {
        alert("Cannot transfer to the same account.");
        return;
      }

      try {
        // Backend logic for transfer ideally happens in one transaction, but we'll do 2 for now.
        const date = document.getElementById('transferDate').value;
        const note = document.getElementById('transferNote').value || 'Transfer';
        
        await api.post('/transactions', { amount, type: 'expense', category: 'Transfer', desc: `To ${this.accounts.find(a=>a._id===to).name}: ${note}`, accountId: from, date });
        await api.post('/transactions', { amount, type: 'income', category: 'Transfer', desc: `From ${this.accounts.find(a=>a._id===from).name}: ${note}`, accountId: to, date });
        
        const fromAcc = this.accounts.find(a=>a._id===from);
        const toAcc = this.accounts.find(a=>a._id===to);
        await api.put(`/accounts/${from}`, { balance: fromAcc.balance - amount });
        await api.put(`/accounts/${to}`, { balance: toAcc.balance + amount });

        modal.remove();
        this.render();
      } catch(err) {
        alert(err.message);
      }
    };
  }

  format(num) {
    return (this.user.currency || '$') + num.toLocaleString(undefined, { minimumFractionDigits: 2 });
  }
}
