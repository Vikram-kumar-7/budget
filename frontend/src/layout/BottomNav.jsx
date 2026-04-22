import React from 'react';
import './BottomNav.css';

const HomeIcon = ({ isActive }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? 'var(--green)' : 'none'} stroke={isActive ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const AccountsIcon = ({ isActive }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? 'var(--green)' : 'none'} stroke={isActive ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
    <line x1="2" y1="10" x2="22" y2="10"></line>
  </svg>
);

const GoalsIcon = ({ isActive }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? 'var(--green)' : 'none'} stroke={isActive ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const DebtsIcon = ({ isActive }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? 'var(--green)' : 'none'} stroke={isActive ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

export default function BottomNav({ activeScreen, onChange, onFabClick }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: HomeIcon },
    { id: 'accounts', label: 'Accounts', icon: AccountsIcon },
    { id: 'fab', label: '', isFab: true },
    { id: 'goals', label: 'Goals', icon: GoalsIcon },
    { id: 'debts', label: 'Debts', icon: DebtsIcon }
  ];

  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav">
        {tabs.map(tab => {
          if (tab.isFab) {
            return (
              <div key="fab" className="nav-item fab-slot">
                <button className="fab-nav-button" onClick={onFabClick}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            );
          }

          const isActive = activeScreen === tab.id;
          const Icon = tab.icon;

          return (
            <button key={tab.id} className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => onChange(tab.id)}>
              <div className="nav-icon-wrapper">
                <Icon isActive={isActive} />
                {isActive && <div className="nav-indicator fu"></div>}
              </div>
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
