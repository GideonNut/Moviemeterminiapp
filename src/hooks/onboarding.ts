import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'moviemeter-onboarding-completed';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('[Onboarding] useEffect started');

    let timeoutId: NodeJS.Timeout;
    let isResolved = false;

    const resolveOnboarding = (value: boolean) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        setHasSeenOnboarding(value);
      }
    };

    // Check localStorage immediately
    try {
      // Check if user has completed onboarding
      if (typeof window !== 'undefined') {
        const completed = localStorage.getItem(ONBOARDING_KEY);
        console.log('[Onboarding] localStorage check:', completed);
        resolveOnboarding(completed === 'true');
      } else {
        // SSR fallback
        resolveOnboarding(false);
      }
    } catch (error) {
      // localStorage might not be available in some contexts (e.g., miniapps)
      console.warn('[Onboarding] localStorage not available:', error);
      resolveOnboarding(false);
    }

    // Add a timeout fallback to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        console.warn('[Onboarding] Timeout reached, forcing onboarding to show');
        resolveOnboarding(false);
      }
    }, 200); // 200ms timeout fallback

    return () => {
      console.log('[Onboarding] Cleanup');
      clearTimeout(timeoutId);
    };
  }, []);

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
      // Still mark as completed in memory even if we can't persist it
      setHasSeenOnboarding(true);
    }
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      setHasSeenOnboarding(false);
    } catch (error) {
      console.warn('Failed to reset onboarding state:', error);
      setHasSeenOnboarding(false);
    }
  };

  return {
    hasSeenOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoading: hasSeenOnboarding === null
  };
}