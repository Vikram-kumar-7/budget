import { api } from '../services/api';

export class Calendar {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.transactions = [];
    this.currentDate = new Date();
  }

  async render() {
    this.transactions = await api.get('/transactions');
    this.renderMonth();
  }

  renderMonth() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(this.currentDate);

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h1 style="font-size: 2.2rem; font-weight: 800;">Activity Calendar</h1>
        <div style="display: flex; align-items: center; gap: 20px;">
          <button class="btn btn-outline" id="prevMonth"><i class="ph-bold ph-caret-left"></i></button>
          <span style="font-size: 1.2rem; font-weight: 600;">${monthName} ${year}</span>
          <button class="btn btn-outline" id="nextMonth"><i class="ph-bold ph-caret-right"></i></button>
        </div>
      </div>

      <div class="card" style="padding: 20px;">
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 10px;">
          ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div style="text-align: center; color: var(--text-sub); font-weight: 600;">${d}</div>`).join('')}
        </div>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;" id="calendarDays">
          ${this.getDaysHTML(year, month)}
        </div>
      </div>
    `;

    document.getElementById('prevMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderMonth();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderMonth();
    });
  }

  getDaysHTML(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = '';

    for (let i = 0; i < firstDay; i++) {
      html += '<div></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTxs = this.transactions.filter(t => t.date === dateStr);
      
      let dots = '';
      if (dayTxs.some(t => t.type === 'income')) dots += '<div style="width:6px; height:6px; border-radius:50%; background:var(--success);"></div>';
      if (dayTxs.some(t => t.type === 'expense')) dots += '<div style="width:6px; height:6px; border-radius:50%; background:var(--danger);"></div>';

      html += `
        <div style="height: 80px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 0.9rem;">${day}</span>
          <div style="display: flex; gap: 4px; justify-content: center;">${dots}</div>
        </div>
      `;
    }

    return html;
  }
}
