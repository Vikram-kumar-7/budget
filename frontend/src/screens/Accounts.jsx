import React from 'react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import IconBox from '../components/ui/IconBox';
import { accounts, transactions } from '../dummy-data';
import './Accounts.css';

export default function Accounts() {
  return (
    <div className="accounts-screen">
      <header className="screen-header screen-padding fu">
        <span className="header-label">TOTAL NET WORTH</span>
        <h2 className="header-amount">₹32,800</h2>
        <span className="header-trend">↑ 12.4% this month</span>
      </header>

      <div className="accounts-scroller fu1">
        {accounts.map(acc => (
          <div className="acc-card" key={acc.id} style={{
            '--acc-color': acc.color,
            background: `linear-gradient(145deg, ${acc.color}1a, ${acc.color}08)`
          }}>
            <div className="acc-card-top">
              <span className="acc-icon">{acc.icon}</span>
              <Badge type={acc.balance < 0 ? 'red' : 'blue'} text={acc.type} />
            </div>
            <div className="acc-card-bottom">
              <span className="acc-name">{acc.name}</span>
              <span className={`acc-balance ${acc.balance < 0 ? 'negative' : ''}`}>
                ₹{Math.abs(acc.balance).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
        <div className="acc-card add-acc-card">
          <div className="add-icon">+</div>
          <span className="acc-name">Add Account</span>
        </div>
      </div>

      <div className="screen-padding fu2">
        <button className="transfer-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="14" x2="21" y2="3"></line><polyline points="8 21 3 21 3 16"></polyline><line x1="20" y1="10" x2="3" y2="21"></line></svg>
          Transfer Between Accounts
        </button>
      </div>

      <section className="section screen-padding fu3">
        <h3 className="section-title">Recent Activity</h3>
        <Card>
          <div className="tx-list">
            {transactions.slice(0, 3).map((tx, i) => (
              <div key={i} className="tx-row">
                <div className="tx-left">
                  <IconBox icon={tx.icon} color="#4C9AFF" size="md" />
                  <div className="tx-details">
                    <span className="tx-name">{tx.name}</span>
                    <span className="tx-meta">{tx.category} • {tx.time}</span>
                  </div>
                </div>
                <span className={`tx-amount ${tx.amount > 0 ? 'positive' : ''}`}>
                  {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <div style={{ height: '40px' }}></div>
    </div>
  );
}
