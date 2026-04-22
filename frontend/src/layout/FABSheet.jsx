import React from 'react';
import BottomSheet from '../components/ui/BottomSheet';
import './FABSheet.css';

export default function FABSheet({ isOpen, onClose }) {
  const options = [
    { id: 'income', label: 'Add Income', icon: '💰', color: 'var(--green)', colorHex: '#10E8A0' },
    { id: 'expense', label: 'Add Expense', icon: '🛒', color: 'var(--red)', colorHex: '#FF5A6A' },
    { id: 'transfer', label: 'Transfer', icon: '🔄', color: 'var(--blue)', colorHex: '#4C9AFF' },
    { id: 'debt', label: 'New Debt', icon: '💳', color: 'var(--gold)', colorHex: '#FFB020' },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="fab-sheet-options">
        {options.map((opt, i) => (
          <button 
            key={opt.id} 
            className="fab-option-btn fu" 
            style={{ 
              animationDelay: `${i * 0.05}s`,
              '--bg-tint': `${opt.colorHex}0e`,
              '--border-tint': `${opt.colorHex}28`
            }}
          >
            <span className="fab-option-icon">{opt.icon}</span>
            <span className="fab-option-label">{opt.label}</span>
          </button>
        ))}
        <button className="fab-cancel-btn fu" style={{ animationDelay: '0.2s' }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </BottomSheet>
  );
}
