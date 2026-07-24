"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative ${value ? "bg-[#1A1814]" : "bg-[#E8E4E0]"}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  )
}

function SettingRow({ label, description, value, onChange }: {
  label: string
  description: string
  value: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#E8E4E0] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#1A1814]">{label}</p>
        <p className="text-xs text-[#A39E99] mt-0.5">{description}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [showLikeCount, setShowLikeCount] = useState(false)
  const [notificationsOn, setNotificationsOn] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const [showActivity, setShowActivity] = useState(true)
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [showReadReceipt, setShowReadReceipt] = useState(true)
  const [allowDMRequests, setAllowDMRequests] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    fetch(`/api/settings?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setShowLikeCount(data.showLikeCount)
        setNotificationsOn(data.notificationsOn)
        setIsPrivate(data.isPrivate)
        setShowActivity(data.showActivity)
        setCommentsEnabled(data.commentsEnabled)
        setShowReadReceipt(data.showReadReceipt)
        setAllowDMRequests(data.allowDMRequests)
      })
  }, [session])

  const handleToggle = async (key: string, value: boolean) => {
    if (!session?.user?.id) return
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        [key]: value,
      }),
    })
  }

  const handlePasswordChange = async () => {
    if (!session?.user?.id || !currentPassword || !newPassword) return
    setLoading(true)

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        currentPassword,
        newPassword,
      }),
    })

    const data = await res.json()
    setMessage(data.message)
    setTimeout(() => setMessage(""), 3000)
    setCurrentPassword("")
    setNewPassword("")
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!session?.user?.id) return
    if (!confirm("本当にアカウントを削除しますか？この操作は取り消せません。")) return

    await fetch(`/api/settings?userId=${session.user.id}`, { method: "DELETE" })
    await signOut({ callbackUrl: "/login" })
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
        <h1 className="text-xl font-semibold mb-6 text-[#1A1814]">設定</h1>

        {message && (
          <div className="mb-4 p-3 bg-[#E8E4E0] text-[#1A1814] rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* 表示設定 */}
        <section className="bg-white rounded-xl p-4 mb-4 border border-[#E8E4E0]">
          <h2 className="text-xs font-semibold text-[#A39E99] uppercase tracking-wide mb-3">表示</h2>
          <SettingRow
            label="いいね数を表示"
            description="自分の投稿のいいね数を他のユーザーに表示する"
            value={showLikeCount}
            onChange={() => {
              const newVal = !showLikeCount
              setShowLikeCount(newVal)
              handleToggle("showLikeCount", newVal)
            }}
          />
          <SettingRow
            label="アクティビティステータス"
            description="オンライン状態を他のユーザーに表示する"
            value={showActivity}
            onChange={() => {
              const newVal = !showActivity
              setShowActivity(newVal)
              handleToggle("showActivity", newVal)
            }}
          />
        </section>

        {/* プライバシー設定 */}
        <section className="bg-white rounded-xl p-4 mb-4 border border-[#E8E4E0]">
          <h2 className="text-xs font-semibold text-[#A39E99] uppercase tracking-wide mb-3">プライバシー</h2>
          <SettingRow
            label="非公開アカウント"
            description="フォロワー以外には投稿を表示しない"
            value={isPrivate}
            onChange={() => {
              const newVal = !isPrivate
              setIsPrivate(newVal)
              handleToggle("isPrivate", newVal)
            }}
          />
          <SettingRow
            label="コメントを許可"
            description="投稿へのコメントを受け付ける"
            value={commentsEnabled}
            onChange={() => {
              const newVal = !commentsEnabled
              setCommentsEnabled(newVal)
              handleToggle("commentsEnabled", newVal)
            }}
          />
        </section>

        {/* メッセージ設定 */}
        <section className="bg-white rounded-xl p-4 mb-4 border border-[#E8E4E0]">
          <h2 className="text-xs font-semibold text-[#A39E99] uppercase tracking-wide mb-3">メッセージ</h2>
          <SettingRow
            label="既読を表示"
            description="メッセージを読んだことを相手に伝える"
            value={showReadReceipt}
            onChange={() => {
              const newVal = !showReadReceipt
              setShowReadReceipt(newVal)
              handleToggle("showReadReceipt", newVal)
            }}
          />
          <SettingRow
            label="メッセージリクエストを受け取る"
            description="フォローしていない相手からのメッセージを受け取る"
            value={allowDMRequests}
            onChange={() => {
              const newVal = !allowDMRequests
              setAllowDMRequests(newVal)
              handleToggle("allowDMRequests", newVal)
            }}
          />
        </section>

        {/* 通知設定 */}
        <section className="bg-white rounded-xl p-4 mb-4 border border-[#E8E4E0]">
          <h2 className="text-xs font-semibold text-[#A39E99] uppercase tracking-wide mb-3">通知</h2>
          <SettingRow
            label="通知を受け取る"
            description="いいね・コメント・フォローの通知を受け取る"
            value={notificationsOn}
            onChange={() => {
              const newVal = !notificationsOn
              setNotificationsOn(newVal)
              handleToggle("notificationsOn", newVal)
            }}
          />
        </section>

        {/* パスワード変更 */}
        <section className="bg-white rounded-xl p-4 mb-4 border border-[#E8E4E0]">
          <h2 className="text-xs font-semibold text-[#A39E99] uppercase tracking-wide mb-3">パスワード変更</h2>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="現在のパスワード"
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="新しいパスワード"
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={handlePasswordChange}
              disabled={loading}
              className="w-full py-2.5 bg-[#1A1814] text-white rounded-lg text-sm font-medium hover:bg-[#3D3830] transition-colors"
            >
              パスワードを変更
            </button>
          </div>
        </section>

        {/* アカウント削除 */}
        <section className="bg-white rounded-xl p-4 mb-8 border border-[#E8E4E0]">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">危険な操作</h2>
          <button
            onClick={handleDelete}
            className="w-full py-2.5 bg-red-50 text-red-500 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            アカウントを削除する
          </button>
        </section>
      </main>
    </div>
  )
}