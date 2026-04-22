import React from 'react';
import './TabBar.css';

export default function TabBar({ tabs, activeTab, onChange, accentColor = 'var(--green)' }) {
  return (
    <div className="tab-bar">
      {tabs.map((tab, index) => (
        <button
          key={index}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
          style={{
            '--tab-active-bg': accentColor,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
