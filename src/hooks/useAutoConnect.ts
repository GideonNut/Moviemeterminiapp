/**
 * useAutoConnect
 *
 * MiniPay requires Mini Apps to connect to the wallet automatically on page
 * load. Never show a "Connect wallet" button. This hook connects on mount
 * using the first available connector (which will be the injected connector
 * picking up MiniPay's window.ethereum).
 *
 * Reference: https://docs.minipay.xyz/getting-started/wallet-connection.html
 */
import { useEffect, useState } from "react";
import { useConnect, useConnectors } from "wagmi";

export function useAutoConnect() {
  const connectors = useConnectors();
  const { connect, error, isPending } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (hasAttempted || connectors.length === 0) return;

    const attemptConnect = async () => {
      try {
        // connectors[0] is injected() — MiniPay's window.ethereum
        await connect({ connector: connectors[0] });
      } catch (err) {
        console.error("Auto-connect failed:", err);
      }
      setHasAttempted(true);
    };

    attemptConnect();
  }, [connectors, connect, hasAttempted]);

  return { error, isPending };
}
