import React, { useState } from 'react';
import TabBar from '../components/ui/TabBar';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { debtsOweMe, debtsIOwe } from '../dummy-data';
import './Debts.css';

export default function Debts() {
  const [activeTab, setActiveTab] = useState('owe_me');
  
  const tabs = [
    { id: 'owe_me', label: 'Owe Me 🟢 (2)' },
    { id: 'i_owe', label: 'I Owe 🔴 (1)' }
  ];

  const currentDebts = activeTab === 'owe_me' ? debtsOweMe : debtsIOwe;
  const accentColor = activeTab === 'owe_me' ? 'var(--green)' : 'var(--red)';

  return (
    <div className="debts-screen screen-padding">
      <header className="screen-header fu">
        <h2 className="header-amount">Debts 💳</h2>
      </header>

      <Card className="fu1" style={{ padding: '16px', marginBottom: '24px' }}>
        <div className="debt-summary">
          <div className="summary-item">
            <span className="summary-label">Owe Me</span>
            <span className="summary-val" style={{ color: 'var(--green)' }}>₹4,700</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <span className="summary-label">I Owe</span>
            <span className="summary-val" style={{ color: 'var(--red)' }}>₹800</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-item">
            <span className="summary-label">Net</span>
            <span className="summary-val" style={{ color: 'var(--green)' }}>+₹3,900</span>
          </div>
        </div>
      </Card>

      <div className="fu2" style={{ marginBottom: '20px' }}>
        <TabBar 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
          accentColor={accentColor} 
        />
      </div>

      <div className="debts-list fu3">
        {currentDebts.map((debt, i) => (
          <div key={i} className={`debt-card ${debt.overdue ? 'overdue' : ''}`}>
            {debt.overdue && <div className="debt-overdue-badge">OVERDUE</div>}
            
            <div className="debt-card-top">
              <div className="debt-person">
                <Avatar name={debt.person} />
                <div className="debt-person-info">
                  <span className="debt-name">{debt.person}</span>
                  <span className="debt-due">Due {debt.due}</span>
                </div>
              </div>
              <span className="debt-amount" style={{ color: accentColor }}>
                ₹{debt.amount.toLocaleString('en-IN')}
              </span>
            </div>
            
            <p className="debt-note">"{debt.note}"</p>
            
            <div className="debt-actions">
              <button className="debt-btn muted">Remind</button>
              <button className="debt-btn muted">Part Pay</button>
              <button className="debt-btn accent" style={{ background: `${accentColor}1a`, color: accentColor, borderColor: `${accentColor}40` }}>
                ✓ Paid
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="add-debt-btn fu4">
        + Add Debt
      </button>

      <div style={{ height: '40px' }}></div>
    </div>
  );
}
