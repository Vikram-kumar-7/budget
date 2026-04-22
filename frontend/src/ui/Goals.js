import { api } from '../services/api';

export class Goals {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.goals = [];
  }

  async render() {
    this.container.innerHTML = `<div class="loader"></div>`;
    try {
      this.goals = await api.get('/goals');
      this.renderContent();
    } catch (err) {
      this.container.innerHTML = `<div class="error">Failed to load goals</div>`;
    }
  }

  renderContent() {
    this.container.innerHTML = `
      <div class="header-section">
        <div>
          <h1 class="view-title">Goal Tracker</h1>
          <p class="view-subtitle">Save up for what matters most</p>
        </div>
        <button id="addGoalBtn" class="btn btn-primary">
          <i class="ph-bold ph-plus"></i> New Goal
        </button>
      </div>

      <div class="goals-grid">
        ${this.goals.length === 0 ? `
          <div class="empty-state">
            <i class="ph-duotone ph-target"></i>
            <p>No goals set yet. Start saving for something big!</p>
          </div>
        ` : this.goals.map(goal => {
          const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
          let deadlineText = '';
          if (progress >= 100) {
            deadlineText = '<span style="color: var(--success); font-weight: bold;">✅ Achieved!</span>';
          } else if (goal.deadline) {
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) deadlineText = '<span style="color: var(--danger);">⚠️ Overdue</span>';
            else if (daysLeft < 30) deadlineText = `<span style="color: var(--warning);">🔥 ${daysLeft} days left</span>`;
            else deadlineText = `~ ${daysLeft} days left`;
          }

          return `
            <div class="glass-card goal-card" style="border-top: 4px solid ${goal.color}; position: relative;">
              <div style="position: absolute; top: 15px; right: 15px; font-size: 0.8rem; color: var(--text-sub);">
                 ${deadlineText}
              </div>
              <div class="goal-header" style="margin-bottom: 20px;">
                <span class="goal-icon" style="background: ${goal.color}20; color: ${goal.color}">${goal.icon}</span>
                <div class="goal-info">
                  <h3 style="font-size: 1.2rem; margin: 0;">${goal.name}</h3>
                  <p style="margin: 0;">Target: ${this.user.currency || '$'}${goal.targetAmount.toLocaleString()}</p>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; font-weight: 600;">
                 <span style="color: ${goal.color};">${progress.toFixed(0)}%</span>
                 <span>${this.user.currency || '$'}${goal.savedAmount.toLocaleString()} of ${this.user.currency || '$'}${goal.targetAmount.toLocaleString()}</span>
              </div>
              <div class="progress-container" style="height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; margin-bottom: 20px;">
                <div class="progress-bar" style="width: ${progress}%; background: ${goal.color}; height: 100%; transition: width 1s ease-out;"></div>
              </div>
              
              <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary add-funds" data-id="${goal._id}" style="flex: 1; padding: 8px;">+ Add</button>
                <button class="btn btn-outline delete-goal" data-id="${goal._id}" style="color: var(--danger); border-color: var(--danger); padding: 8px;"><i class="ph-bold ph-trash"></i></button>
              </div>
            </div>
          `;
        }).join('')}

      </div>
    `;

    this.setupListeners();
  }

  setupListeners() {
    document.getElementById('addGoalBtn').addEventListener('click', () => this.showAddGoalModal());
    
    this.container.querySelectorAll('.add-funds').forEach(btn => {
      btn.addEventListener('click', () => this.showAddFundsModal(btn.dataset.id));
    });

    this.container.querySelectorAll('.delete-goal').forEach(btn => {
      btn.addEventListener('click', async () => {
        if(confirm('Are you sure you want to delete this goal?')) {
          await api.delete(`/goals/${btn.dataset.id}`);
          this.render();
        }
      });
    });
  }

  showAddGoalModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Create New Goal</h2>
        <form id="goalForm">
          <input type="text" id="goalName" placeholder="Goal Name (e.g. New Car)" required>
          <input type="number" id="goalTarget" placeholder="Target Amount" required>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <input type="text" id="goalIcon" placeholder="Icon (Emoji)" value="🎯">
            <input type="color" id="goalColor" value="#6366f1" style="height: 50px; padding: 5px;">
          </div>
          <input type="date" id="goalDeadline">
          <div class="modal-btns">
            <button type="button" class="btn btn-outline closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Goal</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.closeModal').onclick = () => modal.remove();
    modal.querySelector('#goalForm').onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('goalName').value,
        targetAmount: Number(document.getElementById('goalTarget').value),
        icon: document.getElementById('goalIcon').value,
        color: document.getElementById('goalColor').value,
        deadline: document.getElementById('goalDeadline').value
      };
      await api.post('/goals', data);
      modal.remove();
      this.render();
    };
  }

  showAddFundsModal(id) {
    const goal = this.goals.find(g => g._id === id);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Add Funds to ${goal.name}</h2>
        <form id="fundsForm">
          <input type="number" id="fundAmount" placeholder="Amount to add" required>
          <div class="modal-btns">
            <button type="button" class="btn btn-outline closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Funds</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.closeModal').onclick = () => modal.remove();
    modal.querySelector('#fundsForm').onsubmit = async (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById('fundAmount').value);
      
      try {
        await api.put(`/goals/${id}`, { savedAmount: goal.savedAmount + amount });
        
        // Log transaction
        await api.post('/transactions', {
          amount,
          type: 'expense',
          category: 'Savings',
          desc: `Added to Goal: ${goal.name}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        
        if ((goal.savedAmount + amount) >= goal.targetAmount && typeof confetti === 'function') {
          confetti({ origin: { y: 0.7 } });
        }
        
        modal.remove();
        this.render();
      } catch (err) {
        alert(err.message);
      }
    };
  }
}
