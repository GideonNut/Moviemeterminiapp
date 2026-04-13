"use client";

const opportunities = [
  {
    title: "Raising funding?",
    description:
      "Reach out to Verda Ventures with your deck and/or product demo to get support.",
    ctaLabel: "Email team@verda.ventures",
    ctaHref: "mailto:team@verda.ventures",
  },
  {
    title: "Still building?",
    description:
      "Register for Build With Celo: Proof-of-Ship and qualify for monthly builder rewards.",
    ctaLabel: "Register your project",
    ctaHref: "https://www.buildwithcelo.com",
  },
];

const features = [
  {
    title: "Phone Number Mapping",
    description: "Use mobile phone numbers as wallet addresses for simpler onboarding.",
  },
  {
    title: "Fast, Low-Cost Transactions",
    description: "Enable near-instant stablecoin transfers with sub-cent fees.",
  },
  {
    title: "Lightweight Wallet Design",
    description:
      "MiniPay is optimized for constrained devices and low-bandwidth environments.",
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
          Create a Mini App for the MiniPay stablecoin wallet
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          MiniPay is a stablecoin wallet with a built-in Mini App discovery page,
          integrated directly in Opera Mini and also available as a standalone
          app on Android and iOS. With 10M+ activated addresses, it is one of the
          fastest-growing non-custodial wallets in the Global South.
        </p>
        <p className="mt-4 text-base text-muted-foreground">
          Install MiniPay for{" "}
          <a
            className="font-medium text-primary underline underline-offset-4"
            href="https://play.google.com/store/apps/details?id=com.opera.minipay"
            rel="noreferrer"
            target="_blank"
          >
            Android
          </a>{" "}
          or{" "}
          <a
            className="font-medium text-primary underline underline-offset-4"
            href="https://apps.apple.com"
            rel="noreferrer"
            target="_blank"
          >
            iOS
          </a>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Why build on MiniPay?
        </h2>
        <div className="mt-4 space-y-4 text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Useful applications:</span>{" "}
            MiniPay prioritizes real everyday utility, especially for users in
            emerging markets.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Integrated app discovery:
            </span>{" "}
            Selected Mini Apps are available directly inside the wallet, so users
            can discover and use your app without switching platforms.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Access to Opera distribution:
            </span>{" "}
            Build for a large and growing audience through MiniPay and Opera
            browser reach.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Key features of MiniPay
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Opportunities for builders
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {opportunities.map((opportunity) => (
            <article key={opportunity.title} className="rounded-xl border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground">
                {opportunity.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {opportunity.description}
              </p>
              <a
                href={opportunity.ctaHref}
                className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4"
                rel="noreferrer"
                target={opportunity.ctaHref.startsWith("http") ? "_blank" : undefined}
              >
                {opportunity.ctaLabel}
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
