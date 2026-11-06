"use client";

import clsx from "clsx";
import {
  Bot,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MousePointerClick,
  Repeat,
  Settings,
  TextQuote,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    ],
  },
];

export function Sidebar({
  admin,
  onLogout,
}: {
  admin: Admin;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-white">
      <div className="flex h-16 items-center gap-2.5 px-5">
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
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
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
          className="rounded-md p-1.5 text-ink-mute hover:bg-canvas hover:text-danger"
          onClick={onLogout}
          title="로그아웃"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
