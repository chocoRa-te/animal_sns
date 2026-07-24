"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { MoreHorizontal } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
}

interface ChatRoom {
  id: string;
  name: string | null;
  isGroup: boolean;
  members: {
    user: { id: string; name: string; image: string | null };
  }[];
}

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [muted, setMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    messageId: string;
    content: string;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [mentionUsers, setMentionUsers] = useState<
    { id: string; name: string }[]
  >([]);
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // メニューの外をクリックしたら閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ルーム情報を取得
  useEffect(() => {
    if (!roomId) return;

    fetch(`/api/chat/${roomId}/info`)
      .then((res) => res.json())
      .then((data) => setRoom(data));
  }, [roomId]);

  // メッセージを取得（3秒ごとに自動更新）
  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = () => {
      fetch(`/api/chat/${roomId}`)
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);

          // 既読にする
          if (session?.user?.id) {
            fetch(`/api/chat/${roomId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: session.user.id,
                markAsRead: true,
              }),
            });
          }
        });
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [roomId, session]);

  // 一番下にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // @を入力したらグループメンバーを候補に表示
  const handleMessageChange = (value: string) => {
    setNewMessage(value);

    if (!room?.isGroup) return; // グループのみ

    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) {
      setShowMentions(false);
      return;
    }

    const query = value.slice(atIndex + 1).toLowerCase();
    const members = room.members
      .filter((m) => m.user.id !== session?.user?.id)
      .filter((m) => m.user.name?.toLowerCase().includes(query));
    setMentionUsers(members.map((m) => m.user));
    setShowMentions(true);
  };

  // メンションを選択
  const handleMentionSelect = (user: { id: string; name: string }) => {
    const atIndex = newMessage.lastIndexOf("@");
    const before = newMessage.slice(0, atIndex);
    setNewMessage(`${before}@${user.name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  // メッセージ送信
  const handleSend = async () => {
    if (!newMessage.trim() || !session?.user?.id) return;

    await fetch(`/api/chat/${roomId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newMessage,
        userId: session.user.id,
      }),
    });

    setNewMessage("");
  };

  // 右クリック（PC）
  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    if (message.user.id !== session?.user?.id) return; // 自分のメッセージのみ
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: message.id,
      content: message.content,
    });
  };

  // 長押し（スマホ）
  const handleLongPress = (message: Message) => {
    if (message.user.id !== session?.user?.id) return;
    setContextMenu({
      x: window.innerWidth / 2 - 80,
      y: window.innerHeight / 2,
      messageId: message.id,
      content: message.content,
    });
  };

  // メッセージ取り消し
  const handleDelete = async (messageId: string) => {
    if (!session?.user?.id) return;
    await fetch(`/api/chat/${roomId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, userId: session.user.id }),
    });
    setContextMenu(null);
  };

  // メッセージ編集
  const handleEdit = async (messageId: string, newContent: string) => {
    if (!session?.user?.id) return;
    await fetch(`/api/chat/${roomId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, userId: session.user.id, newContent }),
    });
    setEditingMessage(null);
    setContextMenu(null);
  };

  // 通知ミュート切り替え
  const handleMute = async () => {
    if (!session?.user?.id) return;

    const newMuted = !muted;
    setMuted(newMuted);
    setMenuOpen(false);

    await fetch(`/api/chat/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        muteNotifications: newMuted,
      }),
    });
  };

  // ブロック
  const handleBlock = async () => {
    if (!session?.user?.id || !otherMember) return;
    if (!confirm("このユーザーをブロックしますか？")) return;

    await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blockerId: session.user.id,
        blockedId: otherMember.user.id,
      }),
    });

    setMenuOpen(false);
    router.push("/chat");
  };

  // 相手のユーザー情報
  const otherMember = room?.members.find(
    (m) => m.user.id !== session?.user?.id,
  );
  const roomName = room?.isGroup
    ? room.name
    : (otherMember?.user.name ?? "読み込み中...");

  // グループから退出
  const handleLeave = async () => {
    if (!session?.user?.id || !roomId) return;

    await fetch(`/api/chat/${roomId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id, leave: true }),
    });

    router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex flex-col">
      <Navbar />

      {/* 退出確認ダイアログ */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-80 mx-4">
            <h2 className="text-base font-semibold text-[#1A1814] mb-2">
              グループを退出
            </h2>
            <p className="text-sm text-[#6B6560] mb-6">
              このグループから退出しますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2 border border-[#E8E4E0] rounded-lg text-sm text-[#6B6560] hover:bg-[#F7F5F3] transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  handleLeave();
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                退出する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右クリック・長押しメニュー */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-[#E8E4E0] rounded-xl shadow-lg w-40 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setEditingMessage({
                id: contextMenu.messageId,
                content: contextMenu.content,
              });
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-t-xl"
          >
            編集
          </button>
          <button
            onClick={() => handleDelete(contextMenu.messageId)}
            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
          >
            取り消し
          </button>
        </div>
      )}

      {/* メニューの外をクリックしたら閉じる */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* トップバー */}
      <div className="bg-white border-b border-[#E8E4E0] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-[#6B6560] hover:text-[#1A1814] transition-colors"
        >
          ←
        </button>

        {/* アイコン（クリックでプロフィールへ） */}
        <div
          className="h-8 w-8 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity overflow-hidden flex-shrink-0"
          onClick={() =>
            !room?.isGroup &&
            otherMember &&
            router.push(`/users/${otherMember.user.id}`)
          }
        >
          {otherMember?.user.image ? (
            <img
              src={otherMember.user.image}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            (roomName?.[0]?.toUpperCase() ?? "?")
          )}
        </div>

        {/* ユーザー名（クリックでプロフィールへ） */}
        <p
          className={`font-medium text-sm text-[#1A1814] flex-1 ${!room?.isGroup && otherMember ? "cursor-pointer hover:underline" : ""}`}
          onClick={() =>
            !room?.isGroup &&
            otherMember &&
            router.push(`/users/${otherMember.user.id}`)
          }
        >
          {roomName}
        </p>

        {/* 右上の3点メニュー */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-[#E8E4E0] transition-colors"
          >
            <MoreHorizontal className="h-5 w-5 text-[#6B6560]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-[#E8E4E0] rounded-xl shadow-lg w-44 z-50">
              {/* 通知ミュート */}
              <button
                onClick={handleMute}
                className="w-full text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-t-xl transition-colors"
              >
                {muted ? "通知をオンにする" : "通知をオフにする"}
              </button>

              {/* ブロック（1対1のみ） */}
              {!room?.isGroup && (
                <button
                  onClick={handleBlock}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl transition-colors"
                >
                  ブロック
                </button>
              )}

              {/* グループのみ：招待・退出 */}
              {room?.isGroup && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      // TODO: 招待モーダルを開く
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] transition-colors"
                  >
                    メンバーを招待
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowLeaveConfirm(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl transition-colors"
                  >
                    グループを退出
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* メッセージ一覧 */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto max-w-2xl">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-3 ${message.user.id === session?.user?.id ? "justify-end" : "justify-start"}`}
          >
            {/* 相手のアイコン（クリックでプロフィールへ） */}
            {message.user.id !== session?.user?.id && (
              <div
                className="h-7 w-7 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-xs font-bold mr-2 cursor-pointer hover:opacity-80 flex-shrink-0 self-end overflow-hidden"
                onClick={() => router.push(`/users/${message.user.id}`)}
              >
                {message.user.image ? (
                  <img
                    src={message.user.image}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (message.user.name?.[0]?.toUpperCase() ?? "?")
                )}
              </div>
            )}

            <div
              className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                message.user.id === session?.user?.id
                  ? "bg-[#1A1814] text-white"
                  : "bg-white text-[#1A1814] border border-[#E8E4E0]"
              }`}
              onContextMenu={(e) => handleContextMenu(e, message)}
              onTouchStart={() => {
                const timer = setTimeout(() => handleLongPress(message), 500);
                return () => clearTimeout(timer);
              }}
            >
              {/* グループの場合は名前を表示 */}
              {room?.isGroup && message.user.id !== session?.user?.id && (
                <p
                  className="text-xs text-[#A39E99] mb-1 cursor-pointer hover:underline"
                  onClick={() => router.push(`/users/${message.user.id}`)}
                >
                  {message.user.name}
                </p>
              )}
              <p>{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      <div className="relative">
        {/* メンション候補（グループのみ） */}
        {showMentions && mentionUsers.length > 0 && (
          <div className="absolute bottom-16 left-0 right-0 bg-white border border-[#E8E4E0] rounded-xl shadow-lg z-10 max-w-2xl mx-auto">
            {mentionUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleMentionSelect(user)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-[#F7F5F3] cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <p className="text-sm text-[#1A1814]">@{user.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* メッセージ入力 or 編集フォーム */}
        <div className="bg-white border-t border-[#E8E4E0] p-4">
          <div className="container mx-auto flex gap-2 max-w-2xl">
            {editingMessage ? (
              <>
                <input
                  type="text"
                  className="flex-1 border border-[#E8E4E0] rounded-full px-4 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
                  value={editingMessage.content}
                  onChange={(e) =>
                    setEditingMessage({
                      ...editingMessage,
                      content: e.target.value,
                    })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleEdit(editingMessage.id, editingMessage.content)
                  }
                  autoFocus
                />
                <button
                  onClick={() =>
                    handleEdit(editingMessage.id, editingMessage.content)
                  }
                  className="bg-[#1A1814] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#3D3830] transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingMessage(null)}
                  className="bg-[#E8E4E0] text-[#6B6560] rounded-full px-4 py-2 text-sm font-medium hover:bg-[#d4cfc9] transition-colors"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="メッセージを入力..."
                  className="flex-1 border border-[#E8E4E0] rounded-full px-4 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
                  value={newMessage}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="bg-[#1A1814] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#3D3830] transition-colors"
                >
                  送信
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
