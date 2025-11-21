import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'moviemeter-onboarding-completed';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('[Onboarding] useEffect started');

    // Add a timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('[Onboarding] Timeout reached, forcing onboarding to show');
      setHasSeenOnboarding(false);
    }, 500); // Reduced to 500ms for faster fallback

    try {
      // Check if user has completed onboarding
      const completed = localStorage.getItem(ONBOARDING_KEY);
      console.log('[Onboarding] localStorage check:', completed);
      setHasSeenOnboarding(completed === 'true');
      clearTimeout(timeoutId); // Clear timeout if we successfully got the value
    } catch (error) {
      // localStorage might not be available in some contexts (e.g., miniapps)
      console.warn('[Onboarding] localStorage not available:', error);
      setHasSeenOnboarding(false);
      clearTimeout(timeoutId);
    }

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