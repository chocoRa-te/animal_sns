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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
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
    <div className="min-h-screen bg-[#F5F0E8] flex">

      {/* ── Left panel: brand story ──────────────── */}
      <aside className="hidden lg:flex flex-col justify-between w-[45%] bg-[#2C2416] px-14 py-12 relative overflow-hidden">

        {/* Background texture rings — purely decorative */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full border border-[#C9A96E]/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 h-[320px] w-[320px] rounded-full border border-[#C9A96E]/8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/4 right-8 h-[180px] w-[180px] rounded-full border border-[#C9A96E]/6"
        />

        {/* Logo */}
        <div className="flex items-center gap-3">
          <PawPrint className="h-7 w-7 text-[#C9A96E]" strokeWidth={1.5} />
          <span className="font-serif text-xl font-semibold text-[#F5F0E8] tracking-tight">
            memoPaw
          </span>
        </div>

        {/* Emotional headline */}
        <div>
          <p className="text-[#AFA495] text-sm tracking-widest uppercase mb-6 font-medium">
            大切な存在との時間を
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[#F5F0E8] leading-[1.25] mb-6">
            いつか必ず、<br />
            宝物になる日が来る。
          </h1>
          <p className="text-[#7A6E5F] text-sm leading-relaxed max-w-xs">
            ペットとのさりげない一日。朝の散歩、おやつの時間、うとうとする午後。
            memoPawはそんな小さな瞬間を、美しい思い出帳として残します。
          </p>

          {/* Decorative quote line */}
          <div className="mt-8 flex items-start gap-3">
            <div className="h-px w-8 bg-[#C9A96E] mt-2.5 flex-shrink-0" />
            <p className="font-serif italic text-[#BFB39E] text-sm leading-relaxed">
              「ある日ふと開いたアルバムで、あの子の匂いを思い出した。」
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-[#4A3F2F] text-xs">
          日本語 / English
        </p>
      </aside>

      {/* ── Right panel: login form ───────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <PawPrint className="h-6 w-6 text-[#C9A96E]" strokeWidth={1.5} />
            <span className="font-serif text-xl font-semibold text-[#2C2416]">memoPaw</span>
          </div>

          <h2 className="font-serif text-2xl font-semibold text-[#2C2416] mb-1">
            おかえりなさい
          </h2>
          <p className="text-sm text-[#AFA495] mb-8">
            ペットとの思い出を確認しましょう
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-[#EDE8DC] border border-[#DDD5C4] text-[#2C2416] rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-[#7A6E5F] mb-1.5">
                メールアドレス
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="w-full px-4 py-3 border border-[#DDD5C4] rounded-xl text-sm bg-[#FDFAF4] text-[#2C2416] placeholder:text-[#BFB39E] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-colors"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleLogin();
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-[#7A6E5F] mb-1.5">
                パスワード
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-[#DDD5C4] rounded-xl text-sm bg-[#FDFAF4] text-[#2C2416] placeholder:text-[#BFB39E] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleLogin();
                }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-[#2C2416] text-[#F5F0E8] text-sm font-medium rounded-xl hover:bg-[#483C2A] transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-[#F5F0E8] border-t-transparent rounded-full animate-spin" />
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-xs text-[#AFA495] mt-6">
            はじめての方は{" "}
            <Link href="/register" className="text-[#2C2416] font-medium underline underline-offset-2 hover:text-[#483C2A] transition-colors">
              新規登録
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
