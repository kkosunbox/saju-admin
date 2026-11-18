"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MobileBar, Sidebar, menuLabelOf } from "@/components/Sidebar";
import { Loading } from "@/components/ui";
import { api } from "@/lib/api";
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

  // 화면(경로)을 열 때마다 조회 기록을 남긴다. 같은 경로를 연달아 두 번 남기지 않고, 실패해도 화면엔 영향 없음.
  const pathname = usePathname();
  const loggedPath = useRef<string | null>(null);
  useEffect(() => {
    if (!admin || loggedPath.current === pathname) return;
    loggedPath.current = pathname;
    api
      .logAccess({
        path: `${pathname}${window.location.search}`.slice(0, 500),
        menu: menuLabelOf(pathname),
      })
      .catch(() => {});
  }, [admin, pathname]);

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
