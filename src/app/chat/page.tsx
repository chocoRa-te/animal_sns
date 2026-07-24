"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

interface ChatRoom {
  id: string;
  name: string | null;
  isGroup: boolean;
  isRequest: boolean;
  members: {
    user: { id: string; name: string };
  }[];
  messages: {
    content: string;
    createdAt: string;
  }[];
  _count: {
    messages: number;
  };
}

interface FollowUser {
  id: string;
  name: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [followingUsers, setFollowingUsers] = useState<FollowUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [tab, setTab] = useState<"chats" | "requests">("chats");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    roomId: string;
  } | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch(`/api/chat?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setRooms(data));

    fetch("/api/pins")
      .then((res) => res.json())
      .then((pins) => {
        fetch(`/api/follow?userId=${session.user.id}`)
          .then((res) => res.json())
          .then((data) => {
            const ids = data.followingIds as string[];
            const users: FollowUser[] = [];
            const seen = new Set<string>();
            for (const pin of pins) {
              if (ids.includes(pin.userId) && !seen.has(pin.userId)) {
                seen.add(pin.userId);
                users.push({
                  id: pin.userId,
                  name: pin.user?.name ?? "unknown",
                });
              }
            }
            setFollowingUsers(users);
          });
      });
  }, [session]);

  const handleCreateGroup = async () => {
    if (!session?.user?.id || !groupName.trim() || selectedMembers.length === 0)
      return;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        isGroup: true,
        name: groupName,
        memberIds: [session.user.id, ...selectedMembers],
      }),
    });
    const room = await res.json();
    router.push(`/chat/${room.id}`);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // トークを削除
  const handleDeleteRoom = async (roomId: string) => {
    if (!session?.user?.id) return;

    await fetch(`/api/chat?roomId=${roomId}&userId=${session.user.id}`, {
      method: "DELETE",
    });

    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setContextMenu(null);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7F5F3]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-[#6B6560]">ログインしてください</p>
        </div>
      </div>
    );
  }

  const normalRooms = rooms.filter((r) => !r.isRequest);
  const requestRooms = rooms.filter((r) => r.isRequest);

  const RoomItem = ({ room }: { room: ChatRoom }) => {
    const otherMember = room.members.find((m) => m.user.id !== session.user.id);
    const roomName = room.isGroup
      ? room.name
      : (otherMember?.user.name ?? "不明");
    const unreadCount = room._count.messages;

    return (
      <div
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E8E4E0] cursor-pointer hover:bg-[#F7F5F3] transition-colors"
        onClick={() => router.push(`/chat/${room.id}`)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, roomId: room.id });
        }}
        onTouchStart={() => {
          const timer = setTimeout(() => {
            setContextMenu({
              x: window.innerWidth / 2 - 80,
              y: window.innerHeight / 2,
              roomId: room.id,
            });
          }, 500);
          return () => clearTimeout(timer);
        }}
      >
        <div className="h-10 w-10 rounded-full bg-[#1A1814] flex items-center justify-center text-white font-bold flex-shrink-0">
          {roomName?.[0] ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[#1A1814]">{roomName}</p>
          <p className="text-xs text-[#A39E99] truncate">
            {room.isRequest
              ? "メッセージリクエスト"
              : (room.messages[0]?.content ?? "メッセージがありません")}
          </p>
        </div>
        {/* 未読バッジ */}
        {unreadCount > 0 && (
          <span className="h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[#1A1814]">チャット</h1>
          <button
            onClick={() => setShowGroupForm(!showGroupForm)}
            className="px-4 py-1.5 bg-[#1A1814] text-white rounded-full text-sm font-medium hover:bg-[#3D3830] transition-colors"
          >
            グループ作成
          </button>
        </div>

        {/* グループ作成モーダル */}
        {showGroupForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-[#1A1814]">
                  グループを作成
                </h2>
                <button
                  onClick={() => setShowGroupForm(false)}
                  className="text-[#A39E99] hover:text-[#1A1814] text-xl"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="グループ名"
                className="w-full border border-[#E8E4E0] rounded-lg px-4 py-2 text-sm mb-3 bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <p className="text-xs text-[#A39E99] mb-2">メンバーを選択：</p>
              <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto">
                {followingUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedMembers.includes(user.id) ? "bg-[#E8E4E0]" : "hover:bg-[#F7F5F3]"}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.[0] ?? "U"}
                    </div>
                    <p className="text-sm text-[#1A1814]">{user.name}</p>
                    {selectedMembers.includes(user.id) && (
                      <span className="ml-auto text-[#1A1814]">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreateGroup}
                className="w-full py-2 bg-[#1A1814] text-white rounded-full text-sm font-medium hover:bg-[#3D3830] transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        )}

        {/* タブ切り替え */}
        <div className="flex gap-6 border-b border-[#E8E4E0] mb-4">
          <button
            onClick={() => setTab("chats")}
            className={`pb-2 text-sm font-medium transition-colors ${tab === "chats" ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px" : "text-[#A39E99] hover:text-[#6B6560]"}`}
          >
            チャット
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`pb-2 text-sm font-medium transition-colors flex items-center gap-1 ${tab === "requests" ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px" : "text-[#A39E99] hover:text-[#6B6560]"}`}
          >
            リクエスト
            {requestRooms.length > 0 && (
              <span className="h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {requestRooms.length}
              </span>
            )}
          </button>
        </div>

        {/* チャット一覧 */}
        <div className="flex flex-col gap-2">
          {tab === "chats" ? (
            normalRooms.length === 0 ? (
              <p className="text-center text-[#A39E99] text-sm mt-8">
                チャットがありません
              </p>
            ) : (
              normalRooms.map((room) => <RoomItem key={room.id} room={room} />)
            )
          ) : requestRooms.length === 0 ? (
            <p className="text-center text-[#A39E99] text-sm mt-8">
              リクエストがありません
            </p>
          ) : (
            requestRooms.map((room) => <RoomItem key={room.id} room={room} />)
          )}
        </div>
        {/* 右クリック・長押しメニュー */}
        {contextMenu && (
          <div
            className="fixed bg-white border border-[#E8E4E0] rounded-xl shadow-lg w-40 z-50"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDeleteRoom(contextMenu.roomId)}
              className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl"
            >
              トークを削除
            </button>
          </div>
        )}
        {contextMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
        )}
      </main>
    </div>
  );
}
