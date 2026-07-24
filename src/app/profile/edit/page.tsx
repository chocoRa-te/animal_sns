"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"

export default function ProfileEditPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    fetch(`/api/settings?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.name ?? "")
        setBio(data.bio ?? "")
      })
  }, [session])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!session?.user?.id) return
    setLoading(true)

    let imageUrl = undefined

    if (imageFile) {
      const formData = new FormData()
      formData.append("file", imageFile)
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      )
      const cloudinaryData = await cloudinaryRes.json()
      imageUrl = cloudinaryData.secure_url
    }

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        name,
        bio,
        ...(imageUrl && { image: imageUrl }),
      }),
    })

    if (res.ok) {
      setMessage("プロフィールを更新しました")
      setTimeout(() => router.push("/profile"), 1000)
    } else {
      setMessage("エラーが発生しました")
    }
    setLoading(false)
  }

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
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-[#6B6560] hover:text-[#1A1814]">←</button>
          <h1 className="text-xl font-semibold text-[#1A1814]">プロフィールを編集</h1>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-[#E8E4E0] text-[#1A1814] rounded-lg text-sm">{message}</div>
        )}

        <div className="bg-white rounded-xl border border-[#E8E4E0] p-6 space-y-5">

          {/* アイコン変更 */}
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-[#1A1814] flex items-center justify-center text-white text-2xl font-bold">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                session.user.name?.[0]?.toUpperCase() ?? "U"
              )}
            </div>
            <label className="text-sm text-[#6B6560] cursor-pointer hover:text-[#1A1814] transition-colors">
              アイコンを変更
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          {/* 名前 */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">名前</label>
            <input
              type="text"
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99] text-[#1A1814]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 自己紹介 */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">自己紹介</label>
            <textarea
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99] text-[#1A1814] resize-none"
              rows={3}
              placeholder="自己紹介を入力..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={150}
            />
            <p className="text-xs text-[#A39E99] text-right mt-1">{bio.length}/150</p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-2.5 bg-[#1A1814] text-white rounded-lg text-sm font-medium hover:bg-[#3D3830] transition-colors"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </main>
    </div>
  )
}