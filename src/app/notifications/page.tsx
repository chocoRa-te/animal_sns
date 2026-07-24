"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string };
  pin: { id: string; title: string; imageUrl: string } | null;
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

    // 既読にする
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
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-gray-600">ログインしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">通知</h1>

        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center mt-8">通知はありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  !notification.read ? "bg-gray-100" : ""
                }`}
                onClick={() => {
                  if (notification.pin) {
                    router.push(`/pins/${notification.pin.id}`);
                  } else {
                    router.push(`/users/${notification.sender.id}`);
                  }
                }}
              >
                <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {notification.sender.name?.[0] ?? "U"}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString(
                      "ja-JP",
                    )}
                  </p>
                </div>
                {notification.pin && (
                  <img
                    src={notification.pin.imageUrl}
                    alt={notification.pin.title}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
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
