"use client";

import { AdminPasscodeGate } from "~/components/admin/AdminPasscodeGate";
import { AdminPasscodeProvider } from "~/components/admin/admin-passcode-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminPasscodeProvider>
      <AdminPasscodeGate>{children}</AdminPasscodeGate>
    </AdminPasscodeProvider>
  );
}
