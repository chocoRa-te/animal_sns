"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/Navbar"

export default function PinEditPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  // 既存の投稿情報を取得
  useEffect(() => {
    fetch(`/api/pins/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.pin.title ?? "")
        setDescription(data.pin.description ?? "")
        setTags(data.pin.category ? data.pin.category.split(",").filter(Boolean) : [])
      })
  }, [id])

  // 保存
  const handleSave = async () => {
    if (!session?.user?.id) return
    // if (!title.trim()) {
    //   setMessage("タイトルを入力してください")
    //   return
    // }
    setLoading(true)

    const res = await fetch(`/api/pins/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        category: tags.join(","),
        userId: session.user.id,
      }),
    })

    if (res.ok) {
      router.push(`/pins/${id}`)
    } else {
      setMessage("エラーが発生しました")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-[#6B6560] hover:text-[#1A1814]">←</button>
          <h1 className="text-xl font-semibold text-[#1A1814]">投稿を編集</h1>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-500 rounded-lg text-sm">
            {message}
          </div>
        )}

        <div className="space-y-5">
          {/* タイトル */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">タイトル</label>
            <input
              type="text"
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A39E99] text-[#1A1814]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">説明（任意）</label>
            <textarea
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A39E99] text-[#1A1814] resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* タグ */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">タグ</label>

            {/* デフォルトタグ */}
            <p className="text-xs text-[#A39E99] mb-2">デフォルト</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {["自然", "料理", "インテリア", "旅行"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (!tags.includes(cat)) setTags([...tags, cat])
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                    tags.includes(cat)
                      ? "bg-[#1A1814]/20 text-[#1A1814] border border-[#1A1814]/30"
                      : "bg-[#E8E4E0] text-[#6B6560] hover:bg-[#1A1814] hover:text-white"
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>

            {/* 選択中タグ */}
            {tags.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-[#A39E99] mb-2">選択中</p>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-[#1A1814]/10 border border-[#1A1814]/20 rounded-sm text-xs text-[#1A1814]"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* オリジナルタグ入力 */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="オリジナルタグを入力..."
                className="flex-1 border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A39E99] text-[#1A1814]"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customTag.trim() && !tags.includes(customTag.trim())) {
                    setTags([...tags, customTag.trim()])
                    setCustomTag("")
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customTag.trim() && !tags.includes(customTag.trim())) {
                    setTags([...tags, customTag.trim()])
                    setCustomTag("")
                  }
                }}
                className="px-3 py-2 bg-[#E8E4E0] text-[#6B6560] text-xs font-medium rounded-lg hover:bg-[#1A1814] hover:text-white transition-colors"
              >
                追加
              </button>
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-2.5 bg-[#1A1814] text-white rounded-lg text-sm font-medium hover:bg-[#3D3830] transition-colors disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </main>
    </div>
  )
}