import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'moviemeter-onboarding-completed';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Add a timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (hasSeenOnboarding === null) {
        console.warn('Onboarding check timed out, defaulting to false');
        setHasSeenOnboarding(false);
      }
    }, 1000); // 1 second timeout

    try {
      // Check if user has completed onboarding
      const completed = localStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(completed === 'true');
    } catch (error) {
      // localStorage might not be available in some contexts (e.g., miniapps)
      console.warn('localStorage not available, skipping onboarding check:', error);
      setHasSeenOnboarding(false);
    }

    return () => clearTimeout(timeoutId);
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