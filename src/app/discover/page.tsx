"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Pin {
  id: string
  title: string
  imageUrl: string
  videoUrl?: string
  category: string
  type: string
  createdAt: string
  userId: string
  user: { name: string; image: string | null }
}

export default function DiscoverPage() {
  const router = useRouter()
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch("/api/pins?type=image")
      .then((res) => res.json())
      .then((data) => {
        setPins(data)
        setLoading(false)
      })
  }, [])

  const rotations = [-2.5, 1.8, 2, -1.5, -1, 2.5, -2, 1.5, -1.8, 2.2]
  const topOffsets = [0, 20, 0, -10, 0, 10, 0, -8, 0, 15]

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-sm text-[#AFA495] mb-6 tracking-wide">発見</h1>

        {/* ポラロイド風グリッド */}
        <div
          className="grid gap-0"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          {loading ? (
            <p className="text-center text-[#AFA495] text-sm col-span-2 mt-8">読み込み中...</p>
          ) : pins.length === 0 ? (
            <p className="text-center text-[#AFA495] text-sm col-span-2 mt-8">まだ写真がありません</p>
          ) : (
            pins.map((pin, i) => (
              <div
                key={pin.id}
                className="relative p-2"
                style={{ marginTop: `${topOffsets[i % topOffsets.length]}px` }}
              >
                <div
                  className="bg-white p-2.5 pb-8 shadow-md cursor-pointer hover:scale-105 transition-transform"
                  style={{ transform: `rotate(${rotations[i % rotations.length]}deg)` }}
                  onClick={() => router.push(`/pins/${pin.id}`)}
                >
                  {/* セロテープ風 */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-3 bg-[#C9A96E]/30 rounded-sm" />
                  {/* 写真 */}
                  <div className="aspect-square bg-[#EDE8DC] overflow-hidden mb-2">
                    {pin.imageUrl ? (
                      <img src={pin.imageUrl} alt={pin.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                    )}
                  </div>
                  {/* キャプション */}
                  <p className="text-[10px] text-[#7A6E5F] text-center font-serif line-clamp-1">
                    {pin.title || pin.user?.name}
                  </p>
                  <p className="text-[9px] text-[#C4BAB0] text-center mt-0.5">
                    {new Date(pin.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}