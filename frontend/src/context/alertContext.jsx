import React, { createContext, useContext, useState, useRef } from 'react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' or 'confirm'
    message: '',
    title: '',
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // We use refs to store the promise resolvers so they persist across renders
  const resolveRef = useRef(null);

  const showAlert = (message, title = 'Alert') => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type: 'alert',
        message,
        title,
        confirmText: 'OK',
        cancelText: ''
      });
      resolveRef.current = resolve;
    });
  };

  const showConfirm = (message, title = 'Confirm', confirmText = 'Yes', cancelText = 'Cancel') => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        type: 'confirm',
        message,
        title,
        confirmText,
        cancelText
      });
      resolveRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  };

  const handleCancel = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  };

  return (
    <AlertContext.Provider value={{ alertState, showAlert, showConfirm, handleConfirm, handleCancel }}>
      {children}
    </AlertContext.Provider>
  );
};
