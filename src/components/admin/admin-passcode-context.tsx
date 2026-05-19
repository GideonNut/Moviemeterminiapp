"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ADMIN_PASSCODE_HEADER } from "~/lib/admin-passcode";

type AdminPasscodeContextValue = {
  isUnlocked: boolean;
  isVerifying: boolean;
  isConfigured: boolean;
  error: string;
  unlock: (passcode: string) => Promise<boolean>;
  lock: () => Promise<void>;
  adminFetch: (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => Promise<Response>;
};

const AdminPasscodeContext = createContext<AdminPasscodeContextValue | null>(
  null
);

export function AdminPasscodeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [error, setError] = useState("");

  const checkSession = useCallback(async () => {
    const response = await fetch("/api/admin/session", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return {
      configured: data.configured !== false,
      authenticated: Boolean(data.authenticated),
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const session = await checkSession();
        setIsConfigured(session.configured);
        setIsUnlocked(session.authenticated);
        if (!session.configured) {
          setError(
            "ADMIN_PASSCODE is not set on the server. Add it to .env and restart."
          );
        }
      } catch {
        setError("Could not verify admin session.");
        setIsUnlocked(false);
      } finally {
        setIsVerifying(false);
      }
    })();
  }, [checkSession]);

  const unlock = useCallback(async (code: string) => {
    setIsVerifying(true);
    setError("");

    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter the admin passcode.");
      setIsVerifying(false);
      return false;
    }

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        credentials: "include",
        headers: { [ADMIN_PASSCODE_HEADER]: trimmed },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setIsUnlocked(false);
        setError(data.error || "Invalid passcode.");
        return false;
      }

      setIsConfigured(true);
      setIsUnlocked(true);
      return true;
    } catch {
      setError("Could not verify passcode.");
      setIsUnlocked(false);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const lock = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Still clear local unlock state if logout request fails.
    }
    setIsUnlocked(false);
    setError("");
  }, []);

  const adminFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        credentials: "include",
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      isUnlocked,
      isVerifying,
      isConfigured,
      error,
      unlock,
      lock,
      adminFetch,
    }),
    [isUnlocked, isVerifying, isConfigured, error, unlock, lock, adminFetch]
  );

  return (
    <AdminPasscodeContext.Provider value={value}>
      {children}
    </AdminPasscodeContext.Provider>
  );
}

export function useAdminPasscode() {
  const context = useContext(AdminPasscodeContext);
  if (!context) {
    throw new Error("useAdminPasscode must be used within AdminPasscodeProvider");
  }
  return context;
}
