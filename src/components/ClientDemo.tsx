"use client";

import dynamic from "next/dynamic";

// note: dynamic import is required for components that use the Frame SDK
const Demo = dynamic(() => import("~/components/Demo").then(mod => mod.Demo), {
  ssr: false,
});

export default function ClientDemo() {
  return <Demo />;
} 