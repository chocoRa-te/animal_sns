"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Play, SlidersHorizontal, X } from "lucide-react"

interface Pin {
  id: string
  title: string
  imageUrl: string
  videoUrl?: string
  category: string
  type: string
  createdAt: string
  userId: string
}

export default function AlbumPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all")
  const [selectedYear, setSelectedYear] = useState("すべて")
  const [selectedMonth, setSelectedMonth] = useState("すべて")
  const [selectedTag, setSelectedTag] = useState("すべて")
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const myPins = data
          .filter((pin: any) => pin.userId === session.user.id)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPins(myPins)
        setLoading(false)
      })
  }, [session])

  // メニューの外をクリックしたら閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // タグ一覧を作成
  const allTags = ["すべて", ...Array.from(new Set(
    pins.flatMap((pin) => pin.category ? pin.category.split(",").map((t) => t.trim()).filter(Boolean) : [])
  ))]

  // 年月一覧
  const years = ["すべて", ...Array.from(new Set(pins.map((pin) => new Date(pin.createdAt).getFullYear().toString()))).sort().reverse()]
  const months = selectedYear === "すべて"
    ? ["すべて"]
    : ["すべて", ...Array.from(new Set(
        pins
          .filter((pin) => new Date(pin.createdAt).getFullYear().toString() === selectedYear)
          .map((pin) => (new Date(pin.createdAt).getMonth() + 1).toString())
      )).sort((a, b) => Number(a) - Number(b))]

  // フィルター処理
  const filteredPins = pins.filter((pin) => {
    const pinYear = new Date(pin.createdAt).getFullYear().toString()
    const pinMonth = (new Date(pin.createdAt).getMonth() + 1).toString()
    const tags = pin.category ? pin.category.split(",").map((t) => t.trim()) : []

    const typeMatch = filter === "all" || (filter === "photo" && pin.type !== "video") || (filter === "video" && pin.type === "video")
    const yearMatch = selectedYear === "すべて" || pinYear === selectedYear
    const monthMatch = selectedMonth === "すべて" || pinMonth === selectedMonth
    const tagMatch = selectedTag === "すべて" || tags.includes(selectedTag)

    return typeMatch && yearMatch && monthMatch && tagMatch
  })

  // アクティブフィルター数
  const activeFilterCount = [
    filter !== "all",
    selectedYear !== "すべて",
    selectedMonth !== "すべて",
    selectedTag !== "すべて",
  ].filter(Boolean).length

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7F5F3]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-[#6B6560]">ログインしてください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <main className="container mx-auto px-4 py-4 max-w-2xl">

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1814]">アルバム</h1>
            <p className="text-xs text-[#A39E99]">{filteredPins.length}件</p>
          </div>

          {/* フィルターボタン */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-full text-sm text-[#1A1814] hover:bg-[#F7F5F3] transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              フィルター
              {activeFilterCount > 0 && (
                <span className="h-4 w-4 bg-[#1A1814] text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* フィルターパネル */}
            {showFilter && (
              <div className="absolute right-0 top-10 bg-white border border-[#E8E4E0] rounded-xl shadow-lg w-64 z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[#1A1814]">フィルター</h2>
                  <button
                    onClick={() => {
                      setFilter("all")
                      setSelectedYear("すべて")
                      setSelectedMonth("すべて")
                      setSelectedTag("すべて")
                    }}
                    className="text-xs text-[#A39E99] hover:text-[#1A1814]"
                  >
                    リセット
                  </button>
                </div>

                {/* タイプ */}
                <div className="mb-3">
                  <p className="text-xs text-[#A39E99] mb-1.5">種類</p>
                  <div className="flex gap-2">
                    {[{ label: "すべて", value: "all" }, { label: "📷 写真", value: "photo" }, { label: "🎥 動画", value: "video" }].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setFilter(f.value as "all" | "photo" | "video")}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          filter === f.value ? "bg-[#1A1814] text-white" : "bg-[#E8E4E0] text-[#6B6560]"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* タグ */}
                <div className="mb-3">
                  <p className="text-xs text-[#A39E99] mb-1.5">タグ</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                          selectedTag === tag ? "bg-[#1A1814] text-white" : "bg-[#E8E4E0] text-[#6B6560]"
                        }`}
                      >
                        {tag === "すべて" ? "すべて" : `#${tag}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 年 */}
                <div className="mb-3">
                  <p className="text-xs text-[#A39E99] mb-1.5">年</p>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value)
                      setSelectedMonth("すべて")
                    }}
                    className="w-full border border-[#E8E4E0] rounded-lg px-3 py-1.5 text-sm bg-[#F7F5F3] focus:outline-none text-[#1A1814]"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year === "すべて" ? "すべての年" : `${year}年`}</option>
                    ))}
                  </select>
                </div>

                {/* 月 */}
                {selectedYear !== "すべて" && (
                  <div>
                    <p className="text-xs text-[#A39E99] mb-1.5">月</p>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full border border-[#E8E4E0] rounded-lg px-3 py-1.5 text-sm bg-[#F7F5F3] focus:outline-none text-[#1A1814]"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>{month === "すべて" ? "すべての月" : `${month}月`}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* グリッド */}
        {loading ? (
          <p className="text-center text-[#A39E99] text-sm">読み込み中...</p>
        ) : filteredPins.length === 0 ? (
          <p className="text-center text-[#A39E99] text-sm mt-8">該当するコンテンツがありません</p>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                className="relative aspect-square bg-[#E8E4E0] cursor-pointer overflow-hidden"
                onClick={() => {
                  if (pin.type === "video") {
                    router.push("/video")
                  } else {
                    router.push(`/pins/${pin.id}`)
                  }
                }}
              >
                {pin.imageUrl ? (
                  <img src={pin.imageUrl} alt={pin.title} className="w-full h-full object-cover" />
                ) : pin.videoUrl ? (
                  <video src={pin.videoUrl} className="w-full h-full object-cover" muted />
                ) : null}

                {/* 動画マーク */}
                {pin.type === "video" && (
                  <div className="absolute top-1 right-1">
                    <Play className="h-4 w-4 text-white drop-shadow-lg" fill="white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}