import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useSessionTimer() {
  const { session, lastActivity, signOut } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number>(SESSION_TIMEOUT_MS);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (!session) {
      setTimeRemaining(SESSION_TIMEOUT_MS);
      setIsWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity.getTime();
      const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);
      setTimeRemaining(remaining);
      
      // Warning when 5 minutes left
      setIsWarning(remaining > 0 && remaining <= 5 * 60 * 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, lastActivity]);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isWarning,
    isActive: !!session,
  };
}
