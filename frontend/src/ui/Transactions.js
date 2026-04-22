import { api } from '../services/api';
import { SplitBillModal } from './SplitBillModal';

export class Transactions {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.transactions = [];
    this.filteredTransactions = [];
    this.searchTerm = '';
    this.categoryFilter = 'all';
    this.currency = user.currency || '₹';
  }

  async render() {
    this.container.innerHTML = `<div class="loader"></div>`;
    try {
      this.transactions = await api.get('/transactions');
      this.filteredTransactions = [...this.transactions];
      this.renderContent();
    } catch (err) {
      this.container.innerHTML = `<div class="error">Failed to load transactions</div>`;
    }
  }

  renderContent() {
    const categories = ['all', ...new Set(this.transactions.map(t => t.category))];

    this.container.innerHTML = `
      <div class="header-section">
        <div>
          <h1 class="view-title">Transaction History</h1>
          <p class="view-subtitle">Monitor and manage your cash flow</p>
        </div>
        <div class="header-actions" style="display: flex; gap: 10px;">
          <button class="btn btn-outline" id="splitBtn" style="color: var(--primary); border-color: var(--primary)">
            <i class="ph-bold ph-users-three"></i> Split Bill
          </button>
          <button class="btn btn-outline" id="undoBtn" style="color: var(--danger); border-color: var(--danger)">
            <i class="ph-bold ph-arrow-u-up-left"></i> Undo Last
          </button>
        </div>
      </div>

      <div class="filter-bar glass-card">
        <div class="search-input">
          <i class="ph-bold ph-magnifying-glass"></i>
          <input type="text" id="txSearch" placeholder="Search transactions..." value="${this.searchTerm}">
        </div>
        <div class="filter-group">
          <select id="txCategoryFilter">
            ${categories.map(c => `<option value="${c}" ${this.categoryFilter === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Date</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody id="txTableBody">
            ${this.renderRows()}
          </tbody>
        </table>
      </div>
    `;

    this.setupListeners();
  }

  renderRows() {
    if (this.filteredTransactions.length === 0) {
      return `<tr><td colspan="4" class="empty-table">No transactions match your filters</td></tr>`;
    }

    return this.filteredTransactions.map(t => `
      <tr class="tx-row">
        <td>
          <div class="tx-desc">${t.desc}</div>
          <div class="tx-time">${t.time}</div>
        </td>
        <td><span class="category-tag">${t.category}</span></td>
        <td><span class="tx-date">${t.date}</span></td>
        <td class="tx-amount ${t.type === 'income' ? 'income' : 'expense'}">
          ${t.type === 'income' ? '+' : '-'}${this.format(t.amount)}
        </td>
      </tr>
    `).join('');
  }

  setupListeners() {
    const searchInput = document.getElementById('txSearch');
    const categoryFilter = document.getElementById('txCategoryFilter');
    const undoBtn = document.getElementById('undoBtn');

    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.applyFilters();
    });

    categoryFilter.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value;
      this.applyFilters();
    });

    document.getElementById('undoBtn').onclick = () => this.handleUndo();
    document.getElementById('splitBtn').onclick = () => new SplitBillModal().show();
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(t => {
      const matchesSearch = t.desc.toLowerCase().includes(this.searchTerm) || 
                            t.category.toLowerCase().includes(this.searchTerm);
      const matchesCategory = this.categoryFilter === 'all' || t.category === this.categoryFilter;
      return matchesSearch && matchesCategory;
    });

    document.getElementById('txTableBody').innerHTML = this.renderRows();
  }

  format(num) {
    return (this.user.currency || '$') + num.toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  async handleUndo() {
    if (!confirm("Delete the most recent transaction?")) return;
    try {
      await api.delete('/transactions/undo/last');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }
}
