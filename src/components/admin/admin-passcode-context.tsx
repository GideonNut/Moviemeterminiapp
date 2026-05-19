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

export const ADMIN_PASSCODE_STORAGE_KEY = "admin-passcode";

type AdminPasscodeContextValue = {
  isUnlocked: boolean;
  isVerifying: boolean;
  error: string;
  unlock: (passcode: string) => Promise<boolean>;
  lock: () => void;
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
  const [passcode, setPasscode] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");

  const verifyPasscode = useCallback(async (code: string) => {
    const response = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { [ADMIN_PASSCODE_HEADER]: code },
    });
    const data = await response.json().catch(() => ({}));
    return response.ok && data.success === true;
  }, []);

  const unlock = useCallback(
    async (code: string) => {
      setIsVerifying(true);
      setError("");

      const trimmed = code.trim();
      if (!trimmed) {
        setError("Enter the admin passcode.");
        setIsVerifying(false);
        return false;
      }

      try {
        const valid = await verifyPasscode(trimmed);
        if (!valid) {
          sessionStorage.removeItem(ADMIN_PASSCODE_STORAGE_KEY);
          setPasscode(null);
          setIsUnlocked(false);
          setError("Invalid passcode.");
          return false;
        }

        sessionStorage.setItem(ADMIN_PASSCODE_STORAGE_KEY, trimmed);
        setPasscode(trimmed);
        setIsUnlocked(true);
        return true;
      } catch {
        setError("Could not verify passcode.");
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [verifyPasscode]
  );

  const lock = useCallback(() => {
    sessionStorage.removeItem(ADMIN_PASSCODE_STORAGE_KEY);
    setPasscode(null);
    setIsUnlocked(false);
    setError("");
  }, []);

  const adminFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const code =
        passcode ?? sessionStorage.getItem(ADMIN_PASSCODE_STORAGE_KEY);
      const headers = new Headers(init?.headers);
      if (code) {
        headers.set(ADMIN_PASSCODE_HEADER, code);
      }
      return fetch(input, { ...init, headers });
    },
    [passcode]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_PASSCODE_STORAGE_KEY);
    if (!saved) {
      setIsVerifying(false);
      return;
    }

    void (async () => {
      const valid = await verifyPasscode(saved);
      if (valid) {
        setPasscode(saved);
        setIsUnlocked(true);
      } else {
        sessionStorage.removeItem(ADMIN_PASSCODE_STORAGE_KEY);
      }
      setIsVerifying(false);
    })();
  }, [verifyPasscode]);

  const value = useMemo(
    () => ({
      isUnlocked,
      isVerifying,
      error,
      unlock,
      lock,
      adminFetch,
    }),
    [isUnlocked, isVerifying, error, unlock, lock, adminFetch]
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
