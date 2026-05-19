"use client";

/**
 * MiniPayGate
 *
 * Checks that window.ethereum is available AND window.ethereum.isMiniPay is
 * true before rendering the app, as required by MiniPay best-practices.
 *
 * Dev bypass: set NEXT_PUBLIC_MINIPAY_DEV_BYPASS=true in .env.local to skip
 * the gate during local development so you can test without a real device.
 *
 * References:
 *   https://docs.celo.org/build-on-celo/build-on-minipay/quickstart
 */
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

/** Admin is the only section meant to run in a normal desktop/mobile browser. */
function isAdminPath(pathname: string | null) {
  return pathname?.startsWith("/admin") ?? false;
}

export function MiniPayGate({ children }: Props) {
  const pathname = usePathname();
  const adminRoute = isAdminPath(pathname);
  const [status, setStatus] = useState<"loading" | "ok" | "no-provider">(
    adminRoute ? "ok" : "loading"
  );

  useEffect(() => {
    if (adminRoute) {
      setStatus("ok");
      return;
    }

    if (typeof window === "undefined") return;

    // Allow bypass in dev mode so you can test without a MiniPay device
    const devBypass = process.env.NEXT_PUBLIC_MINIPAY_DEV_BYPASS === "true";
    if (devBypass) {
      setStatus("ok");
      return;
    }

    const eth = window.ethereum as any;
    if (eth && eth.isMiniPay) {
      setStatus("ok");
    } else {
      setStatus("no-provider");
    }
  }, [adminRoute]);

  // /admin (and /admin/*) bypass MiniPay — passcode + wallet connect only
  if (adminRoute) {
    return <>{children}</>;
  }

  if (status === "loading") return null;

  if (status === "no-provider") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="text-4xl">📱</div>
        <h1 className="text-xl font-bold text-foreground">Open in MiniPay</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          MovieMeter must be opened from the{" "}
          <span className="font-semibold text-foreground">MiniPay</span> app to
          access your wallet. Find it in the MiniPay Discover page.
        </p>
        <a
          href="https://www.opera.com/products/minipay"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs underline text-muted-foreground"
        >
          Download MiniPay →
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
