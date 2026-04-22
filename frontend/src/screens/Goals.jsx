import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { goals } from '../dummy-data';
import './Goals.css';

export default function Goals() {
  return (
    <div className="goals-screen screen-padding">
      <header className="screen-header fu">
        <h2 className="header-amount">Goals 🎯</h2>
        <span className="header-subtitle">₹133,500 total saved</span>
      </header>

      <Card className="fu1">
        <div className="overall-goal-top">
          <span className="overall-label">Overall Progress</span>
          <span className="overall-percent">45%</span>
        </div>
        <div className="overall-bar">
          <div className="overall-bar-fill"></div>
        </div>
      </Card>

      <div className="goals-grid fu2">
        {goals.map((g, i) => {
          const p = Math.round((g.saved / g.target) * 100);
          return (
            <div key={i} className="goal-card">
              <div className="goal-card-icon">{g.icon}</div>
              <h4 className="goal-card-name">{g.name}</h4>
              <p className="goal-card-amounts">₹{g.saved.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}</p>
              
              <div className="goal-card-progress">
                <ProgressBar percentage={p} height={6} color={g.color} />
              </div>

              <div className="goal-card-badges">
                <Badge type="blue" text={`${p}%`} style={{ background: `${g.color}1a`, color: g.color }} />
                {g.daysLeft && <Badge type="gold" text={`${g.daysLeft}d left`} />}
              </div>

              <button className="goal-add-btn" style={{ color: g.color, background: `${g.color}1a` }}>
                Add Money
              </button>
            </div>
          );
        })}
        
        <div className="goal-card add-goal-card">
          <div className="add-goal-icon">+</div>
          <span className="add-goal-text">New Goal</span>
        </div>
      </div>

      <div style={{ height: '40px' }}></div>
    </div>
  );
}
