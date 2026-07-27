"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F4EE]">

      {/* ══════════════════════════════════════════════
          Left panel — brand mood
          Dark, warm, unhurried. Like the inside cover
          of a worn photo album.
      ══════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{ width: "42%", background: "#1C1611" }}
        aria-hidden="true"
      >
        {/* Decorative scattered photo prints — purely visual */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* Print 1 — top left */}
          <div
            className="absolute bg-white shadow-xl"
            style={{
              top: "8%",
              left: "12%",
              width: 120,
              padding: "5px 5px 20px 5px",
              transform: "rotate(-4deg)",
              opacity: 0.18,
            }}
          >
            <div className="w-full bg-[#3A2E22]" style={{ height: 90 }} />
          </div>

          {/* Print 2 — center */}
          <div
            className="absolute bg-white shadow-xl"
            style={{
              top: "34%",
              left: "24%",
              width: 160,
              padding: "5px 5px 22px 5px",
              transform: "rotate(2.5deg)",
              opacity: 0.13,
            }}
          >
            <div className="w-full bg-[#2E2318]" style={{ height: 130 }} />
          </div>

          {/* Print 3 — bottom right */}
          <div
            className="absolute bg-white shadow-xl"
            style={{
              top: "58%",
              left: "8%",
              width: 100,
              padding: "4px 4px 16px 4px",
              transform: "rotate(-2deg)",
              opacity: 0.16,
            }}
          >
            <div className="w-full bg-[#2A1F14]" style={{ height: 76 }} />
          </div>

          {/* Print 4 — overlapping center */}
          <div
            className="absolute bg-white shadow-xl"
            style={{
              top: "45%",
              left: "46%",
              width: 96,
              padding: "4px 4px 16px 4px",
              transform: "rotate(5deg)",
              opacity: 0.12,
            }}
          >
            <div className="w-full bg-[#3A2E22]" style={{ height: 70 }} />
          </div>

          {/* Horizontal rule — faint, like a shelf */}
          <div
            className="absolute left-0 right-0"
            style={{ top: "74%", height: 1, background: "rgba(201,169,110,0.12)" }}
          />
        </div>

        {/* Content — always above the decorative layer */}
        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <PawPrint className="h-6 w-6 text-[#C9A96E]" strokeWidth={1.5} />
            <span className="font-serif text-lg font-semibold text-[#F8F4EE] tracking-tight">
              memoPaw
            </span>
          </div>

          {/* Emotional center */}
          <div>
            {/* Sub-label */}
            <p className="text-[11px] font-medium tracking-[0.18em] text-[#6B6055] uppercase mb-7">
              ペットとの日々を、思い出帳に
            </p>

            {/* Main headline — should feel like a whisper, not a shout */}
            <h1 className="font-serif text-[36px] leading-[1.22] font-semibold text-[#F8F4EE] mb-8">
              いつか必ず、<br />
              宝物になる<br />
              日が来る。
            </h1>

            {/* Decorative rule + quote */}
            <div className="flex items-start gap-4">
              <div className="mt-2 flex-shrink-0">
                <div className="w-6 h-px bg-[#C9A96E]" />
              </div>
              <p className="font-serif italic text-[#4A3F2F] text-[13px] leading-relaxed">
                「朝の散歩、昼寝の顔、ごはんのひと声。<br />
                そのどれもが、あの子の物語だった。」
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-[#3A2E22]">
            memoPaw — 思い出帳
          </p>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          Right panel — login form
          Cream, quiet, generous whitespace.
      ══════════════════════════════════════════════ */}
      <main className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-[340px]">

          {/* Mobile logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-12 lg:hidden" aria-label="memoPaw ホーム">
            <PawPrint className="h-5 w-5 text-[#C9A96E]" strokeWidth={1.5} />
            <span className="font-serif text-xl font-semibold text-[#1C1611]">memoPaw</span>
          </Link>

          {/* Heading — "welcome back", not "log in" */}
          <div className="mb-10">
            <h2 className="font-serif text-[28px] font-semibold text-[#1C1611] leading-tight mb-2">
              おかえりなさい
            </h2>
            <p className="text-[13px] text-[#A89E93] leading-relaxed">
              ペットとの大切な記録が、待っています。
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl border text-[13px] text-[#1C1611]"
              style={{ background: "#F2EBE0", borderColor: "#DDD4C6" }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium text-[#6B6055] mb-1.5 tracking-wide"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleLogin();
                }}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-xl border text-[13px] bg-white text-[#1C1611] placeholder:text-[#C8BEB3] transition-colors focus:outline-none focus:border-[#C9A96E]"
                style={{ borderColor: "#DDD4C6" }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium text-[#6B6055] mb-1.5 tracking-wide"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleLogin();
                }}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border text-[13px] bg-white text-[#1C1611] placeholder:text-[#C8BEB3] transition-colors focus:outline-none focus:border-[#C9A96E]"
                style={{ borderColor: "#DDD4C6" }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 text-[13px] font-medium rounded-xl transition-colors disabled:opacity-50 mt-1"
              style={{ background: "#1C1611", color: "#F8F4EE" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-[#F8F4EE] border-t-transparent rounded-full animate-spin" />
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#E8DFCF]" />
            <span className="text-[11px] text-[#C8BEB3]">または</span>
            <div className="flex-1 h-px bg-[#E8DFCF]" />
          </div>

          {/* Register link */}
          <p className="text-center text-[13px] text-[#A89E93]">
            はじめての方は{" "}
            <Link
              href="/register"
              className="text-[#1C1611] font-medium underline underline-offset-2 hover:text-[#3A2E22] transition-colors"
            >
              新規登録
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
