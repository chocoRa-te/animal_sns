// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  MessageCircle,
  Search,
  Menu,
  X,
  Home,
  Plus,
  Video,
  BookImage,
  Settings,
  LogOut,
  Users,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function PawIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="6.5" r="2.2" />
      <circle cx="11" cy="4.5" r="1.8" />
      <circle cx="15.5" cy="5.5" r="2" />
      <circle cx="18.5" cy="9.5" r="1.8" />
      <path d="M12 10c-2.5 0-5.5 2-6 5-.3 1.8.5 3.5 2 4.2 1 .5 2.2.3 3-.3.5-.3 1-.5 1-.5s.5.2 1 .5c.8.6 2 .8 3 .3 1.5-.7 2.3-2.4 2-4.2-.5-3-3.5-5-6-5z" />
    </svg>
  );
}

function NavIcon({
  children,
  label,
  href,
  onClick,
  active,
  badge,
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}) {
  const base =
    "relative group p-2 rounded-lg transition-colors cursor-pointer block";
  const state = active
    ? "bg-[var(--accent-light)] text-[var(--accent)]"
    : "hover:bg-[var(--border)] text-[var(--text-secondary)]";
  const className = `${base} ${state}`;

  const tooltip = (
    <span className="hidden md:block absolute top-11 left-1/2 -translate-x-1/2 bg-[var(--ink)] text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
      {label}
    </span>
  );

  const badgeEl =
    badge && badge > 0 ? (
      <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] bg-[var(--accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
        {badge > 9 ? "9+" : badge}
      </span>
    ) : null;

  if (href)
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
        {badgeEl}
        {tooltip}
      </Link>
    );

  return (
    <button onClick={onClick} className={className} aria-label={label}>
      {children}
      {badgeEl}
      {tooltip}
    </button>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/notifications?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadNotifications(data.filter((n: any) => !n.read).length);
        }
      });

    fetch(`/api/chat?userId=${session.user.id}&unreadOnly=true`)
      .then((res) => res.json())
      .then((data) => setUnreadMessages(data.count ?? 0));

    fetch(`/api/follow/requests?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setPendingRequests(Array.isArray(data) ? data.length : 0));
  }, [session]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto flex items-center h-14 px-4 gap-2">

        {/* Hamburger menu */}
        <div className="relative">
          <NavIcon
            label="メニュー"
            onClick={() => setMenuOpen(!menuOpen)}
            badge={pendingRequests}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </NavIcon>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute top-12 left-0 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg p-2 z-50 w-52">
                {session && (
                  <Link
                    href="/follow-requests"
                    className="flex items-center justify-between py-2.5 px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--background)] rounded-lg transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[var(--text-secondary)]" />
                      フォローリクエスト
                    </span>
                    {pendingRequests > 0 && (
                      <span className="min-w-[1.25rem] h-5 bg-[var(--accent)] text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {pendingRequests > 9 ? "9+" : pendingRequests}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="flex items-center gap-2 py-2.5 px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--background)] rounded-lg transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
                  設定
                </Link>
                {session && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="flex items-center gap-2 w-full py-2.5 px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--background)] rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-[var(--text-secondary)]" />
                    ログアウト
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Brand logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-1 py-1 rounded-lg hover:opacity-80 transition-opacity"
          aria-label="もふ ホームへ"
        >
          <span className="text-[var(--accent)]">
            <PawIcon />
          </span>
          <span className="text-base font-bold text-[var(--text-primary)] tracking-tight leading-none">
            もふ
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="flex items-center gap-1" role="navigation" aria-label="メインナビゲーション">
          <NavIcon label="ホーム" href="/" active={isActive("/") && pathname === "/"}>
            <Home className="h-5 w-5" />
          </NavIcon>
          <NavIcon label="作成" href="/create" active={isActive("/create")}>
            <Plus className="h-5 w-5" />
          </NavIcon>
          <NavIcon label="アルバム" href="/album" active={isActive("/album")}>
            <BookImage className="h-5 w-5" />
          </NavIcon>
          <NavIcon label="動画" href="/video" active={isActive("/video")}>
            <Video className="h-5 w-5" />
          </NavIcon>
        </nav>

        {/* Search */}
        <NavIcon label="検索" href="/search" active={isActive("/search")}>
          <Search className="h-5 w-5" />
        </NavIcon>

        {/* Right side */}
        <div className="flex items-center gap-1 ml-auto">
          <NavIcon
            label="通知"
            href="/notifications"
            active={isActive("/notifications")}
            badge={unreadNotifications}
          >
            <Bell className="h-5 w-5" />
          </NavIcon>

          <NavIcon
            label="チャット"
            href="/chat"
            active={isActive("/chat")}
            badge={unreadMessages}
          >
            <MessageCircle className="h-5 w-5" />
          </NavIcon>

          {session ? (
            <Link
              href="/profile"
              aria-label="プロフィール"
              className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ml-1 transition-all overflow-hidden ring-2 ${isActive("/profile") ? "ring-[var(--accent)]" : "ring-transparent hover:ring-[var(--border)]"}`}
              style={{ backgroundColor: "var(--ink)" }}
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={`${session.user.name ?? "ユーザー"}のアバター`}
                  className="w-full h-full object-cover"
                />
              ) : (
                (session.user.name?.[0]?.toUpperCase() ?? "U")
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-hover)] transition-colors"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
