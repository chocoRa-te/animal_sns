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
  Video,
  BookImage,
  PawPrint,
  Camera,
  Settings,
  LogOut,
  UserCheck,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function NavIcon({
  children,
  label,
  href,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const base =
    "relative group p-2 rounded-xl transition-colors cursor-pointer block";
  const color = active
    ? "bg-[#1A1814] text-white"
    : "hover:bg-[#E8E4E0] text-[#6B6560]";
  const className = `${base} ${color}`;

  const tooltip = (
    <span className="hidden md:block absolute top-11 left-1/2 -translate-x-1/2 bg-[#1A1814] text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
      {label}
    </span>
  );

  if (href)
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
        {tooltip}
      </Link>
    );

  return (
    <button onClick={onClick} className={className} aria-label={label}>
      {children}
      {tooltip}
    </button>
  );
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[#C9A96E] text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
      {count > 9 ? "9+" : count}
    </span>
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
        const unread = data.filter((n: any) => !n.read).length;
        setUnreadNotifications(unread);
      });

    fetch(`/api/chat?userId=${session.user.id}&unreadOnly=true`)
      .then((res) => res.json())
      .then((data) => setUnreadMessages(data.count));

    fetch(`/api/follow/requests?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setPendingRequests(data.length));
  }, [session]);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#F7F5F3] border-b border-[#E8E4E0]" style={{ height: "var(--navbar-h)" }}>
      <div className="max-w-6xl mx-auto flex items-center h-full px-4 gap-1">

        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-1.5 mr-2 group" aria-label="memoPaw ホームへ">
          <PawPrint className="h-5 w-5 text-[#C9A96E] transition-transform group-hover:scale-110" />
          <span className="font-serif text-base font-semibold text-[#1A1814] tracking-tight hidden sm:block">
            memoPaw
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="flex items-center gap-0.5" aria-label="メインナビゲーション">
          <NavIcon label="ホーム" href="/" active={isActive("/")}>
            <Home className="h-5 w-5" />
          </NavIcon>
          <NavIcon label="アルバム" href="/album" active={isActive("/album")}>
            <BookImage className="h-5 w-5" />
          </NavIcon>
          <NavIcon label="動画" href="/video" active={isActive("/video")}>
            <Video className="h-5 w-5" />
          </NavIcon>
          <NavIcon label="検索" onClick={() => router.push("/search")} active={isActive("/search")}>
            <Search className="h-5 w-5" />
          </NavIcon>
        </nav>

        {/* Create CTA — memory-book primary action */}
        <Link
          href="/create"
          aria-label="思い出を残す"
          className="hidden sm:flex items-center gap-1.5 ml-2 px-4 py-1.5 bg-[#1A1814] text-white text-sm font-medium rounded-full hover:bg-[#3D3830] transition-colors whitespace-nowrap"
        >
          <Camera className="h-4 w-4" />
          思い出を残す
        </Link>
        {/* Mobile create (icon only) */}
        <Link
          href="/create"
          aria-label="思い出を残す"
          className="sm:hidden ml-1 p-2 rounded-xl bg-[#1A1814] text-white hover:bg-[#3D3830] transition-colors"
        >
          <Camera className="h-5 w-5" />
        </Link>

        {/* Right-side icons */}
        <div className="flex items-center gap-0.5 ml-auto">
          {/* Notifications */}
          <div className="relative">
            <NavIcon label="通知" href="/notifications" active={isActive("/notifications")}>
              <Bell className="h-5 w-5" />
            </NavIcon>
            <Badge count={unreadNotifications} />
          </div>

          {/* Chat */}
          <div className="relative">
            <NavIcon label="チャット" href="/chat" active={isActive("/chat")}>
              <MessageCircle className="h-5 w-5" />
            </NavIcon>
            <Badge count={unreadMessages} />
          </div>

          {/* Avatar / login */}
          {session ? (
            <Link href="/profile" aria-label="プロフィールへ">
              <div className="h-8 w-8 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-xs font-semibold ml-1 cursor-pointer hover:ring-2 hover:ring-[#C9A96E] hover:ring-offset-1 transition-all overflow-hidden">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "アバター"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (session.user.name?.[0]?.toUpperCase() ?? "U")
                )}
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 px-4 py-1.5 bg-[#1A1814] text-white text-sm font-medium rounded-full hover:bg-[#3D3830] transition-colors"
            >
              ログイン
            </Link>
          )}

          {/* Overflow menu */}
          <div className="relative ml-0.5">
            <NavIcon label="メニュー" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              {pendingRequests > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-[#C9A96E] rounded-full" />
              )}
            </NavIcon>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] bg-[#FFFFFF] border border-[#E8E4E0] rounded-2xl shadow-lg p-1.5 z-50 w-52 animate-fade-in">
                {session && (
                  <Link
                    href="/follow-requests"
                    className="flex items-center justify-between py-2.5 px-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-xl"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-[#6B6560]" />
                      フォローリクエスト
                    </span>
                    {pendingRequests > 0 && (
                      <span className="h-5 min-w-5 px-1 bg-[#C9A96E] text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {pendingRequests > 9 ? "9+" : pendingRequests}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="flex items-center gap-2 py-2.5 px-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-xl"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-[#6B6560]" />
                  設定
                </Link>
                {session && (
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2 w-full py-2.5 px-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-xl"
                  >
                    <LogOut className="h-4 w-4 text-[#6B6560]" />
                    ログアウト
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
