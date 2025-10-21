import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'moviemeter-onboarding-completed';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasSeenOnboarding(completed === 'true');
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasSeenOnboarding(false);
  };

  return {
    hasSeenOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoading: hasSeenOnboarding === null
  };
}