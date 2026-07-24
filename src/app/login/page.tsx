"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません")
        return
      }

      router.push("/")
      router.refresh()

    } catch (err) {
      setError("エラーが発生しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#E8E4E0] rounded-2xl p-8">

          <div className="flex flex-col items-center mb-6">
            <span className="text-[var(--accent)] mb-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="2.2" />
                <circle cx="11" cy="4.5" r="1.8" />
                <circle cx="15.5" cy="5.5" r="2" />
                <circle cx="18.5" cy="9.5" r="1.8" />
                <path d="M12 10c-2.5 0-5.5 2-6 5-.3 1.8.5 3.5 2 4.2 1 .5 2.2.3 3-.3.5-.3 1-.5 1-.5s.5.2 1 .5c.8.6 2 .8 3 .3 1.5-.7 2.3-2.4 2-4.2-.5-3-3.5-5-6-5z" />
              </svg>
            </span>
            <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">もふ</span>
          </div>

          <h1 className="text-base font-semibold text-center mb-6 text-[var(--text-secondary)]">ログイン</h1>

          {error && (
            <div className="mb-4 p-3 bg-[#F7F5F3] border border-[#E8E4E0] text-[#1A1814] rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[#6B6560] uppercase tracking-wide">メールアドレス</label>
              <input
                type="email"
                className="w-full px-3 py-2.5 border border-[#E8E4E0] rounded-lg text-sm focus:outline-none focus:border-[#A39E99] bg-[#F7F5F3] transition-colors"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-[#6B6560] uppercase tracking-wide">パスワード</label>
              <input
                type="password"
                className="w-full px-3 py-2.5 border border-[#E8E4E0] rounded-lg text-sm focus:outline-none focus:border-[#A39E99] bg-[#F7F5F3] transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <button
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-2"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </div>

          <p className="text-center text-xs text-[#A39E99] mt-4">
            アカウントがない方は{" "}
            <Link href="/register" className="text-[#1A1814] font-medium hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
