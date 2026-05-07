import React, { useEffect, useRef, useCallback } from 'react';

const ExitIntentDetector = ({ onExitIntent, enabled = true, children }) => {
  const hasTriggered = useRef(false);
  const timeoutRef = useRef(null);

  const handleMouseLeave = useCallback((e) => {
    if (!enabled || hasTriggered.current) return;
    // Only trigger when mouse leaves from the top of the viewport
    if (e.clientY <= 0) {
      hasTriggered.current = true;
      onExitIntent && onExitIntent('mouse_leave');
    }
  }, [enabled, onExitIntent]);

  const handleVisibilityChange = useCallback(() => {
    if (!enabled || hasTriggered.current) return;
    if (document.visibilityState === 'hidden') {
      // Small delay to avoid false positives from tab switching
      timeoutRef.current = setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          hasTriggered.current = true;
          onExitIntent && onExitIntent('tab_switch');
        }
      }, 2000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [enabled, onExitIntent]);

  const handleBeforeUnload = useCallback(() => {
    if (!enabled || hasTriggered.current) return;
    hasTriggered.current = true;
    onExitIntent && onExitIntent('page_close');
  }, [enabled, onExitIntent]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, handleMouseLeave, handleVisibilityChange, handleBeforeUnload]);

  // Reset trigger when enabled changes
  useEffect(() => {
    if (enabled) {
      hasTriggered.current = false;
    }
  }, [enabled]);

  return children || null;
};

export default ExitIntentDetector;
