"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"

interface FollowRequest {
  id: string
  followerId: string
  follower: {
    id: string
    name: string
    image: string | null
  }
}

export default function FollowRequestsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<FollowRequest[]>([])

  useEffect(() => {
    if (!session?.user?.id) return

    fetch(`/api/follow/requests?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setRequests(data))
  }, [session])

  const handleAction = async (followerId: string, action: "accept" | "reject") => {
    if (!session?.user?.id) return

    await fetch("/api/follow/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerId,
        followingId: session.user.id,
        action,
      }),
    })

    // リストから削除
    setRequests((prev) => prev.filter((r) => r.followerId !== followerId))
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
          <h1 className="text-xl font-semibold text-[#1A1814]">フォローリクエスト</h1>
        </div>

        {requests.length === 0 ? (
          <p className="text-center text-[#A39E99] text-sm mt-8">フォローリクエストはありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E8E4E0]"
              >
                <div
                  className="h-10 w-10 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-sm font-bold cursor-pointer flex-shrink-0"
                  onClick={() => router.push(`/users/${req.followerId}`)}
                >
                  {req.follower.image ? (
                    <img src={req.follower.image} alt={req.follower.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    req.follower.name?.[0]?.toUpperCase() ?? "U"
                  )}
                </div>
                <p
                  className="flex-1 text-sm font-medium text-[#1A1814] cursor-pointer hover:underline"
                  onClick={() => router.push(`/users/${req.followerId}`)}
                >
                  {req.follower.name}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req.followerId, "accept")}
                    className="px-3 py-1.5 bg-[#1A1814] text-white text-xs font-medium rounded-lg hover:bg-[#3D3830] transition-colors"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleAction(req.followerId, "reject")}
                    className="px-3 py-1.5 bg-[#E8E4E0] text-[#6B6560] text-xs font-medium rounded-lg hover:bg-[#d4cfc9] transition-colors"
                  >
                    拒否
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}