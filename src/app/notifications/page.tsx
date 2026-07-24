"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Heart, MessageCircle, UserPlus, Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string };
  pin: { id: string; title: string; imageUrl: string } | null;
}

function NotificationIcon({ type }: { type: string }) {
  const base = "w-4 h-4";
  if (type === "like") return <Heart className={`${base} text-red-400`} />;
  if (type === "comment") return <MessageCircle className={`${base} text-[var(--accent)]`} />;
  if (type === "follow" || type === "follow_request")
    return <UserPlus className={`${base} text-[var(--text-secondary)]`} />;
  return <Bell className={`${base} text-[var(--text-muted)]`} />;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/notifications?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    // Optimistic — fire and forget
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
  };

  const markAllAsRead = async () => {
    if (!session?.user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id }),
    });
  };

  const getNotificationText = (n: Notification) => {
    switch (n.type) {
      case "like":
        return `${n.sender.name} があなたの投稿にいいねしました`;
      case "comment":
        return `${n.sender.name} があなたの投稿にコメントしました`;
      case "follow":
        return `${n.sender.name} があなたをフォローしました`;
      case "follow_request":
        return `${n.sender.name} からフォローリクエストが届いています`;
      default:
        return "新しい通知があります";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-[var(--text-secondary)]">ログインしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">通知</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
            >
              すべて既読にする
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)] animate-pulse">
                <div className="h-10 w-10 rounded-full bg-[var(--border)] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[var(--border)] rounded w-3/4" />
                  <div className="h-2.5 bg-[var(--border)] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell className="w-10 h-10 text-[var(--text-muted)] opacity-30 mb-3" />
            <p className="text-[var(--text-muted)] text-sm">通知はありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors border ${
                  !n.read
                    ? "bg-[var(--accent-light)] border-[var(--accent-light)] hover:border-[var(--accent)]/30"
                    : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--background)]"
                }`}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.pin) {
                    router.push(`/pins/${n.pin.id}`);
                  } else {
                    router.push(`/users/${n.sender.id}`);
                  }
                }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[var(--ink)] flex items-center justify-center text-white font-bold text-sm">
                    {n.sender.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                    <NotificationIcon type={n.type} />
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-primary)]"}`}>
                    {getNotificationText(n)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
                )}

                {/* Pin thumbnail */}
                {n.pin && (
                  <img
                    src={n.pin.imageUrl}
                    alt={n.pin.title}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0 border border-[var(--border)]"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
