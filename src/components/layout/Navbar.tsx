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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function NavIcon({
  children,
  label,
  href,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "relative group p-2 rounded-lg hover:bg-[#E8E4E0] transition-colors cursor-pointer block";
  const tooltip = (
    <span className="hidden md:block absolute top-10 left-1/2 -translate-x-1/2 bg-[#1A1814] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
      {label}
    </span>
  );

  if (href)
    return (
      <Link href={href} className={className}>
        {children}
        {tooltip}
      </Link>
    );

  return (
    <button onClick={onClick} className={className}>
      {children}
      {tooltip}
    </button>
  );
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    // 未読通知数
    fetch(`/api/notifications?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const unread = data.filter((n: any) => !n.read).length;
        setUnreadNotifications(unread);
      });

    // 未読メッセージ数
    fetch(`/api/chat?userId=${session.user.id}&unreadOnly=true`)
      .then((res) => res.json())
      .then((data) => setUnreadMessages(data.count));

    // フォローリクエスト数
    fetch(`/api/follow/requests?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setPendingRequests(data.length));
  }, [session]);

  return (
    <header className="sticky top-0 z-50 bg-[#F7F5F3] border-b border-[#E8E4E0]">
      <div className="max-w-6xl mx-auto flex items-center h-14 px-4 gap-2">
        {/* 三本線メニュー */}
        <div className="relative">
          <NavIcon label="メニュー" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? (
              <X className="h-5 w-5 text-[#6B6560]" />
            ) : (
              <Menu className="h-5 w-5 text-[#6B6560]" />
            )}
            {pendingRequests > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </NavIcon>
        </div>

        {/* ハンバーガーメニュー */}
        {menuOpen && (
          <div className="absolute top-14 left-0 bg-[#F7F5F3] border-r border-b border-[#E8E4E0] p-4 z-50 w-52">
            {session && (
              <Link
                href="/follow-requests"
                className="flex items-center justify-between py-2.5 px-3 text-sm text-[#1A1814] hover:bg-[#E8E4E0] rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                フォローリクエスト
                {pendingRequests > 0 && (
                  <span className="h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {pendingRequests > 9 ? "9+" : pendingRequests}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/settings"
              className="flex items-center py-2.5 px-3 text-sm text-[#1A1814] hover:bg-[#E8E4E0] rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              設定
            </Link>
            {session && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center w-full py-2.5 px-3 text-sm text-[#1A1814] hover:bg-[#E8E4E0] rounded-lg"
              >
                ログアウト
              </button>
            )}
          </div>
        )}

        {/* ロゴ */}
        <Link href="/">
          <div className="p-2">
            <span className="text-lg font-bold text-[#1A1814]">●</span>
          </div>
        </Link>

        {/* ナビ */}
        <nav className="flex items-center gap-1">
          <NavIcon label="ホーム" href="/">
            <Home className="h-5 w-5 text-[#1A1814]" />
          </NavIcon>
          <NavIcon label="作成" href="/create">
            <Plus className="h-5 w-5 text-[#6B6560]" />
          </NavIcon>
          <NavIcon label="アルバム" href="/album">
            <BookImage className="h-5 w-5 text-[#6B6560]" />
          </NavIcon>
          <NavIcon label="動画" href="/video">
            <Video className="h-5 w-5 text-[#6B6560]" />
          </NavIcon>
        </nav>

        {/* 検索 */}
        <NavIcon label="検索" onClick={() => router.push("/search")}>
          <Search className="h-5 w-5 text-[#6B6560]" />
        </NavIcon>

        {/* 右側アイコン */}
        <div className="flex items-center gap-1 ml-auto">
          <div className="relative">
            <NavIcon label="通知" href="/notifications">
              <Bell className="h-5 w-5 text-[#6B6560]" />
            </NavIcon>
            <Badge count={unreadNotifications} />
          </div>

          {/* チャットアイコン（未読バッジ付き） */}
          <div className="relative">
            <NavIcon label="チャット" href="/chat">
              <MessageCircle className="h-5 w-5 text-[#6B6560]" />
            </NavIcon>
            {/* 未読メッセージ数バッジ */}
            <Badge count={unreadMessages} />
          </div>

          {session ? (
            <Link href="/profile">
              <div className="h-8 w-8 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-xs font-semibold ml-1 cursor-pointer hover:bg-[#3D3830] transition-colors overflow-hidden">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt="avatar"
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
              className="px-4 py-1.5 bg-[#1A1814] text-white text-sm font-medium rounded-full hover:bg-[#3D3830] transition-colors"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
