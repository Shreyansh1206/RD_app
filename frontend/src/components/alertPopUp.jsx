import React from 'react';
import { useAlert } from '../context/alertContext';
import './styles/alertPopUp.css';

const AlertPopUp = () => {
  const { alertState, handleConfirm, handleCancel } = useAlert();

  if (!alertState.isOpen) return null;

  return (
    <div className="alert-overlay" onClick={handleCancel}>
      <div className="alert-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="alert-popup-header">
          <h3>{alertState.title}</h3>
        </div>
        <div className="alert-popup-body">
          <p>{alertState.message}</p>
        </div>
        <div className="alert-popup-actions">
          {alertState.type === 'confirm' && (
            <button className="alert-btn cancel" onClick={handleCancel}>
              {alertState.cancelText}
            </button>
          )}
          <button className="alert-btn confirm" onClick={handleConfirm}>
            {alertState.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPopUp;
