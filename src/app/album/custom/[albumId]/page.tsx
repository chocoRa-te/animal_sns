"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import HTMLFlipBook from "react-pageflip"

interface Pin {
  id: string
  title: string
  description: string
  imageUrl: string
  videoUrl?: string
  category: string
  type: string
  createdAt: string
}

interface Album {
  id: string
  title: string
  pins: { pin: Pin }[]
}

export default function CustomAlbumPage() {
  const { albumId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const bookRef = useRef<any>(null)
  const [pageSize, setPageSize] = useState({ width: 300, height: 500 })

  useEffect(() => {
    const updateSize = () => {
      setPageSize({
        width: Math.floor(window.innerWidth * 0.46),
        height: Math.floor(window.innerHeight - 160),
      })
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  useEffect(() => {
    if (!albumId) return
    fetch(`/api/albums/${albumId}`)
      .then((res) => res.json())
      .then((data) => {
        setAlbum(data)
        setLoading(false)
      })
  }, [albumId])

  const pins = album?.pins.map((ap) => ap.pin) ?? []

  if (!session) return null

  if (loading) {
    return (
      <div style={{ background: "#F5F0E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#AFA495", fontSize: 12 }}>読み込み中...</p>
      </div>
    )
  }

  return (
    <div style={{ background: "#F5F0E8", height: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #DDD5C4" }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#AFA495", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
          戻る
        </button>
        <p style={{ color: "#2C2416", fontSize: 14, fontFamily: "Georgia, serif", fontWeight: 300 }}>
          {album?.title}
        </p>
        <p style={{ color: "#AFA495", fontSize: 11 }}>
          {Math.min(Math.max(0, currentPage), pins.length)} / {pins.length}
        </p>
      </div>

      {/* 本エリア */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", position: "relative", overflow: "hidden", background: "#F5F0E8" }}>

        {/* 左側シルエット */}
        <div style={{
          width: "8vw",
          alignSelf: "stretch",
          background: currentPage > 0 ? "linear-gradient(to left, #C4BAB0, #D5CFC5)" : "transparent",
          opacity: currentPage > 0 ? 1 : 0,
          transition: "opacity 0.3s",
          flexShrink: 0,
        }} />

        {/* 綴じ目 */}
        <div style={{
          width: 10,
          alignSelf: "stretch",
          background: "linear-gradient(to right, #8B7355, #A08060, #8B7355)",
          boxShadow: "0 0 20px rgba(0,0,0,0.2)",
          flexShrink: 0,
          zIndex: 6,
        }} />

        {/* react-pageflip */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
          {/* @ts-ignore */}
          <HTMLFlipBook
            key={`${pageSize.width}-${pageSize.height}`}
            ref={bookRef}
            width={pageSize.width}
            height={pageSize.height}
            size="fixed"
            minWidth={150}
            maxWidth={800}
            minHeight={300}
            maxHeight={1200}
            showCover={false}
            mobileScrollSupport={true}
            drawShadow={true}
            flippingTime={1000}
            maxShadowOpacity={0.5}
            onFlip={(e: any) => setCurrentPage(Math.min(e.data, pins.length))}
            style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.1)" }}
          >
            {/* 表紙 */}
            <div style={{ background: "#EDE8DC", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
              <p style={{ fontSize: 10, color: "#AFA495", letterSpacing: "0.12em", marginBottom: 12 }}>Album</p>
              <p style={{ fontSize: 24, fontWeight: 300, color: "#2C2416", fontFamily: "Georgia, serif", lineHeight: 1.3, textAlign: "center" }}>
                {album?.title}
              </p>
              <div style={{ width: 24, height: 1, background: "#DDD5C4", margin: "16px auto" }} />
              <p style={{ fontSize: 9, color: "#AFA495" }}>{pins.length}件</p>
            </div>

            {/* 各写真ページ */}
            {pins.map((pin, i) => (
              <div key={pin.id} style={{ background: "#F5F0E8", width: "100%", height: "100%", padding: "20px 16px", boxSizing: "border-box", position: "relative", overflow: "hidden" }}>
                <p style={{ fontSize: 9, color: "#AFA495", letterSpacing: "0.1em", marginBottom: 14, fontFamily: "Georgia, serif" }}>
                  {new Date(pin.createdAt).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
                </p>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", width: 30, height: 10, background: "rgba(201,169,110,0.3)", borderRadius: 1, zIndex: 1 }} />
                  <div style={{ width: "100%", aspectRatio: "4/3", background: "#EDE8DC", borderRadius: 3, overflow: "hidden" }}>
                    {pin.imageUrl && <img src={pin.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                </div>
                {pin.title && <p style={{ fontSize: 11, color: "#2C2416", fontFamily: "Georgia, serif", lineHeight: 1.7, marginBottom: 4 }}>{pin.title}</p>}
                {pin.category && <p style={{ fontSize: 9, color: "#AFA495" }}>{pin.category.split(",").map((t: string) => `#${t.trim()}`).join(" ")}</p>}
                <p style={{ position: "absolute", bottom: 12, right: 14, fontSize: 8, color: "#C4BAB0" }}>{i + 1}</p>
              </div>
            ))}

            {/* 裏表紙 */}
            <div style={{ background: "#EDE8DC", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 20, color: "#AFA495" }}>🐾</p>
            </div>
          </HTMLFlipBook>
        </div>
      </div>

      {/* ナビゲーション */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: "16px 24px 32px", borderTop: "1px solid #DDD5C4" }}>
        <button
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          style={{ background: "none", border: "1px solid #DDD5C4", borderRadius: 20, padding: "8px 16px", color: "#AFA495", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <ChevronLeft style={{ width: 12, height: 12 }} />
          前のページ
        </button>
        <button
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          style={{ background: "none", border: "1px solid #DDD5C4", borderRadius: 20, padding: "8px 16px", color: "#AFA495", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          次のページ
          <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  )
}