"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface Pin {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  userId: string;
  user: { name: string };
}

interface Comment {
  id: string;
  content: string;
  user: { id: string; name: string };
  createdAt: string;
}

interface MentionUser {
  id: string;
  name: string;
  image: string | null;
}

export default function PinDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();

  const [pin, setPin] = useState<Pin | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
  // Per-comment inline menu (replaces right-click only)
  const [openCommentMenu, setOpenCommentMenu] = useState<string | null>(null);
  const [pinMenuOpen, setPinMenuOpen] = useState(false);
  const pinMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/pins/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPin(data.pin);
        setComments(data.comments);
      });
  }, [id]);

  // Close pin menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pinMenuRef.current && !pinMenuRef.current.contains(e.target as Node)) {
        setPinMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCommentChange = async (value: string) => {
    setNewComment(value);
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) { setShowMentions(false); return; }
    const query = value.slice(atIndex + 1);
    if (query.length === 0) { setShowMentions(true); setMentionUsers([]); return; }
    const res = await fetch(`/api/users?query=${query}`);
    const users = await res.json();
    setMentionUsers(users);
    setShowMentions(true);
  };

  const handleMentionSelect = (user: MentionUser) => {
    const atIndex = newComment.lastIndexOf("@");
    const before = newComment.slice(0, atIndex);
    setNewComment(`${before}@${user.name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleComment = async () => {
    if (!newComment.trim() || !session?.user?.id) return;
    const res = await fetch(`/api/pins/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment, userId: session.user.id }),
    });
    const comment = await res.json();
    setComments((prev) => [...prev, comment]);
    setNewComment("");
    setShowMentions(false);
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!session?.user?.id) return;
    await fetch(`/api/pins/${id}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, userId: session.user.id }),
    });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setOpenCommentMenu(null);
  };

  const handleCommentEdit = async (commentId: string, content: string) => {
    if (!session?.user?.id || !content.trim()) return;
    const res = await fetch(`/api/pins/${id}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, userId: session.user.id, content }),
    });
    const updated = await res.json();
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    setEditingComment(null);
  };

  const handleDelete = async () => {
    await fetch(`/api/pins/${id}`, { method: "DELETE" });
    window.location.href = "/";
  };

  const renderComment = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const username = part.slice(1);
        return (
          <span
            key={i}
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => {
              fetch(`/api/users?query=${username}`)
                .then((res) => res.json())
                .then((users) => { if (users[0]) router.push(`/users/${users[0].id}`); });
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!pin)
    return (
      <div className="min-h-screen bg-[#F7F5F3]">
        <Navbar />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />

      {/* Close any open comment menu on backdrop click */}
      {openCommentMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenCommentMenu(null)} />
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ── Image — natural aspect ratio ── */}
          <div className="relative rounded-2xl overflow-hidden bg-[#E8E4E0]">
            <Image
              src={pin.imageUrl || "/placeholder.svg"}
              alt={pin.title || "投稿"}
              width={800}
              height={1000}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* ── Details + Comments ── */}
          <div className="flex flex-col">
            {/* Title + owner menu */}
            <div className="flex items-start justify-between mb-2 gap-2">
              <h1 className="text-xl font-semibold text-[#1A1814] leading-snug">
                {pin.title}
              </h1>

              {session?.user?.id === pin.userId && (
                <div className="relative shrink-0" ref={pinMenuRef}>
                  <button
                    aria-label="メニューを開く"
                    onClick={() => setPinMenuOpen(!pinMenuOpen)}
                    className="p-1.5 rounded-full hover:bg-[#E8E4E0] transition-colors"
                  >
                    <MoreHorizontal className="h-5 w-5 text-[#6B6560]" />
                  </button>
                  {pinMenuOpen && (
                    <div className="absolute right-0 top-9 bg-white border border-[#E8E4E0] rounded-2xl shadow-lg w-36 z-50 overflow-hidden animate-fade-in">
                      <button
                        onClick={() => router.push(`/pins/${id}/edit`)}
                        className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3]"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#6B6560]" />
                        編集
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        削除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {pin.description && (
              <p className="text-sm text-[#6B6560] mb-2 leading-relaxed">{pin.description}</p>
            )}

            <button
              className="text-xs text-[#A39E99] mb-6 text-left w-fit hover:underline"
              onClick={() => router.push(`/users/${pin.userId}`)}
            >
              @{pin.user?.name}
            </button>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              <h2 className="text-sm font-semibold text-[#1A1814] mb-3">コメント</h2>
              {comments.length === 0 ? (
                <p className="text-[#A39E99] text-sm">まだコメントがありません</p>
              ) : (
                comments.map((comment) => {
                  const isOwn = session?.user?.id === comment.user.id;
                  return (
                    <div
                      key={comment.id}
                      className="bg-white rounded-xl p-3 border border-[#E8E4E0]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          className="text-xs font-medium text-[#1A1814] hover:underline"
                          onClick={() => router.push(`/users/${comment.user.id}`)}
                        >
                          @{comment.user?.name}
                        </button>

                        {/* Always-visible 3-dot menu for own comments */}
                        {isOwn && (
                          <div className="relative shrink-0">
                            <button
                              aria-label="コメントメニュー"
                              className="p-0.5 rounded-full hover:bg-[#E8E4E0] transition-colors"
                              onClick={() =>
                                setOpenCommentMenu(
                                  openCommentMenu === comment.id ? null : comment.id,
                                )
                              }
                            >
                              <MoreHorizontal className="h-4 w-4 text-[#A39E99]" />
                            </button>

                            {openCommentMenu === comment.id && (
                              <div className="absolute right-0 top-7 bg-white border border-[#E8E4E0] rounded-2xl shadow-lg w-28 z-50 overflow-hidden animate-fade-in">
                                <button
                                  onClick={() => {
                                    setEditingComment({ id: comment.id, content: comment.content });
                                    setOpenCommentMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-xs text-[#1A1814] hover:bg-[#F7F5F3]"
                                >
                                  <Pencil className="w-3 h-3 text-[#6B6560]" />
                                  編集
                                </button>
                                <button
                                  onClick={() => handleCommentDelete(comment.id)}
                                  className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-xs text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  削除
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {editingComment?.id === comment.id ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            className="flex-1 border border-[#E8E4E0] rounded-full px-3 py-1 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
                            value={editingComment.content}
                            onChange={(e) =>
                              setEditingComment({ ...editingComment, content: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.nativeEvent.isComposing)
                                handleCommentEdit(comment.id, editingComment.content);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleCommentEdit(comment.id, editingComment.content)}
                            className="text-xs bg-[#1A1814] text-white px-3 py-1 rounded-full hover:bg-[#3D3830] transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingComment(null)}
                            className="text-xs text-[#A39E99] hover:text-[#6B6560]"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-[#6B6560] mt-1 leading-relaxed">
                          {renderComment(comment.content)}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment input */}
            {session ? (
              <div className="relative">
                {showMentions && mentionUsers.length > 0 && (
                  <div className="absolute bottom-12 left-0 right-0 bg-white border border-[#E8E4E0] rounded-2xl shadow-lg z-10 overflow-hidden">
                    {mentionUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleMentionSelect(user)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F5F3] cursor-pointer"
                      >
                        <div className="h-7 w-7 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-xs font-bold">
                          {user.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <p className="text-sm text-[#1A1814]">@{user.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="コメントを追加... (@でメンション)"
                    className="flex-1 border border-[#E8E4E0] rounded-full px-4 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99] text-[#1A1814]"
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) handleComment();
                    }}
                  />
                  <button
                    onClick={handleComment}
                    className="bg-[#1A1814] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#3D3830] transition-colors"
                  >
                    送信
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#A39E99]">
                コメントするにはログインしてください
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
