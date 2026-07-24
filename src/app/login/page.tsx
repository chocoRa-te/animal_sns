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
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません")
        return
      }
      router.push("/")
      router.refresh()
    } catch {
      setError("エラーが発生しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      {/* Soft warm backdrop circle */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, var(--accent-light) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="w-full max-w-sm animate-fade-up">
        {/* Card */}
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl px-8 py-10"
          style={{ boxShadow: "var(--shadow-xl)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <span
              className="text-[var(--accent)] mb-3 transition-transform duration-300 hover:scale-110"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                <circle cx="6.5" cy="6.5" r="2.2" />
                <circle cx="11" cy="4.5" r="1.8" />
                <circle cx="15.5" cy="5.5" r="2" />
                <circle cx="18.5" cy="9.5" r="1.8" />
                <path d="M12 10c-2.5 0-5.5 2-6 5-.3 1.8.5 3.5 2 4.2 1 .5 2.2.3 3-.3.5-.3 1-.5 1-.5s.5.2 1 .5c.8.6 2 .8 3 .3 1.5-.7 2.3-2.4 2-4.2-.5-3-3.5-5-6-5z" />
              </svg>
            </span>
            <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">
              もふ
            </span>
            <p className="text-sm text-[var(--text-muted)] mt-1.5 text-center">
              ペットとの思い出をシェアしよう
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[var(--text-secondary)] tracking-wide">
                メールアドレス
              </label>
              <input
                type="email"
                className="input-base focus-ring"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleLogin()}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[var(--text-secondary)] tracking-wide">
                パスワード
              </label>
              <input
                type="password"
                className="input-base focus-ring"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleLogin()}
                autoComplete="current-password"
              />
            </div>

            {/* Submit */}
            <button
              className="btn-primary w-full mt-2 py-3 text-sm"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ログイン中...
                </span>
              ) : "ログイン"}
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            アカウントがない方は{" "}
            <Link
              href="/register"
              className="text-[var(--accent)] font-semibold hover:underline transition-colors"
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
