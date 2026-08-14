"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative ${value ? "bg-[#2C2416]" : "bg-[#DDD5C4]"}`}
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
    <div className="flex items-center justify-between py-3 border-b border-[#DDD5C4] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#2C2416]">{label}</p>
        <p className="text-xs text-[#AFA495] mt-0.5">{description}</p>
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
  const [defaultPostVisibility, setDefaultPostVisibility] = useState(true)
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
        setDefaultPostVisibility(data.defaultPostVisibility ?? true)
      })
  }, [session])

  const handleToggle = async (key: string, value: boolean) => {
    if (!session?.user?.id) return
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id, [key]: value }),
    })
  }

  const handlePasswordChange = async () => {
    if (!session?.user?.id || !currentPassword || !newPassword) return
    setLoading(true)
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id, currentPassword, newPassword }),
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
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <p className="text-[#AFA495] text-sm">ログインしてください</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#AFA495] hover:text-[#2C2416] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-light text-[#2C2416] font-serif">設定</h1>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-[#EDE8DC] text-[#2C2416] rounded-xl text-sm">
            {message}
          </div>
        )}

        {/* 表示設定 */}
        <section className="bg-[#EDE8DC] rounded-2xl p-4 mb-4">
          <h2 className="text-[10px] font-medium text-[#AFA495] uppercase tracking-widest mb-3">表示</h2>
          <SettingRow
            label="いいね数を表示"
            description="自分の投稿のいいね数を他のユーザーに表示する"
            value={showLikeCount}
            onChange={() => { const v = !showLikeCount; setShowLikeCount(v); handleToggle("showLikeCount", v) }}
          />
          <SettingRow
            label="アクティビティステータス"
            description="オンライン状態を他のユーザーに表示する"
            value={showActivity}
            onChange={() => { const v = !showActivity; setShowActivity(v); handleToggle("showActivity", v) }}
          />
        </section>

        {/* プライバシー設定 */}
        <section className="bg-[#EDE8DC] rounded-2xl p-4 mb-4">
          <h2 className="text-[10px] font-medium text-[#AFA495] uppercase tracking-widest mb-3">プライバシー</h2>
          <SettingRow
            label="非公開アカウント"
            description="フォロワー以外には投稿を表示しない"
            value={isPrivate}
            onChange={() => { const v = !isPrivate; setIsPrivate(v); handleToggle("isPrivate", v) }}
          />
          <SettingRow
            label="コメントを許可"
            description="投稿へのコメントを受け付ける"
            value={commentsEnabled}
            onChange={() => { const v = !commentsEnabled; setCommentsEnabled(v); handleToggle("commentsEnabled", v) }}
          />
          <SettingRow
            label="新規投稿をデフォルトで公開"
            description="オフにすると、新しい投稿・動画は初期状態で非公開になる"
            value={defaultPostVisibility}
            onChange={() => { const v = !defaultPostVisibility; setDefaultPostVisibility(v); handleToggle("defaultPostVisibility", v) }}
          />
        </section>

        {/* メッセージ設定 */}
        <section className="bg-[#EDE8DC] rounded-2xl p-4 mb-4">
          <h2 className="text-[10px] font-medium text-[#AFA495] uppercase tracking-widest mb-3">メッセージ</h2>
          <SettingRow
            label="既読を表示"
            description="メッセージを読んだことを相手に伝える"
            value={showReadReceipt}
            onChange={() => { const v = !showReadReceipt; setShowReadReceipt(v); handleToggle("showReadReceipt", v) }}
          />
          <SettingRow
            label="メッセージリクエストを受け取る"
            description="フォローしていない相手からのメッセージを受け取る"
            value={allowDMRequests}
            onChange={() => { const v = !allowDMRequests; setAllowDMRequests(v); handleToggle("allowDMRequests", v) }}
          />
        </section>

        {/* 通知設定 */}
        <section className="bg-[#EDE8DC] rounded-2xl p-4 mb-4">
          <h2 className="text-[10px] font-medium text-[#AFA495] uppercase tracking-widest mb-3">通知</h2>
          <SettingRow
            label="通知を受け取る"
            description="いいね・コメント・フォローの通知を受け取る"
            value={notificationsOn}
            onChange={() => { const v = !notificationsOn; setNotificationsOn(v); handleToggle("notificationsOn", v) }}
          />
        </section>

        {/* パスワード変更 */}
        <section className="bg-[#EDE8DC] rounded-2xl p-4 mb-4">
          <h2 className="text-[10px] font-medium text-[#AFA495] uppercase tracking-widest mb-3">パスワード変更</h2>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="現在のパスワード"
              className="w-full border border-[#DDD5C4] rounded-xl px-4 py-3 text-sm bg-[#F5F0E8] focus:outline-none text-[#2C2416] placeholder:text-[#C4BAB0]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="新しいパスワード"
              className="w-full border border-[#DDD5C4] rounded-xl px-4 py-3 text-sm bg-[#F5F0E8] focus:outline-none text-[#2C2416] placeholder:text-[#C4BAB0]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={handlePasswordChange}
              disabled={loading}
              className="w-full py-3 bg-[#2C2416] text-[#F5F0E8] rounded-xl text-sm font-medium hover:bg-[#483C2A] transition-colors disabled:opacity-50"
            >
              パスワードを変更
            </button>
          </div>
        </section>

        {/* アカウント削除 */}
        <section className="bg-[#EDE8DC] rounded-2xl p-4 mb-8">
          <h2 className="text-[10px] font-medium text-red-400 uppercase tracking-widest mb-3">危険な操作</h2>
          <button
            onClick={handleDelete}
            className="w-full py-3 bg-red-50 text-red-400 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
          >
            アカウントを削除する
          </button>
        </section>
      </div>
    </div>
  )
}