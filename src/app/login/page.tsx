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

          <div className="flex justify-center mb-6">
            <div className="h-10 w-10 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-sm font-bold">
              P
            </div>
          </div>

          <h1 className="text-xl font-semibold text-center mb-6 text-gray-900">ログイン</h1>

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
              className="w-full bg-[#1A1814] hover:bg-[#3D3830] text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-2"
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