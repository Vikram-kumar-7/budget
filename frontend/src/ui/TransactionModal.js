import { api } from '../services/api';

export class TransactionModal {
  constructor(onSave) {
    this.onSave = onSave;
    this.type = 'expense';
    this.accounts = [];
  }

  async show() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'txModal';
    
    // Fetch accounts for the selector
    this.accounts = await api.get('/accounts');

    overlay.innerHTML = `
      <div class="modal">
        <h2 style="margin-bottom: 25px;">Add Transaction</h2>
        <form id="modalForm">
          <div style="display: flex; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 4px; margin-bottom: 20px;">
            <div id="typeExp" class="type-opt active" style="flex:1; text-align:center; padding:10px; border-radius:10px; cursor:pointer; font-weight:600;">Expense</div>
            <div id="typeInc" class="type-opt" style="flex:1; text-align:center; padding:10px; border-radius:10px; cursor:pointer; font-weight:600;">Income</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <input type="number" name="amount" placeholder="Amount" step="0.01" required>
            <input type="date" name="date" required>
          </div>
          <input type="text" name="desc" placeholder="Description" required>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <select name="category" required id="catSelect">
              <option value="">Select Category</option>
            </select>
            <select name="accountId" required>
              <option value="">Select Account</option>
              ${this.accounts.map(acc => `<option value="${acc._id}">${acc.name}</option>`).join('')}
            </select>
          </div>

          <div class="recurring-section" style="margin: 15px 0;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-sub);">
              <input type="checkbox" id="repeatToggle" style="width: auto; margin-bottom: 0;"> 
              Repeat this transaction
            </label>
            <div id="repeatOptions" style="display: none; margin-top: 10px;">
              <select name="freq" style="margin-bottom: 0;">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly" selected>Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
             <button type="submit" class="btn btn-primary" style="flex:1;">Save Transaction</button>
             <button type="button" class="btn btn-outline" id="closeModal" style="flex:1; border: 1px solid var(--glass-border);">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    this.updateCategories();

    overlay.querySelector('#typeExp').onclick = () => this.setType('expense', overlay);
    overlay.querySelector('#typeInc').onclick = () => this.setType('income', overlay);
    overlay.querySelector('#closeModal').onclick = () => overlay.remove();
    overlay.querySelector('#modalForm').onsubmit = (e) => this.handleSubmit(e, overlay);
    
    const repeatToggle = overlay.querySelector('#repeatToggle');
    const repeatOptions = overlay.querySelector('#repeatOptions');
    repeatToggle.onchange = (e) => {
      repeatOptions.style.display = e.target.checked ? 'block' : 'none';
    };

    // Set default date to today
    overlay.querySelector('input[type="date"]').valueAsDate = new Date();
  }

  setType(type, overlay) {
    this.type = type;
    overlay.querySelector('#typeExp').classList.toggle('active', type === 'expense');
    overlay.querySelector('#typeInc').classList.toggle('active', type === 'income');
    this.updateCategories();
  }

  async updateCategories() {
    const select = document.getElementById('catSelect');
    const defaults = {
      expense: ['Food', 'Rent', 'Transport', 'Entertainment', 'Shopping', 'Health'],
      income: ['Salary', 'Freelance', 'Investments', 'Gift']
    };
    
    try {
        const custom = await api.get('/categories');
        const list = [...defaults[this.type], ...custom.filter(c => c.type === this.type).map(c => c.name)];
        select.innerHTML = '<option value="">Select Category</option>' + 
          list.map(c => `<option value="${c}">${c}</option>`).join('');
    } catch (err) {
        select.innerHTML = defaults[this.type].map(c => `<option value="${c}">${c}</option>`).join('');
    }
  }

  async handleSubmit(e, overlay) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      desc: formData.get('desc'),
      category: formData.get('category'),
      accountId: formData.get('accountId'),
      type: this.type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRecurring: document.getElementById('repeatToggle').checked
    };

    if (data.isRecurring) {
      data.recurringRule = {
        freq: formData.get('freq'),
        nextDate: this.calculateNextDate(data.date, formData.get('freq'))
      };
    }

    try {
      await api.post('/transactions', data);
      overlay.remove();
      this.onSave();
    } catch (err) {
      alert(err.message);
    }
  }

  calculateNextDate(dateStr, freq) {
    const date = new Date(dateStr);
    if (freq === 'daily') date.setDate(date.getDate() + 1);
    else if (freq === 'weekly') date.setDate(date.getDate() + 7);
    else if (freq === 'monthly') date.setMonth(date.getMonth() + 1);
    else if (freq === 'yearly') date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  }
}
