// src/components/CustomAlert.jsx

import React from 'react';
import '../css/CustomAlert.css';

const CustomAlert = ({ message, onClose, type = 'warning' }) => {
  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className="custom-alert-box" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-icon ${type}`}>
          {type === 'warning' && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {type === 'error' && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
          {type === 'info' && (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <div className="alert-content">
          <h3 className="alert-title">
            {type === 'warning' && 'Out of Stock'}
            {type === 'error' && 'Error'}
            {type === 'info' && 'Information'}
          </h3>
          <p className="alert-message">{message}</p>
        </div>
        <button className="alert-ok-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;
