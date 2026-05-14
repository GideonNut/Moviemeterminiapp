"use client";

import { usePathname } from "next/navigation";
import { useOnboarding } from "~/hooks/onboarding";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { hasSeenOnboarding, isLoading } = useOnboarding();
  const pathname = usePathname();

  // Home page manages its own full-screen layout — never wrap it
  if (pathname === "/") {
    return <>{children}</>;
  }

  // If still loading onboarding state, render children without layout
  if (isLoading) {
    return <>{children}</>;
  }

  // If user hasn't seen onboarding, render children without layout wrapper
  if (!hasSeenOnboarding) {
    return <>{children}</>;
  }

  // Normal layout for users who have completed onboarding
  return (
    <main className="pt-0 pb-4">{children}</main>
  );
}
