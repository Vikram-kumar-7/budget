import React, { useState, useEffect } from 'react';
import BudgetMasterLogo from '../components/BudgetMasterLogo';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import IconBox from '../components/ui/IconBox';
import ProgressBar from '../components/ui/ProgressBar';
import { budgets, transactions, accounts } from '../dummy-data';
import './Dashboard.css';

// Hook for number counting animation
function useCountUp(end, duration = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(end); // Ensure float exactness at end if needed, here we just use floor so integer is fine
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

export default function Dashboard() {
  const balance = useCountUp(45200);

  return (
    <div className="dashboard-screen screen-padding">
      <header className="dash-header fu">
        <div className="dash-header-left">
          <BudgetMasterLogo size={30} />
          <div className="dash-header-title">
            <span className="dash-greeting">Good morning ☀️</span>
            <span className="dash-appname">BudgetMaster</span>
          </div>
        </div>
        <div className="dash-header-right">
          <Badge type="gold" text="🔒 4:32" />
          <div className="bell-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="bell-dot"></span>
          </div>
        </div>
      </header>

      <div className="hero-card fu1">
        <div className="hero-blob b1"></div>
        <div className="hero-blob b2"></div>
        <div className="hero-content">
          <span className="hero-label">APRIL 2025 BALANCE</span>
          <h2 className="hero-balance">₹{balance.toLocaleString('en-IN')}</h2>
          
          <div className="hero-split">
            <div className="hero-split-item">
              <div className="hero-split-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                Income
              </div>
              <span className="hero-split-val">₹82,000</span>
            </div>
            <div className="hero-split-divider"></div>
            <div className="hero-split-item">
              <div className="hero-split-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                Spent
              </div>
              <span className="hero-split-val">₹36,800</span>
            </div>
          </div>
        </div>
      </div>

      <div className="burn-rate-card fu2">
        <div className="burn-left">
          <span className="burn-label">Burn Rate</span>
          <div className="burn-amount"><span className="burn-num">₹1,250</span><span className="burn-day">/day</span></div>
        </div>
        <div className="burn-right">
          <Badge type="green" text="ON TRACK" />
          <ProgressBar percentage={68} height={5} />
        </div>
      </div>

      <section className="section fu3">
        <div className="section-header">
          <h3>Budgets</h3>
          <a href="#" className="view-all">View all →</a>
        </div>
        <Card>
          <div className="budget-list">
            {budgets.map((b, i) => {
              const p = Math.round((b.spent / b.limit) * 100);
              return (
                <div key={i} className="budget-row">
                  <div className="budget-row-top">
                    <div className="budget-info">
                      <IconBox icon={b.icon} color="#4C9AFF" size="sm" />
                      <span className="budget-name">{b.name}</span>
                    </div>
                    <div className="budget-stats">
                      <span className="budget-amounts">₹{b.spent} / ₹{b.limit}</span>
                      <Badge type={p >= 90 ? 'red' : p >= 70 ? 'gold' : 'green'} text={`${p}%`} />
                    </div>
                  </div>
                  <ProgressBar percentage={p} height={5} />
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="section fu4">
        <div className="section-header">
          <h3>Recent Transactions</h3>
          <a href="#" className="view-all">View all →</a>
        </div>
        <Card>
          <div className="tx-list">
            {transactions.map((tx, i) => (
              <div key={i} className="tx-row">
                <div className="tx-left">
                  <IconBox icon={tx.icon} color="#A78BFA" size="md" />
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
