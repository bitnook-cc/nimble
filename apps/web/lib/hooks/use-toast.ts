import { useState, useCallback } from 'react';
import { APP_CONFIG } from '@/lib/config/app-config';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, title, description, variant };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    
    // For now, also use browser notification API as fallback
    if (typeof window !== 'undefined') {
      const message = description ? `${title}\n${description}` : title;
      
      // Check if we're in a browser environment
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(APP_CONFIG.APP_NAME, { body: message });
      } else {
        // Fallback to console for now
        console.log(`[Toast] ${variant === 'destructive' ? '❌' : '✅'} ${message}`);
      }
    }
  }, []);

  return { toast, toasts };
}