"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { MoreHorizontal, ChevronLeft } from "lucide-react";

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
  const [editingComment, setEditingComment] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [commentContextMenu, setCommentContextMenu] = useState<{
    x: number;
    y: number;
    commentId: string;
    content: string;
  } | null>(null);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pinMenuRef.current &&
        !pinMenuRef.current.contains(e.target as Node)
      ) {
        setPinMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCommentChange = async (value: string) => {
    setNewComment(value);
    const atIndex = value.lastIndexOf("@");
    if (atIndex === -1) {
      setShowMentions(false);
      return;
    }
    const query = value.slice(atIndex + 1);
    if (query.length === 0) {
      setShowMentions(true);
      setMentionUsers([]);
      return;
    }
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
    if (!confirm("コメントを削除しますか？")) return;
    await fetch(`/api/pins/${id}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, userId: session.user.id }),
    });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
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
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/pins/${id}`, { method: "DELETE" });
    router.push("/");
  };

  const renderComment = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const username = part.slice(1);
        return (
          <span
            key={i}
            className="text-[#C9A96E] cursor-pointer hover:underline"
            onClick={() => {
              fetch(`/api/users?query=${username}`)
                .then((res) => res.json())
                .then((users) => {
                  if (users[0]) router.push(`/users/${users[0].id}`);
                });
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!pin) return <div className="min-h-screen bg-[#F5F0E8]" />;

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      {/* コメント右クリックメニュー */}
      {commentContextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setCommentContextMenu(null)}
          />
          <div
            className="fixed bg-white border border-[#DDD5C4] rounded-xl shadow-lg w-40 z-50"
            style={{ top: commentContextMenu.y, left: commentContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setEditingComment({
                  id: commentContextMenu.commentId,
                  content: commentContextMenu.content,
                });
                setCommentContextMenu(null);
              }}
              className="w-full text-left px-4 py-3 text-sm text-[#2C2416] hover:bg-[#EDE8DC] rounded-t-xl"
            >
              編集
            </button>
            <button
              onClick={() => {
                handleCommentDelete(commentContextMenu.commentId);
                setCommentContextMenu(null);
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-50 rounded-b-xl"
            >
              削除
            </button>
          </div>
        </>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 戻るボタン */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs text-[#AFA495] mb-6 hover:text-[#2C2416] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          戻る
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 画像 */}
          {pin.imageUrl && (
            <div className="rounded-2xl overflow-hidden">
              <img
                src={pin.imageUrl}
                alt={pin.title || "投稿"}
                className="w-full h-auto object-contain rounded-2xl"
                style={{ maxHeight: "400px" }}
              />
            </div>
          )}

          {/* 詳細・コメント */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-light text-[#2C2416] font-serif">
                {pin.title}
              </h1>
              {session?.user?.id === pin.userId && (
                <div className="relative" ref={pinMenuRef}>
                  <button
                    onClick={() => setPinMenuOpen(!pinMenuOpen)}
                    className="p-1 rounded-full hover:bg-[#EDE8DC] transition-colors"
                  >
                    <MoreHorizontal className="h-5 w-5 text-[#AFA495]" />
                  </button>
                  {pinMenuOpen && (
                    <div className="absolute right-0 top-8 bg-white border border-[#DDD5C4] rounded-xl shadow-lg w-32 z-50">
                      <button
                        onClick={() => router.push(`/pins/${id}/edit`)}
                        className="w-full text-left px-4 py-3 text-sm text-[#2C2416] hover:bg-[#EDE8DC] rounded-t-xl"
                      >
                        編集
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-50 rounded-b-xl"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {pin.description && (
              <p className="text-sm text-[#7A6E5F] mb-2">{pin.description}</p>
            )}
            <p
              className="text-xs text-[#AFA495] mb-6 cursor-pointer hover:underline"
              onClick={() => router.push(`/users/${pin.userId}`)}
            >
              @{pin.user?.name}
            </p>

            {/* コメント一覧 */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              <h2 className="text-xs text-[#AFA495] tracking-widest uppercase mb-3">
                コメント
              </h2>
              {comments.length === 0 ? (
                <p className="text-[#AFA495] text-sm">
                  まだコメントがありません
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-[#EDE8DC] rounded-xl p-3"
                    onContextMenu={(e) => {
                      if (session?.user?.id !== comment.user.id) return;
                      e.preventDefault();
                      setCommentContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        commentId: comment.id,
                        content: comment.content,
                      });
                    }}
                  >
                    <p
                      className="text-xs font-medium text-[#2C2416] cursor-pointer hover:underline mb-1"
                      onClick={() => router.push(`/users/${comment.user.id}`)}
                    >
                      @{comment.user?.name}
                    </p>
                    {editingComment?.id === comment.id ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          className="flex-1 border border-[#DDD5C4] rounded-full px-3 py-1 text-sm bg-[#F5F0E8] focus:outline-none"
                          value={editingComment.content}
                          onChange={(e) =>
                            setEditingComment({
                              ...editingComment,
                              content: e.target.value,
                            })
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            handleCommentEdit(
                              comment.id,
                              editingComment.content,
                            )
                          }
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            handleCommentEdit(
                              comment.id,
                              editingComment.content,
                            )
                          }
                          className="text-xs bg-[#2C2416] text-white px-3 py-1 rounded-full"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingComment(null)}
                          className="text-xs text-[#AFA495]"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-[#7A6E5F]">
                        {renderComment(comment.content)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* コメント入力 */}
            {session ? (
              <div className="relative">
                {showMentions && mentionUsers.length > 0 && (
                  <div className="absolute bottom-12 left-0 right-0 bg-white border border-[#DDD5C4] rounded-xl shadow-lg z-10">
                    {mentionUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleMentionSelect(user)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#EDE8DC] cursor-pointer"
                      >
                        <div className="h-7 w-7 rounded-full bg-[#2C2416] flex items-center justify-center text-white text-xs font-bold">
                          {user.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <p className="text-sm text-[#2C2416]">@{user.name}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="コメントを追加..."
                    className="flex-1 border border-[#DDD5C4] rounded-full px-4 py-2 text-sm bg-[#EDE8DC] focus:outline-none text-[#2C2416] placeholder:text-[#AFA495]"
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    className="bg-[#2C2416] text-[#F5F0E8] rounded-full px-4 py-2 text-sm font-medium hover:bg-[#483C2A] transition-colors"
                  >
                    送信
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#AFA495]">
                コメントするにはログインしてください
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
