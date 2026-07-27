"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  BookImage,
  Video,
  Camera,
  Settings,
  LogOut,
  UserCheck,
  PawPrint,
  Plus,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

function SidebarLink({
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
    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group w-full text-left";
  const state = active
    ? "bg-[#2C2416] text-[#F5F0E8]"
    : "text-[#7A6E5F] hover:bg-[#EDE8DC] hover:text-[#2C2416]";

  const inner = (
    <>
      <span className="relative flex-shrink-0">
        <Icon
          className={`h-[18px] w-[18px] transition-transform group-hover:scale-105 ${active ? "text-[#C9A96E]" : ""}`}
          strokeWidth={active ? 2 : 1.75}
        />
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#C9A96E] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      <span className={`text-sm font-medium tracking-tight transition-opacity ${active ? "text-[#F5F0E8]" : ""}`}>
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
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/notifications?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadNotifications(data.filter((n: any) => !n.read).length);
        }
      });

    fetch(`/api/chat?userId=${session.user.id}&unreadOnly=true`)
      .then((r) => r.json())
      .then((data) => setUnreadMessages(data.count ?? 0));

    fetch(`/api/follow/requests?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setPendingRequests(Array.isArray(data) ? data.length : 0));
  }, [session]);

  const is = (path: string) => pathname === path;

  return (
    <>
      {/* ── Desktop sidebar ────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 flex-col bg-[#FDFAF4] border-r border-[#DDD5C4] z-50"
        style={{ width: "var(--sidebar-w)" }}
        aria-label="サイドナビゲーション"
      >
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 px-4 py-5 group"
          aria-label="memoPaw ホームへ"
        >
          <PawPrint
            className="h-6 w-6 text-[#C9A96E] transition-transform group-hover:rotate-6"
            strokeWidth={1.75}
          />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold text-[#2C2416] tracking-tight">
              memoPaw
            </span>
            <span className="text-[10px] text-[#AFA495] tracking-wide mt-0.5">
              思い出帳
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="mx-4 h-px bg-[#DDD5C4] mb-3" />

        {/* Primary nav */}
        <nav className="flex flex-col gap-0.5 px-3 flex-1" aria-label="メインメニュー">
          <SidebarLink href="/"          icon={Home}         label="ホーム"      active={is("/")} />
          <SidebarLink href="/search"    icon={Search}       label="さがす"      active={is("/search")} />
          <SidebarLink href="/album"     icon={BookImage}    label="アルバム"    active={pathname.startsWith("/album")} />
          <SidebarLink href="/video"     icon={Video}        label="動画"        active={pathname.startsWith("/video")} />
          <SidebarLink
            href="/notifications"
            icon={Bell}
            label="通知"
            active={is("/notifications")}
            badge={unreadNotifications}
          />
          <SidebarLink
            href="/chat"
            icon={MessageCircle}
            label="メッセージ"
            active={pathname.startsWith("/chat")}
            badge={unreadMessages}
          />

          {/* Memory CTA — the heart of the app */}
          <div className="mt-4">
            <Link
              href="/create"
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-[#2C2416] text-[#F5F0E8] hover:bg-[#483C2A] transition-colors group"
              aria-label="今日の思い出を残す"
            >
              <Camera
                className="h-[18px] w-[18px] text-[#C9A96E] flex-shrink-0 transition-transform group-hover:scale-105"
                strokeWidth={1.75}
              />
              <span className="text-sm font-medium">今日の思い出を残す</span>
            </Link>
          </div>
        </nav>

        {/* Bottom section — profile + settings */}
        <div className="px-3 pb-4 flex flex-col gap-0.5 border-t border-[#DDD5C4] pt-3">
          {session ? (
            <>
              <SidebarLink href="/profile"  icon={UserCheck}   label="マイページ" active={pathname.startsWith("/profile")} badge={pendingRequests} />
              <SidebarLink href="/settings" icon={Settings}    label="設定"       active={is("/settings")} />
              <SidebarLink
                icon={LogOut}
                label="ログアウト"
                onClick={() => signOut({ callbackUrl: "/login" })}
              />
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#2C2416] text-[#F5F0E8] hover:bg-[#483C2A] transition-colors text-sm font-medium"
            >
              ログイン
            </Link>
          )}

          {/* User chip */}
          {session && (
            <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl hover:bg-[#EDE8DC] transition-colors">
              <div className="h-7 w-7 rounded-full bg-[#2C2416] flex items-center justify-center text-[#F5F0E8] text-xs font-semibold overflow-hidden flex-shrink-0">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "アバター"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  session.user?.name?.[0]?.toUpperCase() ?? "U"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#2C2416] truncate leading-tight">
                  {session.user?.name}
                </p>
                <p className="text-[10px] text-[#AFA495] truncate leading-tight">
                  {session.user?.email}
                </p>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom navigation ────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FDFAF4] border-t border-[#DDD5C4] z-50 flex items-center justify-around px-2 h-16"
        aria-label="モバイルナビゲーション"
      >
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${is("/") ? "text-[#2C2416]" : "text-[#AFA495]"}`}
          aria-label="ホーム"
        >
          <Home className={`h-5 w-5 ${is("/") ? "stroke-[2]" : "stroke-[1.5]"}`} />
          <span className="text-[10px] font-medium">ホーム</span>
        </Link>
        <Link
          href="/search"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${is("/search") ? "text-[#2C2416]" : "text-[#AFA495]"}`}
          aria-label="さがす"
        >
          <Search className={`h-5 w-5 ${is("/search") ? "stroke-[2]" : "stroke-[1.5]"}`} />
          <span className="text-[10px] font-medium">さがす</span>
        </Link>

        {/* Center create button */}
        <Link
          href="/create"
          className="flex flex-col items-center gap-0.5 -mt-5"
          aria-label="今日の思い出を残す"
        >
          <div className="h-12 w-12 rounded-full bg-[#2C2416] flex items-center justify-center shadow-lg hover:bg-[#483C2A] transition-colors">
            <Camera className="h-5 w-5 text-[#C9A96E]" strokeWidth={1.75} />
          </div>
        </Link>

        <Link
          href="/notifications"
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${is("/notifications") ? "text-[#2C2416]" : "text-[#AFA495]"}`}
          aria-label="通知"
        >
          <span className="relative">
            <Bell className={`h-5 w-5 ${is("/notifications") ? "stroke-[2]" : "stroke-[1.5]"}`} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-[#C9A96E] rounded-full border border-[#FDFAF4]" />
            )}
          </span>
          <span className="text-[10px] font-medium">通知</span>
        </Link>
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${pathname.startsWith("/profile") ? "text-[#2C2416]" : "text-[#AFA495]"}`}
          aria-label="マイページ"
        >
          <div className="h-5 w-5 rounded-full bg-[#2C2416] flex items-center justify-center text-[#F5F0E8] text-[9px] font-semibold overflow-hidden">
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              session?.user?.name?.[0]?.toUpperCase() ?? "U"
            )}
          </div>
          <span className="text-[10px] font-medium">マイページ</span>
        </Link>
      </nav>
    </>
  );
}
