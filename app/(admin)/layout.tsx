"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MobileBar, Sidebar } from "@/components/Sidebar";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
    <div className="flex min-h-dvh">
      <Sidebar
        admin={admin}
        onLogout={logout}
        open={menuOpen}
        onClose={closeMenu}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar onMenu={() => setMenuOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
