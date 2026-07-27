"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  BookImage,
  Camera,
  Settings,
  LogOut,
  PawPrint,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function SpineIcon({
  href,
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  href?: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  const base =
    "relative flex items-center justify-center h-11 w-11 rounded-2xl transition-all duration-150 group";
  const state = active
    ? "bg-[#1C1611] text-[#F8F4EE]"
    : "text-[#A89E93] hover:bg-[#E8DFCF] hover:text-[#1C1611]";

  const inner = (
    <>
      <Icon
        className={`h-[19px] w-[19px] transition-transform group-hover:scale-110 ${active ? "text-[#C9A96E]" : ""}`}
        strokeWidth={active ? 2 : 1.6}
      />
      {badge != null && badge > 0 && (
        <span
          className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C4856A]"
          aria-label={`${badge}件の未読`}
        />
      )}
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1 bg-[#1C1611] text-[#F8F4EE] text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${base} ${state}`} aria-label={label} aria-current={active ? "page" : undefined}>
        {inner}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${state}`} aria-label={label}>
      {inner}
    </button>
  );
}

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    fetch(`/api/notifications?userId=${uid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadNotifications(data.filter((n: any) => !n.read).length);
        }
      });

    fetch(`/api/chat?userId=${uid}&unreadOnly=true`)
      .then((r) => r.json())
      .then((data) => setUnreadMessages(data.count ?? 0));
  }, [session]);

  const is = (path: string) => pathname === path;
  const starts = (path: string) => pathname.startsWith(path);

  return (
    <>
      {/* ── Desktop spine sidebar ─────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 flex-col items-center bg-[#F2EBE0] border-r border-[#DDD4C6] z-50 py-4 gap-1"
        style={{ width: "var(--sidebar-w)" }}
        aria-label="ナビゲーション"
      >
        {/* Logo — just a paw mark */}
        <Link
          href="/"
          className="flex items-center justify-center h-11 w-11 mb-3 group"
          aria-label="memoPaw ホーム"
        >
          <PawPrint
            className="h-6 w-6 text-[#C9A96E] transition-transform group-hover:scale-110 group-hover:rotate-6 duration-200"
            strokeWidth={1.75}
          />
        </Link>

        {/* Primary nav */}
        <nav className="flex flex-col items-center gap-1 flex-1" aria-label="メインナビ">
          <SpineIcon href="/"             icon={Home}         label="ホーム"         active={is("/")} />
          <SpineIcon href="/search"       icon={Search}       label="さがす"         active={is("/search")} />
          <SpineIcon href="/album"        icon={BookImage}    label="アルバム"       active={starts("/album")} />
          <SpineIcon
            href="/notifications"
            icon={Bell}
            label="通知"
            active={is("/notifications")}
            badge={unreadNotifications}
          />
          <SpineIcon
            href="/chat"
            icon={MessageCircle}
            label="メッセージ"
            active={starts("/chat")}
            badge={unreadMessages}
          />

          {/* Create — the most important action */}
          <div className="mt-3 mb-1">
            <Link
              href="/create"
              aria-label="今日の思い出を残す"
              className="flex items-center justify-center h-11 w-11 rounded-2xl bg-[#1C1611] hover:bg-[#3A2E22] transition-colors group"
            >
              <Camera
                className="h-5 w-5 text-[#C9A96E] transition-transform group-hover:scale-110 duration-150"
                strokeWidth={1.75}
              />
              <span className="sr-only">今日の思い出を残す</span>
            </Link>
          </div>
        </nav>

        {/* Bottom — profile, settings */}
        <div className="flex flex-col items-center gap-1 pb-1">
          <SpineIcon href="/settings" icon={Settings} label="設定" active={is("/settings")} />

          {session ? (
            <>
              <SpineIcon
                icon={LogOut}
                label="ログアウト"
                onClick={() => signOut({ callbackUrl: "/login" })}
              />
              <Link
                href="/profile"
                aria-label={`${session.user?.name ?? "マイページ"}のプロフィール`}
                className="mt-1 h-9 w-9 rounded-full overflow-hidden border-2 border-[#DDD4C6] hover:border-[#C9A96E] transition-colors"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "アバター"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1C1611] flex items-center justify-center text-[#F8F4EE] text-xs font-semibold">
                    {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              aria-label="ログイン"
              className="h-9 w-9 rounded-full bg-[#1C1611] flex items-center justify-center text-[#F8F4EE] text-xs font-medium hover:bg-[#3A2E22] transition-colors"
            >
              入
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F2EBE0] border-t border-[#DDD4C6] z-50 flex items-center justify-around px-3 h-[64px]"
        aria-label="モバイルナビ"
      >
        <Link href="/" aria-label="ホーム" className={`flex flex-col items-center gap-1 transition-colors ${is("/") ? "text-[#1C1611]" : "text-[#A89E93]"}`}>
          <Home className="h-5 w-5" strokeWidth={is("/") ? 2 : 1.5} />
          <span className="text-[9px] font-medium">ホーム</span>
        </Link>
        <Link href="/search" aria-label="さがす" className={`flex flex-col items-center gap-1 transition-colors ${is("/search") ? "text-[#1C1611]" : "text-[#A89E93]"}`}>
          <Search className="h-5 w-5" strokeWidth={is("/search") ? 2 : 1.5} />
          <span className="text-[9px] font-medium">さがす</span>
        </Link>

        {/* Center create — raised camera button */}
        <Link
          href="/create"
          aria-label="今日の思い出を残す"
          className="flex flex-col items-center gap-1 -mt-6"
        >
          <div className="h-14 w-14 rounded-full bg-[#1C1611] flex items-center justify-center shadow-lg hover:bg-[#3A2E22] transition-colors border-4 border-[#F2EBE0]">
            <Camera className="h-6 w-6 text-[#C9A96E]" strokeWidth={1.75} />
          </div>
        </Link>

        <Link href="/notifications" aria-label="通知" className={`relative flex flex-col items-center gap-1 transition-colors ${is("/notifications") ? "text-[#1C1611]" : "text-[#A89E93]"}`}>
          <span className="relative">
            <Bell className="h-5 w-5" strokeWidth={is("/notifications") ? 2 : 1.5} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#C4856A] rounded-full" />
            )}
          </span>
          <span className="text-[9px] font-medium">通知</span>
        </Link>

        <Link href="/profile" aria-label="マイページ" className={`flex flex-col items-center gap-1 transition-colors ${starts("/profile") ? "text-[#1C1611]" : "text-[#A89E93]"}`}>
          <div className="h-5 w-5 rounded-full bg-[#1C1611] overflow-hidden flex items-center justify-center text-[#F8F4EE] text-[9px] font-semibold">
            {session?.user?.image
              ? <img src={session.user.image} alt="" className="w-full h-full object-cover" />
              : session?.user?.name?.[0]?.toUpperCase() ?? "U"
            }
          </div>
          <span className="text-[9px] font-medium">マイページ</span>
        </Link>
      </nav>
    </>
  );
}
