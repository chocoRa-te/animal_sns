// src/components/layout/Navbar.tsx
"use client"

import Link from "next/link"
import { Bell, MessageCircle, User, Search } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white py-4 shadow-sm">
      <div className="container mx-auto flex items-center gap-4 px-4">
        <Link href="/" className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            P
          </div>
        </Link>
        
        <nav className="flex-shrink-0">
          <ul className="flex items-center gap-2">
            <li>
              <Link href="/" className="rounded-full bg-black text-white px-6 py-3 font-medium text-base">
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/create" className="rounded-full px-6 py-3 font-medium text-base text-gray-800">
                作成
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="flex-1 relative max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-600" />
          </div>
          <input
            type="text"
            placeholder="検索"
            className="w-full bg-gray-200 rounded-full py-3 px-12 outline-none text-gray-800 placeholder-gray-600"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="rounded-full p-2 hover:bg-gray-100">
            <Bell className="h-6 w-6 text-gray-900" />
          </button>
          <button className="rounded-full p-2 hover:bg-gray-100">
            <MessageCircle className="h-6 w-6 text-gray-900" />
          </button>
          <button className="rounded-full p-2 hover:bg-gray-100">
            <User className="h-6 w-6 text-gray-900" />
          </button>
        </div>
      </div>
    </header>
  )
}