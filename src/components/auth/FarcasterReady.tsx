"use client";
import { useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export default function FarcasterReady() {
  const readyCalledRef = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const callReady = async () => {
      if (readyCalledRef.current) return;
      
      try {
        if (typeof window === 'undefined') return;
        
        // Check if SDK is available
        if (!sdk || !sdk.actions || typeof sdk.actions.ready !== 'function') {
          console.log('[FarcasterReady] SDK not available yet');
          return false;
        }
        
        console.log('[FarcasterReady] Calling sdk.actions.ready()...');
        await sdk.actions.ready();
        readyCalledRef.current = true;
        console.log('[FarcasterReady] ✅ SUCCESS: ready() called - splash should dismiss');
        
        // Clear all timeouts since we succeeded
        timeoutRefs.current.forEach(id => clearTimeout(id));
        timeoutRefs.current = [];
        
        return true;
      } catch (error: any) {
        console.error('[FarcasterReady] ❌ ERROR calling ready():', error?.message || error);
        console.error('[FarcasterReady] Full error:', error);
        return false;
      }
    };

    // Strategy: Call ready() as soon as possible, but also after content renders
    const scheduleCall = (fn: () => void, delay?: number) => {
      if (delay) {
        const id = setTimeout(fn, delay);
        timeoutRefs.current.push(id);
      } else {
        fn();
      }
    };

    // Try multiple times:
    scheduleCall(callReady); // Immediate
    scheduleCall(callReady, 10); // After 10ms (SDK might need initialization)
    scheduleCall(callReady, 50); // After 50ms
    scheduleCall(callReady, 100); // After 100ms (content might be rendering)
    scheduleCall(callReady, 200); // After 200ms
    scheduleCall(callReady, 500); // Final fallback

    // Also try on DOM events
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[FarcasterReady] DOMContentLoaded fired');
        callReady();
      }, { once: true });
    } else {
      scheduleCall(callReady);
    }

    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        console.log('[FarcasterReady] Window load fired');
        callReady();
      }, { once: true });
    }

    // Cleanup
    return () => {
      timeoutRefs.current.forEach(id => clearTimeout(id));
      timeoutRefs.current = [];
    };
  }, []);

  return null;
}
