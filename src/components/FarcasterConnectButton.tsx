"use client";

import { useState } from "react";
import { useFarcasterAuth } from "~/contexts/FarcasterAuthContext";
import { Button } from "./ui/Button";

export function FarcasterConnectButton() {
  const { user, isConnected, isLoading, connect, disconnect } = useFarcasterAuth();
  const [localLoading, setLocalLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLocalLoading(true);
      await connect();
    } catch (err) {
      console.error("Farcaster connect error:", err);
      alert("Failed to connect Farcaster. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };

  const loading = isLoading || localLoading;

  return (
    <div className="flex items-center gap-3">
      {isConnected && user ? (
        <>
          <div className="flex items-center gap-2 text-sm text-white/80">
            {user.pfp && (
              <img
                src={user.pfp}
                alt={user.username || `fid-${user.fid}`}
                className="h-8 w-8 rounded-full object-cover border border-white/10"
              />
            )}
            <div className="leading-tight">
              <div className="font-semibold text-white">
                {user.displayName || user.username || `fid ${user.fid}`}
              </div>
              <div className="text-xs text-white/60">
                FID: {user.fid}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={disconnect}
            disabled={loading}
          >
            Disconnect
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          onClick={handleConnect}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Connecting..." : "Connect Farcaster Wallet"}
        </Button>
      )}
    </div>
  );
}

