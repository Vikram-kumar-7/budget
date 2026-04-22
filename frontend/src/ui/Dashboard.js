import { api } from '../services/api';
import { TransactionModal } from './TransactionModal';

export class Dashboard {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.transactions = [];
    this.stats = { total: 0, income: 0, expense: 0 };
    this.currency = user.currency || '₹';
  }

  async render() {
    this.container.innerHTML = `<div style="padding: 20px; text-align: center;">Loading Dashboard...</div>`;
    
    try {
      this.transactions = await api.get('/transactions');
      this.calculateStats();
      
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning ☀️' : hour < 18 ? 'Good afternoon 🌤️' : 'Good evening 🌙';
      
      this.container.innerHTML = `
        <!-- ZONE A: Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div id="dash-logo"></div>
            <div>
              <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;">BudgetMaster</h1>
              <p style="color: var(--text-sub); font-size: 0.9rem;">${greeting}, ${this.user.username}</p>
            </div>
          </div>
          <div style="display: flex; gap: 15px; align-items: center;">
             <div id="lockTimer" style="font-size: 0.9rem; color: var(--text-sub); cursor: pointer;" title="Tap to lock"><i class="ph-bold ph-lock"></i> <span></span></div>
             <button class="icon-btn" style="position: relative; font-size: 1.5rem;">
               <i class="ph-bold ph-bell"></i>
               <span style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: var(--danger); border-radius: 50%;"></span>
             </button>
          </div>
        </div>

        <!-- ZONE B: Hero Summary Card -->
        <div class="glass-card" style="margin-bottom: 30px; text-align: center; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(0,0,0,0));">
          <p style="color: var(--text-sub); font-size: 0.9rem; font-weight: 600; text-transform: uppercase;">Current Balance</p>
          <div class="big-num" style="margin: 15px 0; font-size: 2.5rem;">${this.format(this.stats.total)}</div>
          <div style="display: flex; justify-content: center; gap: 40px; border-top: 1px solid var(--glass-border); padding-top: 15px;">
             <div>
               <div style="color: var(--success); font-weight: 600;"><i class="ph-bold ph-arrow-up"></i> ${this.format(this.stats.income)}</div>
               <div style="font-size: 0.8rem; color: var(--text-sub);">Income</div>
             </div>
             <div>
               <div style="color: var(--danger); font-weight: 600;"><i class="ph-bold ph-arrow-down"></i> ${this.format(this.stats.expense)}</div>
               <div style="font-size: 0.8rem; color: var(--text-sub);">Spent</div>
             </div>
          </div>
        </div>

        <!-- ZONE C: Widget Stack -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Widget 1: Quick Stats Row -->
          <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;">
             <button class="btn btn-outline nav-btn" data-view="accounts" style="white-space: nowrap;">Accounts</button>
             <button class="btn btn-outline nav-btn" data-view="goals" style="white-space: nowrap;">Active Goals</button>
             <button class="btn btn-outline nav-btn" data-view="debts" style="white-space: nowrap;">Manage Debts</button>
          </div>

          <!-- Widget 2: Burn Rate Bar -->
          <div class="glass-card" style="border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: 600;">Daily Burn Rate</span>
              <span id="burnRateTxt" style="font-weight: 600;">...</span>
            </div>
            <div id="burnRateBar" style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
               <div style="height: 100%; width: 0%; background: var(--primary); border-radius: 4px; transition: 1s;"></div>
            </div>
            <p id="burnRateMsg" style="font-size: 0.8rem; color: var(--text-sub);">Calculating...</p>
          </div>

          <!-- Widget 3: Goal Snapshot -->
          <div class="glass-card" style="border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <h3 style="font-size: 1rem;">Goals Snapshot</h3>
              <a href="#" class="nav-btn" data-view="goals" style="font-size: 0.8rem; color: var(--primary); text-decoration: none;">View all →</a>
            </div>
            <div id="goalsMiniList"></div>
          </div>

          <!-- Widget 4: Recent Transactions -->
          <div class="glass-card" style="border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <h3 style="font-size: 1rem;">Recent Activity</h3>
              <a href="#" class="nav-btn" data-view="transactions" style="font-size: 0.8rem; color: var(--primary); text-decoration: none;">View all →</a>
            </div>
            <div id="recentTxList"></div>
          </div>
          
        </div>
      `;

      this.initHeaderLogic();
      this.calculateBurnRate();
      this.renderGoalsMiniList();
      this.renderRecentTx();
      
      this.container.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          document.querySelector(`.nav-item[data-view="${btn.dataset.view}"]`)?.click();
        };
      });

    } catch (err) {
      this.container.innerHTML = `<div class="card" style="color: var(--danger); text-align: center;">Error loading dashboard: ${err.message}</div>`;
    }
  }

  initHeaderLogic() {
    import('../ui/BudgetMasterLogo.js').then(({ getAnimatedLogo }) => {
      document.getElementById('dash-logo').innerHTML = getAnimatedLogo(40, false);
    });

    import('../services/security.js').then(({ securityManager }) => {
      const lockTimerSpan = document.querySelector('#lockTimer span');
      const updateTimer = () => {
        const text = securityManager.getLockCountdown();
        if (text) lockTimerSpan.innerText = text;
        else lockTimerSpan.innerText = '';
      };
      updateTimer();
      this.timerInterval = setInterval(updateTimer, 1000);

      document.getElementById('lockTimer').onclick = () => {
        securityManager.lockApp();
      };
    });
  }

  renderRecentTx() {
    const list = document.getElementById('recentTxList');
    const recent = this.transactions.slice(0, 5);
    
    if (recent.length === 0) {
      list.innerHTML = `<p style="color: var(--text-sub); font-size: 0.8rem; text-align: center;">No transactions yet</p>`;
      return;
    }

    list.innerHTML = recent.map(t => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--glass-border);">
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="width: 35px; height: 35px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
            ${t.type === 'income' ? '💰' : '💸'}
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${t.desc}</div>
            <div style="font-size: 0.75rem; color: var(--text-sub);">${t.date}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: ${t.type === 'income' ? 'var(--success)' : 'var(--text-main)'};">
          ${t.type === 'income' ? '+' : '-'}${this.format(t.amount)}
        </div>
      </div>
    `).join('');
  }


  calculateStats() {
    this.stats = this.transactions.reduce((acc, tx) => {
      if (tx.type === 'income') {
        acc.income += tx.amount;
        acc.total += tx.amount;
      } else {
        acc.expense += tx.amount;
        acc.total -= tx.amount;
      }
      return acc;
    }, { total: 0, income: 0, expense: 0 });
  }

  format(num) {
    return this.currency + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  renderCharts() {
    this.renderCashFlowChart();
  }

  async renderJar() {
    try {
        const jar = await api.get('/jar');
        const percent = Math.min((jar.current / jar.goal) * 100, 100);
        document.getElementById('jarLiquid').style.height = percent + '%';
        document.getElementById('jarCurrent').innerText = this.format(jar.current);
        document.getElementById('jarGoal').innerText = this.format(jar.goal);
    } catch (err) {
        console.error(err);
    }
  }

  async handleDeposit() {
    const amountStr = prompt("Enter amount to deposit into the jar:");
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    try {
        const jar = await api.get('/jar');
        await api.put('/jar', { current: jar.current + amount });
        
        await api.post('/transactions', {
            amount,
            type: 'expense',
            category: 'Savings',
            desc: 'Deposit to Savings Jar',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        this.render();
        confetti({ origin: { y: 0.7 } });
    } catch (err) {
        alert(err.message);
    }
  }

  renderCashFlowChart() {
    const canvas = document.getElementById('cashFlowChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const sorted = [...this.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = [...new Set(sorted.map(t => t.date))];
    
    let runningBalance = 0;
    const balanceData = dates.map(date => {
      const dayTxs = sorted.filter(t => t.date === date);
      dayTxs.forEach(t => {
        if (t.type === 'income') runningBalance += t.amount;
        else runningBalance -= t.amount;
      });
      return runningBalance;
    });

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Wallet Balance',
          data: balanceData,
          borderColor: '#6366f1',
          borderWidth: 4,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  async renderGoalsMiniList() {
    const list = document.getElementById('goalsMiniList');
    try {
      const goals = await api.get('/goals');
      if (goals.length === 0) {
        list.innerHTML = `<p style="color: var(--text-sub); font-size: 0.8rem; text-align: center;">No goals set</p>`;
        return;
      }
      list.innerHTML = goals.slice(0, 3).map(g => {
        const progress = Math.min((g.savedAmount / g.targetAmount) * 100, 100);
        return `
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px;">
              <span>${g.icon} ${g.name}</span>
              <span style="font-weight: 600;">${progress.toFixed(0)}%</span>
            </div>
            <div style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${progress}%; background: ${g.color}; border-radius: 3px;"></div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
    }
  }

  async calculateBurnRate() {
    try {
      const budgets = await api.get('/budgets');
      if (budgets.length === 0) {
        document.getElementById('burnRate').innerText = 'Set Budgets';
        return;
      }

      const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - now.getDate() + 1;
      
      const spentThisMonth = this.transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth())
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = totalBudget - spentThisMonth;
      const burnRate = Math.max(remaining / daysLeft, 0);
      const targetBurnRate = totalBudget / daysInMonth;

      const txt = document.getElementById('burnRateTxt');
      const bar = document.querySelector('#burnRateBar div');
      const msg = document.getElementById('burnRateMsg');
      
      if (txt) {
        txt.innerText = this.format(burnRate) + '/day';
        txt.style.color = burnRate > targetBurnRate * 0.2 ? 'var(--success)' : 'var(--danger)';
      }
      
      if (bar) {
        const percent = Math.min((daysLeft / daysInMonth) * 100, 100);
        bar.style.width = percent + '%';
        bar.style.background = burnRate > 0 ? 'var(--success)' : 'var(--danger)';
      }
      
      if (msg) {
        msg.innerText = burnRate > 0 ? "You're on track 🎯" : "Budget exceeded ⚠️";
      }
    } catch (err) {
      console.error(err);
    }
  }
}
