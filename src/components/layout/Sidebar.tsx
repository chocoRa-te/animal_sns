"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Sun, Compass, Video, User, Settings, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const links = [
    { href: "/", icon: Sun, label: "今日" },
    { href: "/discover", icon: Compass, label: "発見" },
    { href: "/video", icon: Video, label: "動画" },
    { href: "/profile", icon: User, label: "プロフィール" },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#F0EBE1] border-r border-[#DDD5C4] flex flex-col z-50 hidden md:flex">
      {/* ロゴ */}
      <div className="px-6 py-6">
        <Link href="/">
          <span className="font-serif text-xl font-bold text-[#2C2416]">🐾 PetLog</span>
        </Link>
      </div>

      {/* ナビリンク */}
      <nav className="flex-1 px-3">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1 ${
              pathname === href
                ? "bg-[#2C2416] text-[#F5F0E8]"
                : "text-[#7A6E5F] hover:bg-[#EDE8DC] hover:text-[#2C2416]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* ユーザー情報 */}
      {session && (
        <div className="px-4 py-4 border-t border-[#DDD5C4]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-[#2C2416] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {session.user.image ? (
                <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                session.user.name?.[0]?.toUpperCase() ?? "U"
              )}
            </div>
            <p className="text-xs font-medium text-[#2C2416] truncate">{session.user.name}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#7A6E5F] hover:text-[#2C2416] hover:bg-[#EDE8DC] rounded-lg transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              設定
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#7A6E5F] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              ログアウト
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}