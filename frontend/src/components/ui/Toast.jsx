import React, { useEffect } from 'react';
import './Toast.css';

export default function Toast({ type = 'info', message, onClose }) {
  const types = {
    success: 'var(--green)',
    error: 'var(--red)',
    info: 'var(--blue)',
    warning: 'var(--gold)'
  };
  
  const color = types[type] || types.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast fu" style={{ borderColor: color, '--toast-accent': color }}>
      <div className="toast-accent"></div>
      <div className="toast-content">{message}</div>
    </div>
  );
}
