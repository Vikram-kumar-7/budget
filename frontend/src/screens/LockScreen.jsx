import React, { useState, useEffect } from 'react';
import BudgetMasterLogo from '../components/BudgetMasterLogo';
import './LockScreen.css';

export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState([]);
  const [errorIndex, setErrorIndex] = useState(0);
  const correctPin = '1234';

  const handlePadClick = (num) => {
    if (pin.length < 4) {
      setPin(prev => [...prev, num]);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 4) {
      const pinStr = pin.join('');
      if (pinStr === correctPin) {
        setTimeout(() => onUnlock(), 300);
      } else {
        // Error state
        setErrorIndex(prev => prev + 1);
        setTimeout(() => setPin([]), 400); // clear after short delay
      }
    }
  }, [pin, onUnlock]);

  return (
    <div className="lock-screen">
      <div className="lock-glow"></div>
      
      <div className="lock-header">
        <BudgetMasterLogo size={100} animate loop />
        <h1 className="lock-title fu">BudgetMaster</h1>
        <p className="lock-subtitle fu1">ENTER PIN</p>
      </div>

      <div className={`lock-dots fu2 ${errorIndex > 0 ? 'shake-anim' : ''}`} key={errorIndex}>
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`lock-dot ${pin.length > i ? 'filled pop-in' : ''} ${errorIndex > 0 && pin.length === 4 ? 'error' : ''}`} 
          />
        ))}
      </div>
      
      <div className="lock-numpad fu3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} className="numpad-btn" onClick={() => handlePadClick(num)}>
            {num}
          </button>
        ))}
        <div className="numpad-btn-slot"></div>
        <button className="numpad-btn" onClick={() => handlePadClick(0)}>0</button>
        <button className="numpad-btn backspace-btn" onClick={handleBackspace}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
            <line x1="18" y1="9" x2="12" y2="15"></line>
            <line x1="12" y1="9" x2="18" y2="15"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
