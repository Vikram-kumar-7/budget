import { api } from '../services/api';

export class Debts {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.debts = [];
  }

  async render() {
    this.container.innerHTML = `<div class="loader"></div>`;
    try {
      this.debts = await api.get('/debts');
      this.renderContent();
    } catch (err) {
      this.container.innerHTML = `<div class="error">Failed to load debts</div>`;
    }
  }

  renderContent() {
    const owedToMe = this.debts.filter(d => d.type === 'owed_to_me' && !d.isPaid);
    const iOwe = this.debts.filter(d => d.type === 'i_owe' && !d.isPaid);
    const paid = this.debts.filter(d => d.isPaid);

    const netBalance = owedToMe.reduce((sum, d) => sum + d.amount, 0) - iOwe.reduce((sum, d) => sum + d.amount, 0);

    this.container.innerHTML = `
      <div class="header-section">
        <div>
          <h1 class="view-title">Debt Manager</h1>
          <p class="view-subtitle">Track who owes you and what you owe</p>
        </div>
        <button id="addDebtBtn" class="btn btn-primary">
          <i class="ph-bold ph-plus"></i> Add Entry
        </button>
      </div>

      <div class="stats-row" style="margin-bottom: 20px;">
        <div class="glass-card stat-card" style="text-align: center;">
          <label>Net Balance</label>
          <div class="big-num" style="color: ${netBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${netBalance >= 0 ? '+' : ''}${this.user.currency || '$'}${netBalance.toLocaleString()}
          </div>
        </div>
      </div>

      <div class="tabs" style="display: flex; gap: 10px; margin-bottom: 20px;">
        <button class="btn btn-outline active tab-btn" data-target="oweMeTab" style="flex: 1;">Owe Me 🟢</button>
        <button class="btn btn-outline tab-btn" data-target="iOweTab" style="flex: 1;">I Owe 🔴</button>
      </div>

      <div id="oweMeTab" class="tab-content" style="display: block;">
        <div style="display: grid; gap: 15px;">
          ${this.renderList(owedToMe, 'owed_to_me')}
        </div>
      </div>

      <div id="iOweTab" class="tab-content" style="display: none;">
        <div style="display: grid; gap: 15px;">
          ${this.renderList(iOwe, 'i_owe')}
        </div>
      </div>

      ${paid.length > 0 ? `
        <div style="margin-top: 40px; opacity: 0.6">
          <h2 class="section-title">Settled Recently</h2>
          <div style="display: grid; gap: 15px;">
            ${this.renderList(paid, 'paid', true)}
          </div>
        </div>
      ` : ''}
    `;

    this.setupListeners();

  }

  renderList(list, type, isPaid = false) {
    if (list.length === 0) return `<p class="empty-text" style="text-align: center; color: var(--text-sub);">No entries found</p>`;
    return list.map(debt => {
      const isOverdue = !isPaid && debt.dueDate && new Date(debt.dueDate) < new Date();
      return `
      <div class="glass-card debt-item ${isPaid ? 'paid' : ''}" style="${isOverdue ? 'border: 1px solid var(--danger);' : ''} padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <h3 style="font-size: 1.1rem; margin: 0;">👤 ${debt.person}</h3>
            ${isOverdue ? '<span style="background: var(--danger); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">⚠️ OVERDUE</span>' : ''}
          </div>
        </div>
        <div style="display: flex; gap: 15px; align-items: baseline; margin-bottom: 10px;">
          <div class="amount" style="font-size: 1.5rem; font-weight: bold; color: ${debt.type === 'owed_to_me' ? 'var(--success)' : 'var(--danger)'}">
            ${this.user.currency || '$'}${debt.amount.toLocaleString()}
          </div>
          ${debt.dueDate ? `<span style="color: var(--text-sub); font-size: 0.85rem;">Due: ${new Date(debt.dueDate).toLocaleDateString()}</span>` : ''}
        </div>
        <p style="color: var(--text-sub); font-size: 0.9rem; margin-bottom: 15px;">"${debt.note || 'No note'}"</p>
        
        <div style="display: flex; gap: 10px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
          ${!isPaid ? `
            ${type === 'owed_to_me' ? `
              <button class="btn btn-sm btn-outline remind-btn" data-person="${debt.person}" data-amount="${debt.amount}" data-due="${debt.dueDate}">Remind</button>
            ` : ''}
            <button class="btn btn-sm btn-outline part-pay" data-id="${debt._id}" data-amount="${debt.amount}">Part Pay</button>
            <button class="btn btn-sm btn-primary mark-paid" data-id="${debt._id}">✓ Paid</button>
          ` : '<span class="settled-badge" style="color: var(--text-sub); font-size: 0.9rem;"><i class="ph-bold ph-check-circle"></i> Settled</span>'}
        </div>
      </div>
      `;
    }).join('');
  }

  setupListeners() {
    document.getElementById('addDebtBtn').onclick = () => this.showAddDebtModal();
    
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        this.container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.container.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).style.display = 'block';
      };
    });

    this.container.querySelectorAll('.mark-paid').forEach(btn => {
      btn.onclick = async () => {
        await api.put(`/debts/${btn.dataset.id}`, { isPaid: true });
        this.render();
      };
    });

    this.container.querySelectorAll('.part-pay').forEach(btn => {
      btn.onclick = async () => {
        const amtStr = prompt("Enter amount paid:");
        if(!amtStr) return;
        const amt = parseFloat(amtStr);
        if(isNaN(amt) || amt <= 0) return;
        
        const currentAmt = parseFloat(btn.dataset.amount);
        if (amt >= currentAmt) {
          await api.put(`/debts/${btn.dataset.id}`, { isPaid: true });
        } else {
          await api.put(`/debts/${btn.dataset.id}`, { amount: currentAmt - amt });
        }
        this.render();
      };
    });

    this.container.querySelectorAll('.remind-btn').forEach(btn => {
      btn.onclick = async () => {
        const text = `Hey ${btn.dataset.person}, just a reminder about ${this.user.currency || '$'}${btn.dataset.amount}${btn.dataset.due ? ' from ' + new Date(btn.dataset.due).toLocaleDateString() : ''}. No rush! 😊`;
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Reminder', text });
          } catch(err) {
            console.log('Share canceled', err);
          }
        } else {
          prompt('Copy this message:', text);
        }
      };
    });
  }


  showAddDebtModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Add Debt Entry</h2>
        <form id="debtForm">
          <input type="text" id="person" placeholder="Person Name" required>
          <input type="number" id="debtAmount" placeholder="Amount" required>
          <select id="debtType">
            <option value="owed_to_me">They Owe Me</option>
            <option value="i_owe">I Owe Them</option>
          </select>
          <input type="text" id="debtNote" placeholder="Note (optional)">
          <input type="date" id="debtDue">
          <div class="modal-btns">
            <button type="button" class="btn btn-outline closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Entry</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.closeModal').onclick = () => modal.remove();
    modal.querySelector('#debtForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        person: document.getElementById('person').value,
        amount: Number(document.getElementById('debtAmount').value),
        type: document.getElementById('debtType').value,
        note: document.getElementById('debtNote').value,
        dueDate: document.getElementById('debtDue').value
      };
      await api.post('/debts', data);
      modal.remove();
      this.render();
    };
  }
}
