import { api } from '../services/api';

export class Budgets {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.budgets = [];
    this.transactions = [];
    this.currency = user.currency || '₹';
  }

  async render() {
    this.container.innerHTML = `<div style="padding: 20px; text-align: center;">Loading Budgets...</div>`;
    
    try {
      [this.budgets, this.transactions] = await Promise.all([
        api.get('/budgets'),
        api.get('/transactions')
      ]);
      
      this.container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div>
            <h1 style="font-size: 2.2rem; font-weight: 800;">Budget Limits</h1>
            <p style="color: var(--text-sub)">Track your spending against goals</p>
          </div>
          <button class="btn btn-primary" id="addBudgetBtn">
            <i class="ph-bold ph-plus"></i> Set Budget
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;">
          ${this.budgets.length === 0 ? '<div class="card" style="grid-column: 1/-1; text-align: center; padding: 60px;"><h3>No budgets set</h3><p style="color: var(--text-sub)">Start by setting a limit for a category</p></div>' : ''}
          ${this.budgets.map(b => this.renderBudgetCard(b)).join('')}
        </div>
      `;

      document.getElementById('addBudgetBtn').addEventListener('click', () => this.showBudgetModal());
    } catch (err) {
      this.container.innerHTML = `<div class="card" style="color: var(--danger); text-align: center;">Error loading budgets: ${err.message}</div>`;
    }
  }

  renderBudgetCard(budget) {
    const spent = this.transactions
      .filter(t => t.category === budget.category && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percent = Math.min((spent / budget.limit) * 100, 100);
    const color = percent > 90 ? 'var(--danger)' : percent > 70 ? 'var(--warning)' : 'var(--success)';

    return `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="font-size: 1.1rem;">${budget.category}</h3>
          <span style="font-weight: 700; color: ${color}">${Math.round(percent)}%</span>
        </div>
        <div style="height: 10px; background: rgba(0,0,0,0.2); border-radius: 10px; margin-bottom: 15px; overflow: hidden;">
          <div style="height: 100%; width: ${percent}%; background: ${color}; transition: width 1s;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-sub);">
          <span>Spent: ${this.format(spent)}</span>
          <span style="font-weight: 600; color: var(--text-main)">Limit: ${this.format(budget.limit)}</span>
        </div>
      </div>
    `;
  }

  format(num) {
    return this.currency + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  showBudgetModal() {
    const amount = parseFloat(prompt("Enter limit amount:"));
    const category = prompt("Enter category name:");
    if (!amount || !category) return;
    
    api.post('/budgets', { category, limit: amount }).then(() => this.render());
  }
}
