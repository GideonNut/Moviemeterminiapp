"use client";

import { useEffect, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { createStore } from "mipd";
import React from "react";

interface FrameContextType {
  isSDKLoaded: boolean;
  context: any;
  openUrl: (url: string) => Promise<void>;
  close: () => Promise<void>;
  added: boolean;
  notificationDetails: any;
  lastEvent: string;
  addFrame: () => Promise<void>;
  addFrameResult: string;
}

const FrameContext = React.createContext<FrameContextType | undefined>(undefined);

export function useFrame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<any>(null);
  const [lastEvent, setLastEvent] = useState("");
  const [addFrameResult, setAddFrameResult] = useState("");

  // SDK actions only work in mini app clients, so this pattern supports browser actions as well
  const openUrl = useCallback(async (url: string) => {
    if (context) {
      await sdk.actions.openUrl(url);
    } else {
      window.open(url, '_blank');
    }
  }, [context]);

  const close = useCallback(async () => {
    if (context) {
      await sdk.actions.close();
    } else {
      window.close();
    }
  }, [context]);

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null);
      const result = await sdk.actions.addFrame();

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails);
      }
      setAddFrameResult(
        result.notificationDetails
          ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
          : "Added, got no notification details"
      );
    } catch (error: any) {
      setAddFrameResult(`Error: ${error.message || error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      // The new miniapp-sdk may not have sdk.context, so skip context for now
      setIsSDKLoaded(true);
      // Call ready action
      console.log("Calling ready");
      await sdk.actions.ready();
      // Set up MIPD Store (optional, can be removed if not needed)
      const store = createStore();
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
      });
    };

    if (!isSDKLoaded) {
      load();
      return () => {
        if (sdk.removeAllListeners) sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  return {
    isSDKLoaded,
    context,
    openUrl,
    close,
    added,
    notificationDetails,
    lastEvent,
    addFrame,
    addFrameResult,
  };
}

export function FrameProvider({ children }: { children: React.ReactNode }) {
  const frameContext = useFrame();

  if (!frameContext.isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <FrameContext.Provider value={frameContext}>
      {children}
    </FrameContext.Provider>
  );
} 