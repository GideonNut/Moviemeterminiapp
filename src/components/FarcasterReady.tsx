"use client";
import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export default function FarcasterReady() {
  useEffect(() => {
    // Call ready as soon as possible to dismiss the Farcaster splash screen
    const callReady = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') return;
        
        // Check if SDK is available
        if (!sdk || !sdk.actions) {
          console.warn('[FarcasterReady] SDK not available, might not be in Farcaster context');
          return;
        }
        
        // Call ready immediately - this dismisses the splash screen
        await sdk.actions.ready();
        console.log('[FarcasterReady] Splash screen dismissed');
      } catch (error) {
        console.error('[FarcasterReady] Error calling ready:', error);
        // Don't throw - allow the app to continue loading even if ready() fails
      }
    };

    // Call immediately, with a small fallback delay to ensure SDK is initialized
    callReady();
    
    // Also try again after a short delay in case SDK wasn't ready initially
    const timeoutId = setTimeout(() => {
      callReady();
    }, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
