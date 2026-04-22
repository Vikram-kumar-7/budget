import './style.css';

const state = {
  screen: 'lock', // lock, dashboard, accounts, goals, debts
  pin: '',
  pinFailed: false,
  fabOpen: false,
  debtTab: 'oweMe'
};

const app = document.getElementById('app');

function render() {
  app.innerHTML = `
    <div id="phone-frame">
      <div class="dynamic-island"></div>
      <div class="status-bar">
        <span>9:41</span>
        <span style="display: flex; gap: 5px; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
          <svg width="20" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 12H6V8h12v8z"/></svg>
        </span>
      </div>
      
      ${renderScreen()}
      
      ${state.screen !== 'lock' ? renderNav() : ''}
      ${state.screen !== 'lock' ? renderOverlay() : ''}
    </div>
  `;
  setupEvents();
}

function renderScreen() {
  switch (state.screen) {
    case 'lock': return renderLockScreen();
    case 'dashboard': return renderDashboard();
    case 'accounts': return renderAccounts();
    case 'goals': return renderGoals();
    case 'debts': return renderDebts();
  }
}

function renderLockScreen() {
  const dots = [0, 1, 2, 3].map(i => `<div class="pin-dot ${i < state.pin.length ? 'filled' : ''}"></div>`).join('');
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<div class="key" data-key="${n}">${n}</div>`).join('');
  
  return `
    <div id="lock-screen" class="screen">
      <div style="text-align: center; margin-top: 40px;">
        <div style="position: relative; width: 60px; height: 60px; margin: 0 auto 10px;">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <path d="M 20 10 L 50 10 C 70 10 70 45 50 45 C 75 45 75 90 50 90 L 20 90 Z" fill="none" stroke="#22c55e" stroke-width="8"/>
            <rect x="35" y="60" width="8" height="30" fill="#3b82f6" rx="4" class="animated-bar" style="animation-delay: 0.1s;"/>
            <rect x="50" y="40" width="8" height="50" fill="#3b82f6" rx="4" class="animated-bar" style="animation-delay: 0.2s;"/>
            <rect x="65" y="50" width="8" height="40" fill="#3b82f6" rx="4" class="animated-bar" style="animation-delay: 0.3s;"/>
          </svg>
          <div class="animated-coin" style="position: absolute; bottom: 0; right: -5px; width: 24px; height: 24px; background: #fbbf24; border-radius: 50%; color: #000; font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">₹</div>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; letter-spacing: 1px;">BudgetMaster</h1>
        <p style="color: var(--text-sub); margin-top: 5px;">Enter your PIN to continue</p>
      </div>
      
      <div class="pin-dots ${state.pinFailed ? 'shake' : ''}">
        ${dots}
      </div>
      
      <p style="color: ${state.pinFailed ? 'var(--danger)' : 'var(--text-sub)'}; text-align: center; margin-bottom: 30px; font-size: 14px;">
        ${state.pinFailed ? 'Incorrect PIN. Try again.' : 'Hint: try 1234'}
      </p>
      
      <div class="keypad">
        ${keys}
        <div></div>
        <div class="key" data-key="0">0</div>
        <div class="key" data-key="backspace">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard() {
  return `
    <div class="screen">
      <div class="header row">
        <div style="font-weight: 800; font-size: 18px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--primary);">B</span> BudgetMaster
        </div>
        <div style="display: flex; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 18px; background: var(--card-bg); display: flex; justify-content: center; align-items: center;">🔔</div>
          <div style="height: 36px; padding: 0 12px; border-radius: 18px; background: var(--card-bg); display: flex; align-items: center; font-weight: 600; font-size: 13px;">₹45.2K</div>
        </div>
      </div>
      
      <div class="card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(0,0,0,0));">
        <div style="text-align: center;">
          <div class="subtitle">April 2025 Balance</div>
          <div style="font-size: 36px; font-weight: 700; margin: 10px 0;">₹45,200</div>
          <div class="row" style="margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 15px;">
            <div style="text-align: left;">
              <div style="color: var(--success); font-weight: 600; display: flex; align-items: center; gap: 4px;">↑ ₹82,000</div>
              <div class="subtitle" style="font-size: 12px;">Income</div>
            </div>
            <div style="text-align: right;">
              <div style="color: var(--danger); font-weight: 600; display: flex; align-items: center; gap: 4px;">↓ ₹36,800</div>
              <div class="subtitle" style="font-size: 12px;">Spent</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card row">
        <div>
          <div style="font-size: 13px; font-weight: 600;">Daily budget left</div>
          <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">₹847 <span style="font-size: 12px; font-weight: normal; color: var(--text-sub);">/ day</span></div>
        </div>
        <div style="text-align: right;">
          <div class="badge green">On track 🎯</div>
          <div class="subtitle" style="font-size: 11px; margin-top: 6px;">68% of month left</div>
        </div>
      </div>
      
      <div style="padding: 0 24px 10px 24px; font-weight: 600; font-size: 15px;">Budgets</div>
      ${renderProgressRow('🍔', 'Food', '₹4,100', '₹5,000', 82, 'var(--warning)')}
      ${renderProgressRow('🚗', 'Transport', '₹900', '₹2,000', 45, 'var(--primary)')}
      ${renderProgressRow('🎮', 'Entertainment', '₹950', '₹1,000', 95, 'var(--danger)')}
      
      <div style="padding: 15px 24px 10px 24px; font-weight: 600; font-size: 15px;">Goals Snapshot</div>
      ${renderProgressRow('💻', 'New Laptop', '₹39,000', '₹50,000', 78, '#10b981')}
      ${renderProgressRow('✈️', 'Goa Trip', '₹14,000', '₹40,000', 35, '#8b5cf6')}
      
      <div style="padding: 15px 24px 10px 24px; font-weight: 600; font-size: 15px; display: flex; justify-content: space-between;">
        Recent Transactions <span style="color: var(--primary); font-size: 13px;">View all</span>
      </div>
      ${renderTxRow('🍔', 'Swiggy Order', 'Food', '-₹650', false)}
      ${renderTxRow('💰', 'Salary Credit', 'Income', '+₹82,000', true)}
      ${renderTxRow('🚗', 'Uber Ride', 'Transport', '-₹320', false)}
      ${renderTxRow('🎬', 'Netflix', 'Entertainment', '-₹649', false)}
    </div>
  `;
}

function renderAccounts() {
  return `
    <div class="screen">
      <div class="header">
        <h1 class="title">Total Net Worth</h1>
        <div class="row" style="margin-top: 10px;">
          <div style="font-size: 32px; font-weight: 700;">₹47,000</div>
          <div class="badge green">↑ 12.4% this month</div>
        </div>
      </div>
      
      <div class="h-scroll">
        ${renderAccountCard('🏦', 'HDFC Savings', 'Bank Account', '₹45,200', '#3b82f6')}
        ${renderAccountCard('💵', 'Cash Wallet', 'Cash', '₹3,400', '#10b981')}
        ${renderAccountCard('💳', 'ICICI Credit', 'Credit Card', '-₹1,600', '#ef4444')}
        <div class="card h-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed var(--card-border); background: transparent; cursor: pointer;">
          <div style="width: 40px; height: 40px; border-radius: 20px; background: var(--card-bg); display: flex; justify-content: center; align-items: center; font-size: 20px; margin-bottom: 10px;">+</div>
          <div style="font-weight: 600; font-size: 14px;">Add Account</div>
        </div>
      </div>
      
      <div style="padding: 0 20px;">
        <button class="btn btn-outline" style="width: 100%; display: flex; justify-content: center; gap: 8px; margin-bottom: 24px; color: var(--primary); border-color: rgba(99, 102, 241, 0.3);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/></svg> Transfer Between Accounts
        </button>
      </div>
      
      <div style="padding: 0 24px 10px 24px; font-weight: 600; font-size: 15px;">Balance Split</div>
      <div style="padding: 0 24px 20px 24px;">
        <div style="height: 12px; border-radius: 6px; display: flex; overflow: hidden; margin-bottom: 10px;">
          <div style="width: 90%; background: #3b82f6;"></div>
          <div style="width: 10%; background: #10b981;"></div>
        </div>
        <div class="row subtitle" style="font-size: 12px;">
          <div style="display: flex; align-items: center; gap: 4px;"><div style="width:8px;height:8px;border-radius:4px;background:#3b82f6;"></div> Bank (90%)</div>
          <div style="display: flex; align-items: center; gap: 4px;"><div style="width:8px;height:8px;border-radius:4px;background:#10b981;"></div> Cash (10%)</div>
        </div>
      </div>
      
      <div style="padding: 10px 24px 10px 24px; font-weight: 600; font-size: 15px;">Recent Transactions</div>
      ${renderTxRow('💳', 'Credit Card Bill', 'Transfer', '-₹12,400', false)}
      ${renderTxRow('🏦', 'ATM Withdrawal', 'Transfer', '-₹2,000', false)}
    </div>
  `;
}

function renderGoals() {
  return `
    <div class="screen">
      <div class="header">
        <h1 class="title">Goals 🎯</h1>
        <div class="subtitle">Save up for what matters most</div>
      </div>
      
      <div class="card">
        <div class="row" style="margin-bottom: 10px;">
          <div style="font-weight: 600;">Overall Progress</div>
          <div style="font-weight: 700;">₹93K <span style="font-weight: normal; font-size: 12px; color: var(--text-sub);">/ ₹160K</span></div>
        </div>
        <div class="progress-bg"><div class="progress-fill" style="width: 58%; background: var(--success);"></div></div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 20px;">
        ${renderGridGoal('💻', 'New Laptop', '78%', '₹39K', '₹50K', 78, '#10b981', '🔥 42 days left')}
        ${renderGridGoal('✈️', 'Goa Trip', '35%', '₹14K', '₹40K', 35, '#8b5cf6', '~ 90 days left')}
        ${renderGridGoal('🚨', 'Emergency Fund', '100%', '₹30K', '₹30K', 100, '#22c55e', '✅ Achieved!')}
        ${renderGridGoal('📱', 'New Phone', '25%', '₹10K', '₹40K', 25, '#3b82f6', '~ 120 days left')}
        
        <div class="card" style="margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed var(--card-border); background: transparent; cursor: pointer; min-height: 160px;">
          <div style="width: 40px; height: 40px; border-radius: 20px; background: var(--card-bg); display: flex; justify-content: center; align-items: center; font-size: 20px; margin-bottom: 10px;">+</div>
          <div style="font-weight: 600; font-size: 14px;">New Goal</div>
        </div>
      </div>
    </div>
  `;
}

function renderDebts() {
  const isOweMe = state.debtTab === 'oweMe';
  return `
    <div class="screen">
      <div class="header">
        <h1 class="title">Debts 💳</h1>
        <div class="subtitle">Track what's owed</div>
      </div>
      
      <div class="card row" style="text-align: center;">
        <div>
          <div class="subtitle" style="font-size: 12px;">Owe Me</div>
          <div style="color: var(--success); font-weight: 700; font-size: 18px; margin-top: 4px;">₹3,500</div>
        </div>
        <div style="width: 1px; height: 30px; background: var(--card-border);"></div>
        <div>
          <div class="subtitle" style="font-size: 12px;">I Owe</div>
          <div style="color: var(--danger); font-weight: 700; font-size: 18px; margin-top: 4px;">₹1,200</div>
        </div>
        <div style="width: 1px; height: 30px; background: var(--card-border);"></div>
        <div>
          <div class="subtitle" style="font-size: 12px;">Net</div>
          <div style="color: var(--success); font-weight: 700; font-size: 18px; margin-top: 4px;">+₹2,300</div>
        </div>
      </div>
      
      <div class="tabs">
        <div class="tab ${isOweMe ? 'active' : ''}" data-tab="oweMe">Owe Me 🟢</div>
        <div class="tab ${!isOweMe ? 'active' : ''}" data-tab="iOwe">I Owe 🔴</div>
      </div>
      
      <div style="padding: 0 20px;">
        ${isOweMe ? `
          ${renderDebtCard('Rahul', '₹1,500', 'Split dinner at Smoke House', 'Due: Jun 15', false, true)}
          ${renderDebtCard('Priya', '₹2,000', 'Concert tickets', 'Due: May 10', true, true)}
        ` : `
          ${renderDebtCard('Arjun', '₹1,200', 'Cab fare to airport', 'Due: Jun 20', false, false)}
        `}
        <button class="btn btn-outline" style="width: 100%; border-style: dashed; padding: 16px; margin-top: 10px;">+ Add Debt Entry</button>
      </div>
    </div>
  `;
}

/* Helpers */
function renderNav() {
  const tabs = [
    { id: 'dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', label: 'Home' },
    { id: 'accounts', icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>', label: 'Accounts' },
    { id: 'goals', icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>', label: 'Goals' },
    { id: 'debts', icon: '<path d="M17 3v18"/><path d="M3 15h18"/><path d="M3 9h18"/><path d="M7 3v18"/>', label: 'Debts' }
  ];
  
  return `
    <div class="bottom-nav">
      <div class="nav-item ${state.screen === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${tabs[0].icon}</svg>
        <span>${tabs[0].label}</span>
      </div>
      <div class="nav-item ${state.screen === 'accounts' ? 'active' : ''}" data-nav="accounts">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${tabs[1].icon}</svg>
        <span>${tabs[1].label}</span>
      </div>
      <div class="fab" id="fab">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <div class="nav-item ${state.screen === 'goals' ? 'active' : ''}" data-nav="goals">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${tabs[2].icon}</svg>
        <span>${tabs[2].label}</span>
      </div>
      <div class="nav-item ${state.screen === 'debts' ? 'active' : ''}" data-nav="debts">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${tabs[3].icon}</svg>
        <span>${tabs[3].label}</span>
      </div>
    </div>
  `;
}

function renderOverlay() {
  return `
    <div id="overlay" class="${state.fabOpen ? 'show' : ''}">
      <div class="overlay-menu">
        <button class="overlay-btn">💰 Add Income</button>
        <button class="overlay-btn">💸 Add Expense</button>
        <button class="overlay-btn">🎯 Add to Goal</button>
        <button class="overlay-btn">💳 Log Debt</button>
      </div>
      <div class="overlay-cancel" id="overlay-cancel">Cancel</div>
    </div>
  `;
}

function renderProgressRow(icon, name, current, total, percent, color) {
  return `
    <div class="card" style="margin: 0 20px 10px 20px; padding: 15px;">
      <div class="row">
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; justify-content: center; align-items: center; font-size: 16px;">${icon}</div>
          <div>
            <div style="font-weight: 600; font-size: 14px;">${name}</div>
            <div class="subtitle" style="font-size: 11px;">${current} / ${total}</div>
          </div>
        </div>
        <div style="font-weight: 700; font-size: 14px;">${percent}%</div>
      </div>
      <div class="progress-bg"><div class="progress-fill" style="width: ${percent}%; background: ${color};"></div></div>
    </div>
  `;
}

function renderTxRow(icon, name, cat, amount, isPos) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; border-bottom: 1px solid var(--card-border);">
      <div style="display: flex; gap: 12px; align-items: center;">
        <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; justify-content: center; align-items: center; font-size: 20px;">${icon}</div>
        <div>
          <div style="font-weight: 600; font-size: 14px;">${name}</div>
          <div class="subtitle" style="font-size: 11px;">${cat}</div>
        </div>
      </div>
      <div style="font-weight: 700; color: ${isPos ? 'var(--success)' : 'var(--text-main)'}">${amount}</div>
    </div>
  `;
}

function renderAccountCard(icon, name, type, bal, color) {
  return `
    <div class="card h-card" style="border-top: 4px solid ${color};">
      <div class="row" style="margin-bottom: 20px;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${color}20; display: flex; justify-content: center; align-items: center; font-size: 16px;">${icon}</div>
      </div>
      <div class="subtitle" style="font-size: 11px; margin-bottom: 2px;">${type}</div>
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 10px;">${name}</div>
      <div style="font-size: 18px; font-weight: 700;">${bal}</div>
    </div>
  `;
}

function renderGridGoal(icon, name, percentStr, saved, total, percentNum, color, deadline) {
  return `
    <div class="card" style="margin: 0; padding: 16px; position: relative;">
      <div style="position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 600; ${deadline.includes('Overdue') || deadline.includes('🔥') ? 'color: var(--danger);' : deadline.includes('✅') ? 'color: var(--success);' : 'color: var(--text-sub);'}">${deadline}</div>
      <div style="width: 36px; height: 36px; border-radius: 18px; background: ${color}20; display: flex; justify-content: center; align-items: center; font-size: 18px; margin-bottom: 12px;">${icon}</div>
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${name}</div>
      <div class="progress-bg" style="margin-bottom: 8px;"><div class="progress-fill" style="width: ${percentNum}%; background: ${color};"></div></div>
      <div class="row" style="font-size: 11px; font-weight: 600;">
        <span style="color: ${color};">${percentStr}</span>
        <span class="subtitle">${saved} / ${total}</span>
      </div>
    </div>
  `;
}

function renderDebtCard(name, amount, note, due, overdue, isOweMe) {
  return `
    <div class="card" style="margin: 0 0 12px 0; padding: 16px; ${overdue ? 'border: 1px solid var(--danger);' : ''}">
      <div class="row" style="margin-bottom: 8px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <div style="font-weight: 600; font-size: 16px;">👤 ${name}</div>
          ${overdue ? '<div class="badge red">⚠️ Overdue</div>' : ''}
        </div>
        <div style="font-weight: 700; font-size: 18px; color: ${isOweMe ? 'var(--success)' : 'var(--danger)'};">${amount}</div>
      </div>
      <div class="row" style="margin-bottom: 16px;">
        <div class="subtitle" style="font-size: 13px;">"${note}"</div>
        <div class="subtitle" style="font-size: 12px;">${due}</div>
      </div>
      <div class="row" style="gap: 8px;">
        <button class="btn btn-sm btn-outline" style="flex: 1;">Remind</button>
        <button class="btn btn-sm btn-outline" style="flex: 1;">Part Pay</button>
        <button class="btn btn-sm" style="flex: 1;">✓ Paid</button>
      </div>
    </div>
  `;
}

function setupEvents() {
  if (state.screen === 'lock') {
    document.querySelectorAll('.key').forEach(k => {
      k.onclick = () => {
        if (state.pinFailed) return;
        const key = k.dataset.key;
        if (key === 'backspace') {
          state.pin = state.pin.slice(0, -1);
        } else {
          if (state.pin.length < 4) state.pin += key;
        }
        
        if (state.pin.length === 4) {
          if (state.pin === '1234') {
            state.screen = 'dashboard';
            state.pin = '';
          } else {
            state.pinFailed = true;
            setTimeout(() => {
              state.pinFailed = false;
              state.pin = '';
              render();
            }, 600);
          }
        }
        render();
      };
    });
  } else {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.onclick = () => {
        state.screen = el.dataset.nav;
        render();
      };
    });
    
    document.getElementById('fab').onclick = () => {
      state.fabOpen = true;
      render();
    };
    
    document.getElementById('overlay-cancel').onclick = () => {
      state.fabOpen = false;
      render();
    };
    
    if (state.screen === 'debts') {
      document.querySelectorAll('.tab').forEach(t => {
        t.onclick = () => {
          state.debtTab = t.dataset.tab;
          render();
        };
      });
    }
  }
}

// Initial render
render();
