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
  const base = "h-4 w-4";
  switch (type) {
    case "like":
      return <Heart className={`${base} text-[#C9A96E]`} fill="currentColor" />;
    case "comment":
      return <MessageCircle className={`${base} text-[#6B6560]`} />;
    case "follow":
    case "follow_request":
      return <UserPlus className={`${base} text-[#6B6560]`} />;
    default:
      return <Bell className={`${base} text-[#A39E99]`} />;
  }
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/notifications?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data));

    // Mark all as read
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id }),
    });
  }, [session]);

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return `${notification.sender.name} があなたの投稿にいいねしました`;
      case "comment":
        return `${notification.sender.name} があなたの投稿にコメントしました`;
      case "follow":
        return `${notification.sender.name} があなたをフォローしました`;
      case "follow_request":
        return `${notification.sender.name} からフォローリクエストが届いています`;
      default:
        return "新しい通知があります";
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7F5F3]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-[#6B6560] text-sm">ログインしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-[#1A1814] mb-6">通知</h1>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-12 w-12 rounded-full bg-[#E8E4E0] flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#A39E99]" />
            </div>
            <p className="text-[#A39E99] text-sm">通知はありません</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-colors hover:bg-[#E8E4E0]/60 ${
                  !notification.read ? "bg-[#FFFFFF] border border-[#E8E4E0]" : "bg-transparent"
                }`}
                onClick={() => {
                  if (notification.pin) {
                    router.push(`/pins/${notification.pin.id}`);
                  } else {
                    router.push(`/users/${notification.sender.id}`);
                  }
                }}
              >
                {/* Avatar with type icon badge */}
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-sm font-semibold">
                    {notification.sender.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#F7F5F3] border border-[#E8E4E0] flex items-center justify-center">
                    <NotificationIcon type={notification.type} />
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A1814] leading-snug">
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-[#A39E99] mt-0.5">
                    {new Date(notification.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>

                {notification.pin?.imageUrl && (
                  <img
                    src={notification.pin.imageUrl}
                    alt={notification.pin.title}
                    className="h-12 w-12 rounded-xl object-cover shrink-0"
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
