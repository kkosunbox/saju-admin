"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Loading } from "@/components/ui";
import { useAdmin, useLogout } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { admin, checking, signedOut } = useAdmin();
  const logout = useLogout();

  useEffect(() => {
    if (signedOut) router.replace("/login");
  }, [signedOut, router]);

  if (checking || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading label="확인 중" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar admin={admin} onLogout={logout} />
      <main className="min-w-0 flex-1 px-8 py-7">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
