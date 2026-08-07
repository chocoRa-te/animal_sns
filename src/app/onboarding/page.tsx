"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Camera, Video, ChevronRight } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) {
      router.push("/login")
    }
  }, [session])

  const handleSkip = () => {
    // 今日の日付を保存
    localStorage.setItem("lastOnboarding", new Date().toDateString())
    router.push("/")
  }

  const handlePhoto = () => {
    localStorage.setItem("lastOnboarding", new Date().toDateString())
    router.push("/create")
  }

  const handleVideo = () => {
    localStorage.setItem("lastOnboarding", new Date().toDateString())
    router.push("/video/upload")
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex flex-col items-center justify-center px-6">
      {/* メインコンテンツ */}
      <div className="max-w-sm w-full text-center">

        {/* 絵文字 */}
        <div className="text-6xl mb-6">🐾</div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-[#1A1814] mb-3">
          今日はどんな思い出を<br />残しますか？
        </h1>
        <p className="text-sm text-[#A39E99] mb-10">
          {session?.user?.name}さんのペットとの<br />素敵な瞬間を記録しましょう
        </p>

        {/* ボタン */}
        <div className="flex flex-col gap-3">
          {/* 写真 */}
          <button
            onClick={handlePhoto}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E8E4E0] hover:bg-[#F7F5F3] transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F7F5F3] flex items-center justify-center flex-shrink-0">
              <Camera className="h-6 w-6 text-[#1A1814]" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[#1A1814] text-sm">写真を投稿する</p>
              <p className="text-xs text-[#A39E99] mt-0.5">可愛い瞬間を写真で残そう</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#A39E99]" />
          </button>

          {/* 動画 */}
          <button
            onClick={handleVideo}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#E8E4E0] hover:bg-[#F7F5F3] transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F7F5F3] flex items-center justify-center flex-shrink-0">
              <Video className="h-6 w-6 text-[#1A1814]" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[#1A1814] text-sm">動画を投稿する</p>
              <p className="text-xs text-[#A39E99] mt-0.5">動く姿を動画で残そう</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#A39E99]" />
          </button>
        </div>

        {/* スキップ */}
        <button
          onClick={handleSkip}
          className="mt-6 text-sm text-[#A39E99] hover:text-[#6B6560] transition-colors"
        >
          あとで
        </button>
      </div>
    </div>
  )
}