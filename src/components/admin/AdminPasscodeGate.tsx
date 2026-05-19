"use client";

import { useState } from "react";
import { useAdminPasscode } from "./admin-passcode-context";

export function AdminPasscodeGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked, isVerifying, isConfigured, error, unlock, lock } =
    useAdminPasscode();
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await unlock(passcode);
    setSubmitting(false);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-white/60">Checking access…</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-[#18181B] border border-white/10 rounded-lg p-6"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Admin access</h1>
          <p className="text-sm text-white/60 mb-4">
            Enter the passcode set in{" "}
            <code className="text-white/80">ADMIN_PASSCODE</code>.
          </p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Admin passcode"
            className="w-full p-3 rounded bg-[#2D2D33] text-white border border-white/10 focus:border-blue-500 focus:outline-none mb-4"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={submitting || !isConfigured}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Unlock admin"}
          </button>
          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          {!isConfigured ? (
            <p className="mt-3 text-xs text-amber-400">
              Server passcode is missing. Restart the dev server after adding{" "}
              <code>ADMIN_PASSCODE</code> to <code>.env</code>.
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => void lock()}
          className="text-sm text-white/60 hover:text-white border border-white/20 rounded-lg px-3 py-1.5 bg-[#18181B]/90 backdrop-blur"
        >
          Lock admin
        </button>
      </div>
      {children}
    </>
  );
}
