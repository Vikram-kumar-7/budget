import { api } from '../services/api';

export class Reports {
  constructor(container, user) {
    this.container = container;
    this.user = user;
    this.currency = user.currency || '₹';
  }

  async render() {
    this.container.innerHTML = `
      <div style="margin-bottom: 30px;">
        <h1 style="font-size: 2.2rem; font-weight: 800;">Financial Reports</h1>
        <p style="color: var(--text-sub)">Export your data for accounting</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px;">
        <div class="card">
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; background: rgba(239, 68, 68, 0.1); color: var(--danger); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              <i class="ph-bold ph-file-pdf"></i>
            </div>
            <div>
              <h3 style="font-size: 1.1rem;">PDF Statement</h3>
              <p style="font-size: 0.85rem; color: var(--text-sub);">Formal account statement</p>
            </div>
          </div>
          <button class="btn btn-outline" id="downloadPdf" style="width: 100%;">Download PDF</button>
        </div>

        <div class="card">
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; background: rgba(16, 185, 129, 0.1); color: var(--success); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
              <i class="ph-bold ph-file-csv"></i>
            </div>
            <div>
              <h3 style="font-size: 1.1rem;">CSV Export</h3>
              <p style="font-size: 0.85rem; color: var(--text-sub);">Raw data for Excel/Sheets</p>
            </div>
          </div>
          <button class="btn btn-outline" id="downloadCsv" style="width: 100%;">Export CSV</button>
        </div>
      </div>
    `;

    document.getElementById('downloadPdf').addEventListener('click', () => this.generatePdf());
    // CSV logic can be added similarly
  }

  async generatePdf() {
    const txs = await api.get('/transactions');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("BudgetMaster Account Statement", 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);

    const rows = txs.map(t => [t.date, t.desc, t.category, t.type, t.amount.toFixed(2)]);
    
    doc.autoTable({
      startY: 40,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: rows,
    });

    doc.save(`BudgetMaster_Report_${new Date().toLocaleDateString()}.pdf`);
  }
}
