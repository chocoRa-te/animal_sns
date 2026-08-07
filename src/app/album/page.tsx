"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Plus } from "lucide-react"

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

interface TimelineMonth {
  year: number
  month: number
  count: number
  thumbnail: string
}

interface CustomAlbum {
  tag: string
  photoCount: number
  videoCount: number
  thumbnail: string
}

export default function AlbumPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [pins, setPins] = useState<Pin[]>([])
  const [timeline, setTimeline] = useState<Record<number, TimelineMonth[]>>({})
  const [customAlbums, setCustomAlbums] = useState<CustomAlbum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const myPins: Pin[] = data.filter((pin: any) => pin.userId === session.user.id)
        setPins(myPins)

        // タイムライン生成（年月ごと）
        const timelineMap: Record<string, TimelineMonth> = {}
        myPins.forEach((pin) => {
          const d = new Date(pin.createdAt)
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`
          if (!timelineMap[key]) {
            timelineMap[key] = {
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              count: 0,
              thumbnail: pin.imageUrl || pin.videoUrl || "",
            }
          }
          timelineMap[key].count++
        })

        // 年ごとにグループ化
        const byYear: Record<number, TimelineMonth[]> = {}
        Object.values(timelineMap).forEach((m) => {
          if (!byYear[m.year]) byYear[m.year] = []
          byYear[m.year].push(m)
        })
        Object.keys(byYear).forEach((year) => {
          byYear[Number(year)].sort((a, b) => b.month - a.month)
        })
        setTimeline(byYear)

        // カスタムアルバム（タグ別）
        const tagMap: Record<string, CustomAlbum> = {}
        myPins.forEach((pin) => {
          if (!pin.category) return
          pin.category.split(",").map((t) => t.trim()).filter(Boolean).forEach((tag) => {
            if (!tagMap[tag]) {
              tagMap[tag] = {
                tag,
                photoCount: 0,
                videoCount: 0,
                thumbnail: pin.imageUrl || pin.videoUrl || "",
              }
            }
            if (pin.type === "video") tagMap[tag].videoCount++
            else tagMap[tag].photoCount++
          })
        })
        setCustomAlbums(Object.values(tagMap))
        setLoading(false)
      })
  }, [session])

  const sortedYears = Object.keys(timeline).map(Number).sort((a, b) => b - a)

  const bookColors = [
    { bg: "#EDE8DC", spine: "#DDD5C4" },
    { bg: "#E8E2D8", spine: "#C9BFB5" },
    { bg: "#E4DDD3", spine: "#C4BAB0" },
    { bg: "#E0D9CF", spine: "#BFB5AB" },
    { bg: "#DDD6CC", spine: "#BDB3A9" },
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <p className="text-[#AFA495] text-sm">ログインしてください</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">

      {/* ヘッダー */}
      <div className="px-6 pt-12 pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-[#AFA495] mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          プロフィール
        </button>
        <h1 className="text-3xl font-light text-[#2C2416] font-serif tracking-tight">アルバム</h1>
        <p className="text-xs text-[#AFA495] mt-1.5 tracking-wide">思い出の記録</p>
      </div>

      {/* タイムライン */}
      <div className="px-6 mb-2">
        <p className="text-[10px] text-[#AFA495] tracking-widest uppercase mb-3">タイムライン</p>
      </div>
      <div className="h-px bg-[#DDD5C4] mx-6 mb-6" />

      {loading ? (
        <p className="text-center text-[#AFA495] text-sm px-6">読み込み中...</p>
      ) : sortedYears.length === 0 ? (
        <p className="text-center text-[#AFA495] text-sm px-6">まだ記録がありません</p>
      ) : (
        sortedYears.map((year) => (
          <div key={year} className="mb-8">
            <p className="text-sm text-[#AFA495] font-serif px-6 mb-3">{year}</p>
            <div className="flex gap-4 overflow-x-auto px-6 pb-3 scrollbar-hide">
              {timeline[year].map((m, i) => {
                const color = bookColors[i % bookColors.length]
                return (
                  <div
                    key={`${year}-${m.month}`}
                    className="flex-shrink-0 cursor-pointer"
                    style={{ width: 88 }}
                    onClick={() => router.push(`/album/timeline/${year}/${m.month}`)}
                  >
                    {/* 本のカバー */}
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: 88,
                        height: 116,
                        borderRadius: "2px 8px 8px 2px",
                        background: color.bg,
                        boxShadow: "-3px 3px 8px rgba(44,36,22,0.15), inset -2px 0 4px rgba(44,36,22,0.08)",
                      }}
                    >
                      {/* 背表紙 */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0, top: 0, bottom: 0,
                          width: 8,
                          background: color.spine,
                        }}
                      />
                      {/* サムネイル */}
                      {m.thumbnail ? (
                        <img
                          src={m.thumbnail}
                          alt=""
                          style={{
                            position: "absolute",
                            left: 8, top: 0, right: 0, bottom: 0,
                            width: "calc(100% - 8px)",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.85,
                          }}
                        />
                      ) : (
                        <div style={{ position: "absolute", left: 8, top: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🐾</div>
                      )}
                    </div>
                    <p className="text-xs text-[#2C2416] font-serif text-center mt-2">{m.month}月</p>
                    <p className="text-[9px] text-[#AFA495] text-center mt-0.5">{m.count}件</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* カスタムアルバム */}
      <div className="mt-4 px-6 mb-2">
        <p className="text-[10px] text-[#AFA495] tracking-widest uppercase mb-3">マイアルバム</p>
      </div>
      <div className="h-px bg-[#DDD5C4] mx-6 mb-6" />

      <div className="grid grid-cols-2 gap-5 px-6">
        {customAlbums.map((album, i) => {
          const color = bookColors[i % bookColors.length]
          return (
            <div
              key={album.tag}
              className="cursor-pointer"
              onClick={() => router.push(`/album/${encodeURIComponent(album.tag)}`)}
            >
              <div
                className="relative overflow-hidden w-full"
                style={{
                  aspectRatio: "3/4",
                  borderRadius: "2px 12px 12px 2px",
                  background: color.bg,
                  boxShadow: "-4px 4px 12px rgba(44,36,22,0.15), inset -3px 0 6px rgba(44,36,22,0.08)",
                }}
              >
                {/* 背表紙 */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: color.spine }} />
                {/* サムネイル */}
                {album.thumbnail ? (
                  <img
                    src={album.thumbnail}
                    alt=""
                    style={{
                      position: "absolute",
                      left: 12, top: 0, right: 0, bottom: 40,
                      width: "calc(100% - 12px)",
                      height: "calc(100% - 40px)",
                      objectFit: "cover",
                      opacity: 0.85,
                    }}
                  />
                ) : (
                  <div style={{ position: "absolute", left: 12, top: 0, right: 0, bottom: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🐾</div>
                )}
                {/* ラベル */}
                <div style={{ position: "absolute", bottom: 0, left: 12, right: 0, height: 40, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}>
                  <p style={{ fontSize: 10, color: "#2C2416", textAlign: "center", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>#{album.tag}</p>
                </div>
              </div>
              <p className="text-xs text-[#2C2416] font-serif mt-2 pl-3">#{album.tag}</p>
              <p className="text-[10px] text-[#AFA495] mt-0.5 pl-3">{album.photoCount + album.videoCount}件</p>
            </div>
          )
        })}

        {/* 新しいアルバム追加 */}
        <div className="cursor-pointer">
          <div
            className="w-full border border-dashed border-[#C4BAB0] flex flex-col items-center justify-center gap-2"
            style={{ aspectRatio: "3/4", borderRadius: "2px 12px 12px 2px" }}
          >
            <div className="w-8 h-8 rounded-full border border-[#C4BAB0] flex items-center justify-center">
              <Plus className="h-4 w-4 text-[#AFA495]" />
            </div>
            <p className="text-[11px] text-[#AFA495]">新しいアルバム</p>
          </div>
          <p className="text-xs text-[#AFA495] font-serif mt-2 pl-3">新しいアルバム</p>
        </div>
      </div>
    </div>
  )
}