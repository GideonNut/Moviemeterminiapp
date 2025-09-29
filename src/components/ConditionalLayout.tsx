"use client";

import { useOnboarding } from "~/hooks/onboarding";
import BottomNav from "~/components/BottomNav";
import FarcasterReady from "~/components/FarcasterReady";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { hasSeenOnboarding, isLoading } = useOnboarding();

  // If still loading onboarding state, render children without layout
  if (isLoading) {
    return <>{children}</>;
  }

  // If user hasn't seen onboarding, render children without layout wrapper
  if (!hasSeenOnboarding) {
    return (
      <>
        <FarcasterReady />
        {children}
      </>
    );
  }

  // Normal layout for users who have completed onboarding
  return (
    <>
      <FarcasterReady />
      <main className="pt-32 pb-16">{children}</main>
      <BottomNav />
    </>
  );
}
