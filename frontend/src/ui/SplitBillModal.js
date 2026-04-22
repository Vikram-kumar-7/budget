import { api } from '../services/api';

export class SplitBillModal {
  constructor(onSave) {
    this.onSave = onSave;
    this.participants = [];
  }

  show() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <h2 style="margin-bottom: 10px;">Split Bill Calculator</h2>
        <p style="color: var(--text-sub); font-size: 0.9rem; margin-bottom: 25px;">Divide expenses and track who owes you</p>
        
        <form id="splitForm">
          <input type="text" id="billTitle" placeholder="Bill Title (e.g. Dinner at Joe's)" required>
          <input type="number" id="billTotal" placeholder="Total Amount" required>
          
          <div style="margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="font-size: 1rem;">Participants</h3>
              <button type="button" class="btn btn-sm btn-outline" id="addParticipant">
                <i class="ph-bold ph-plus"></i> Add Person
              </button>
            </div>
            <div id="participantsList" style="display: grid; gap: 10px; max-height: 200px; overflow-y: auto; padding-right: 5px;"></div>
          </div>

          <div id="splitResult" class="glass-card" style="display: none; padding: 15px; margin-bottom: 20px; border: 1px dashed var(--primary);">
            <p style="font-size: 0.9rem; color: var(--text-sub);">Each person owes:</p>
            <div id="perPersonAmount" class="big-num" style="font-size: 1.5rem;">$0.00</div>
          </div>

          <div class="modal-btns">
            <button type="button" class="btn btn-outline closeModal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="saveAsDebtBtn" disabled>Save as Debts</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);
    this.setupListeners(overlay);
  }

  setupListeners(overlay) {
    const list = overlay.querySelector('#participantsList');
    const addBtn = overlay.querySelector('#addParticipant');
    const totalInput = overlay.querySelector('#billTotal');
    const saveBtn = overlay.querySelector('#saveAsDebtBtn');
    const resultDiv = overlay.querySelector('#splitResult');

    addBtn.onclick = () => {
      const id = Date.now();
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.innerHTML = `
        <input type="text" placeholder="Name" class="p-name" required style="margin-bottom: 0;">
        <button type="button" class="icon-btn remove-p" style="color: var(--danger)"><i class="ph-bold ph-x"></i></button>
      `;
      div.querySelector('.remove-p').onclick = () => {
        div.remove();
        this.calculate(overlay);
      };
      list.appendChild(div);
      this.calculate(overlay);
    };

    totalInput.oninput = () => this.calculate(overlay);
    overlay.oninput = () => this.calculate(overlay);

    overlay.querySelector('.closeModal').onclick = () => overlay.remove();
    
    overlay.querySelector('#splitForm').onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('billTitle').value;
      const total = parseFloat(totalInput.value);
      const pElements = list.querySelectorAll('div');
      const perPerson = total / (pElements.length + 1); // +1 for "Me"

      for (const p of pElements) {
        const name = p.querySelector('.p-name').value;
        await api.post('/debts', {
          person: name,
          amount: perPerson,
          type: 'owed_to_me',
          note: `Split: ${title}`,
          dueDate: new Date().toISOString().split('T')[0]
        });
      }

      alert(`Splitted with ${pElements.length} people. Debts created!`);
      overlay.remove();
      if(this.onSave) this.onSave();
    };
  }

  calculate(overlay) {
    const total = parseFloat(overlay.querySelector('#billTotal').value);
    const count = overlay.querySelectorAll('.p-name').length;
    const resultDiv = overlay.querySelector('#splitResult');
    const perPersonEl = overlay.querySelector('#perPersonAmount');
    const saveBtn = overlay.querySelector('#saveAsDebtBtn');

    if (total > 0 && count > 0) {
      const perPerson = total / (count + 1);
      perPersonEl.innerText = perPerson.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
      resultDiv.style.display = 'block';
      saveBtn.disabled = false;
    } else {
      resultDiv.style.display = 'none';
      saveBtn.disabled = true;
    }
  }
}
