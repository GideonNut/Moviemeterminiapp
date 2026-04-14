"use client";

const checklist = [
  "Run the app over HTTPS in production and verify all routes load inside in-app browsers.",
  "Default onchain interactions to Celo mainnet (chainId 42220) for MiniPay users.",
  "Keep transaction copy simple and always show token + amount before confirmation.",
  "Test wallet connect, vote flow, watchlist flow, and rewards flow on a real mobile device.",
  "Add graceful fallback UI if a wallet connection is unavailable or rejected.",
];

const references = [
  {
    title: "MiniPay Builder Guide",
    href: "https://docs.minipay.xyz",
    label: "Read docs.minipay.xyz",
  },
  {
    title: "Build with Celo",
    href: "https://www.buildwithcelo.com",
    label: "Apply for builder program",
  },
  {
    title: "Celo Network Docs",
    href: "https://docs.celo.org",
    label: "Review Celo integration docs",
  },
];

export default function BuildOnMiniPayPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Build for MiniPay
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ship MovieMeter as a MiniPay-ready mini app
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          This app already includes wallet connectors and Celo chain support.
          Use this page as the implementation checklist to finish productionizing
          the MiniPay experience end-to-end.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground">
          App-specific implementation steps
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted-foreground">
          <li>
            Confirm `WagmiProvider` keeps Celo mainnet (`42220`) as the primary
            chain for transaction flows.
          </li>
          <li>
            Validate that your connect flow works with injected providers and
            Mini App connectors inside mobile in-app browsers.
          </li>
          <li>
            Keep contract interactions idempotent and guard against duplicate
            taps while a transaction is pending.
          </li>
          <li>
            For rewards, surface clear states: pending signature, submitted,
            confirmed, and failed with retry guidance.
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Release checklist
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
          {checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Builder resources
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {references.map((reference) => (
            <article key={reference.title} className="rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold text-foreground">
                {reference.title}
              </h3>
              <a
                href={reference.href}
                className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4"
                rel="noreferrer"
                target="_blank"
              >
                {reference.label}
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
