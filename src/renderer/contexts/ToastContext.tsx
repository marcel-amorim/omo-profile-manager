import React, { useState, useCallback, ReactNode } from 'react';
import { ToastContext, ToastMessage, ToastType } from './toast-context';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => toast('success', message, duration), [toast]);
  const error = useCallback((message: string, duration?: number) => toast('error', message, duration), [toast]);
  const warning = useCallback((message: string, duration?: number) => toast('warning', message, duration), [toast]);
  const info = useCallback((message: string, duration?: number) => toast('info', message, duration), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
