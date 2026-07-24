"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import Image from "next/image";
import { MoreHorizontal, ChevronLeft } from "lucide-react"

// ピンの型定義
interface Pin {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  userId: string;
  user: { name: string };
}

// コメントの型定義
interface Comment {
  id: string;
  content: string;
  user: { id: string; name: string };
  createdAt: string;
}

// メンション候補ユーザーの型定義
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
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]); // メンション候補
  const [showMentions, setShowMentions] = useState(false); // メンション候補の表示フラグ
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

  // ページ読み込み時にピンとコメントを取得
  useEffect(() => {
    fetch(`/api/pins/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPin(data.pin);
        setComments(data.comments);
      });
  }, [id]);

  // メニューの外をクリックしたら閉じる
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

  // @を入力したらユーザー候補を表示
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

    // ユーザー検索API呼び出し
    const res = await fetch(`/api/users?query=${query}`);
    const users = await res.json();
    setMentionUsers(users);
    setShowMentions(true);
  };

  // メンションを選択したらコメント欄に挿入
  const handleMentionSelect = (user: MentionUser) => {
    const atIndex = newComment.lastIndexOf("@");
    const before = newComment.slice(0, atIndex);
    setNewComment(`${before}@${user.name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  // コメント送信
  const handleComment = async () => {
    if (!newComment.trim() || !session?.user?.id) return;

    const res = await fetch(`/api/pins/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newComment,
        userId: session.user.id,
      }),
    });

    const comment = await res.json();
    setComments((prev) => [...prev, comment]);
    setNewComment("");
    setShowMentions(false);
  };

  // コメント削除
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

  // コメント編集
  const handleCommentEdit = async (commentId: string, content: string) => {
    if (!session?.user?.id) return;
    if (!content.trim()) return; // 空文字は保存しない

    const res = await fetch(`/api/pins/${id}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, userId: session.user.id, content }),
    });

    const updated = await res.json();
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    setEditingComment(null);
  };

  // ピン削除（自分の投稿のみ）
  const handleDelete = async () => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/pins/${id}`, { method: "DELETE" });
    router.push("/");
  };

  // コメント内の@メンションをクリッカブルリンクに変換
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
              // ユーザー名でユーザーを検索してプロフィールへ
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

  // ピンが読み込まれるまでナビバーだけ表示
  if (!pin)
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="skeleton h-8 w-16 rounded-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="skeleton rounded-2xl" style={{ height: "420px" }} />
            <div className="space-y-4">
              <div className="skeleton h-7 rounded-full w-2/3" />
              <div className="skeleton h-4 rounded-full w-1/4" />
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      {/* コメントの右クリックメニュー */}
      {commentContextMenu && (
        <div
          className="fixed bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-40 z-50"
          style={
            commentContextMenu.x === 0 && commentContextMenu.y === 0
              ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
              : { top: commentContextMenu.y, left: commentContextMenu.x }
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* 編集ボタン */}
          <button
            onClick={() => {
              setEditingComment({
                id: commentContextMenu.commentId,
                content: commentContextMenu.content,
              });
              setCommentContextMenu(null);
            }}
            className="w-full text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-t-xl"
          >
            編集
          </button>
          {/* 削除ボタン */}
          <button
            onClick={() => {
              handleCommentDelete(commentContextMenu.commentId);
              setCommentContextMenu(null);
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
          >
            削除
          </button>
        </div>
      )}
      {/* メニューの外をクリックしたら閉じる */}
      {commentContextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setCommentContextMenu(null)}
        />
      )}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
          aria-label="前のページに戻る"
        >
          <ChevronLeft className="h-4 w-4" />
          戻る
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 画像 */}
          <div className="relative rounded-xl overflow-hidden bg-[var(--border)]">
            <Image
              src={pin.imageUrl || "/placeholder.svg"}
              alt={pin.title || "投稿"}
              width={800}
              height={600}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="w-full h-auto object-contain"
              style={{ display: "block" }}
            />
          </div>

          {/* 詳細・コメント */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-[#1A1814]">
                {pin.title}
              </h1>

              {/* 自分の投稿だけ3点メニューを表示 */}
              {session?.user?.id === pin.userId && (
                <div className="relative" ref={pinMenuRef}>
                  <button
                    onClick={() => setPinMenuOpen(!pinMenuOpen)}
                    className="p-1 rounded-full hover:bg-[#E8E4E0] transition-colors"
                  >
                    <MoreHorizontal className="h-5 w-5 text-[#6B6560]" />
                  </button>
                  {pinMenuOpen && (
                    <div className="absolute right-0 top-8 bg-white border border-[#E8E4E0] rounded-xl shadow-lg w-32 z-50">
                      <button
                        onClick={() => router.push(`/pins/${id}/edit`)}
                        className="w-full text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-t-xl"
                      >
                        編集
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {pin.description && (
              <p className="text-sm text-[#6B6560] mb-2">{pin.description}</p>
            )}

            {/* 投稿者名（クリックでプロフィールへ） */}
            <p
              className="text-xs text-[#A39E99] mb-6 cursor-pointer hover:underline"
              onClick={() => router.push(`/users/${pin.userId}`)}
            >
              @{pin.user?.name}
            </p>

            {/* コメント一覧 */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              <h2 className="text-sm font-semibold text-[#1A1814]">コメント</h2>
              {comments.length === 0 ? (
                <p className="text-[#A39E99] text-sm">
                  まだコメントがありません
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)] group"
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
                    <div className="flex items-start justify-between gap-2">
                    {/* コメント投稿者（クリックでプロフィールへ） */}
                    <p
                      className="text-xs font-medium text-[var(--text-primary)] cursor-pointer hover:underline mb-1"
                      onClick={() => router.push(`/users/${comment.user.id}`)}
                    >
                      @{comment.user?.name}
                    </p>
                    {/* Touch-accessible actions for own comments */}
                    {session?.user?.id === comment.user.id && (
                      <button
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity flex-shrink-0"
                        aria-label="コメントのオプション"
                        onClick={() => setCommentContextMenu({
                          x: 0,
                          y: 0,
                          commentId: comment.id,
                          content: comment.content,
                        })}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    )}
                    </div>

                    {/* 編集中の場合は入力欄を表示 */}
                    {editingComment?.id === comment.id ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          className="flex-1 border border-[#E8E4E0] rounded-full px-3 py-1 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
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
                          className="text-xs bg-[#1A1814] text-white px-3 py-1 rounded-full"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingComment(null)}
                          className="text-xs text-[#A39E99]"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      // メンションをリンクに変換して表示
                      <p className="text-sm text-[#6B6560]">
                        {renderComment(comment.content)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* コメント入力（ログイン中のみ表示） */}
            {session ? (
              <div className="relative">
                {/* メンション候補リスト */}
                {showMentions && mentionUsers.length > 0 && (
                  <div className="absolute bottom-12 left-0 right-0 bg-white border border-[#E8E4E0] rounded-xl shadow-lg z-10">
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

                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="コメントを追加... (@でメンション)"
                    className="flex-1 border border-[#E8E4E0] rounded-full px-4 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
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
