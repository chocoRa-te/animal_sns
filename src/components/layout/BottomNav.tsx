"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sun, Compass, Video, User } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: "/", icon: Sun, label: "今日" },
    { href: "/discover", icon: Compass, label: "発見" },
    { href: "/video", icon: Video, label: "動画" },
    { href: "/profile", icon: User, label: "プロフィール" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#F0EBE1] border-t border-[#DDD5C4] z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
              pathname === href ? "text-[#2C2416]" : "text-[#AFA495]"
            }`}
          >
            <Icon className={`h-5 w-5 ${pathname === href ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}