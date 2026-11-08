"use client";

import clsx from "clsx";
import {
  Bot,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MousePointerClick,
  Repeat,
  Settings,
  TextQuote,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Admin } from "@/lib/types";

const GROUPS = [
  { items: [{ href: "/", label: "대시보드", icon: LayoutDashboard }] },
  {
    label: "고객",
    items: [
      { href: "/users", label: "고객", icon: Users },
      { href: "/inquiries", label: "문의", icon: MessageSquare },
    ],
  },
  {
    label: "매출",
    items: [
      { href: "/purchases", label: "결제", icon: CreditCard },
      { href: "/subscriptions", label: "구독", icon: Repeat },
    ],
  },
  {
    label: "운영",
    items: [
      { href: "/ai-usage", label: "AI 비용", icon: Bot },
      { href: "/promo", label: "콘텐츠 성과", icon: MousePointerClick },
      { href: "/fortune-texts", label: "문장 은행", icon: TextQuote },
      { href: "/settings", label: "시스템 설정", icon: Settings },
      { href: "/changelog", label: "업데이트 이력", icon: History },
    ],
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.webp"
        alt=""
        width={30}
        height={30}
        className="rounded-lg"
      />
      <div className="leading-tight">
        <p className="text-sm font-bold">운Pick</p>
        <p className="text-[11px] font-medium text-ink-mute">관리자</p>
      </div>
    </div>
  );
}

/** Top bar shown below `lg`, where the sidebar becomes a drawer. */
export function MobileBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-white px-2 lg:hidden">
      <button
        type="button"
        className="rounded-lg p-2 text-ink-sub hover:bg-canvas"
        onClick={onMenu}
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>
      <Brand />
    </header>
  );
}

export function Sidebar({
  admin,
  onLogout,
  open,
  onClose,
}: {
  admin: Admin;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col border-r border-line bg-white transition-[translate,visibility]",
          "lg:visible lg:sticky lg:top-0 lg:z-auto lg:w-56 lg:translate-x-0",
          open ? "translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-5 lg:h-16">
          <Brand />
          <button
            type="button"
            className="-mr-2 rounded-lg p-2 text-ink-mute hover:bg-canvas lg:hidden"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {GROUPS.map((group, index) => (
            <div key={index} className={clsx(index > 0 && "mt-5")}>
              {group.label && (
                <p className="mb-1 px-3 text-[11px] font-semibold text-ink-mute/80">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors lg:py-2",
                    isActive(item.href)
                      ? "bg-navy font-semibold text-white"
                      : "font-medium text-ink-sub hover:bg-canvas hover:text-ink",
                  )}
                >
                  <item.icon size={16} strokeWidth={2} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t border-line p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-[#1e7fc0]">
            {admin.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{admin.name}</p>
            <p className="truncate text-[11px] text-ink-mute">
              @{admin.username}
            </p>
          </div>
          <button
            className="rounded-md p-2 text-ink-mute hover:bg-canvas hover:text-danger lg:p-1.5"
            onClick={onLogout}
            title="로그아웃"
            aria-label="로그아웃"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
