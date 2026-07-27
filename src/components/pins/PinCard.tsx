"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PinCardProps {
  imageUrl: string;
  title: string;
  username: string;
  height?: number;           // legacy, unused
  category?: string;
  tags?: string;
  onClick?: () => void;
  pinId: string;
  isOwner?: boolean;
  userId?: string;
  darkMode?: boolean;        // when rendered on the dark today-zone
}

/* ─────────────────────────────────────────────────────
   MemoryCard — looks like a physical photo print.
   Used in the journal timeline (horizontal strip).
   Width is fixed at ~200px; height follows the image.
───────────────────────────────────────────────────── */
export function MemoryCard({
  imageUrl,
  title,
  username,
  category,
  tags,
  pinId,
  isOwner = false,
  userId,
  darkMode = false,
}: PinCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/likes?pinId=${pinId}`)
      .then((r) => r.json())
      .then((data) => {
        setLikeCount(data.count ?? 0);
        if (session?.user?.id && Array.isArray(data.likedBy)) {
          setLiked(data.likedBy.includes(session.user.id));
        }
      });
  }, [pinId, session?.user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) { setLikeAnimating(true); setTimeout(() => setLikeAnimating(false), 350); }
    await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId, userId: session.user.id }),
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/pins/${pinId}`, { method: "DELETE" });
    setConfirmDelete(false);
    router.refresh();
  };

  const tagList = (tags || category || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 2);

  return (
    <article
      className="photo-print select-none"
      style={{ width: 200 }}
      onClick={() => router.push(`/pins/${pinId}`)}
      aria-label={title || "思い出の写真"}
    >
      {/* ── Photo ── */}
      <div
        className="relative overflow-hidden bg-[#E8DFCF]"
        style={{ width: 188, minHeight: 120 }}
      >
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title || ""}
          width={400}
          height={500}
          className="w-full h-auto object-cover block"
          sizes="220px"
        />

        {/* Owner menu — appears on hover over the photo */}
        {isOwner && (
          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="操作メニュー"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setConfirmDelete(false); }}
              className="h-6 w-6 rounded-full bg-white/85 shadow flex items-center justify-center hover:bg-white transition-colors"
            >
              <MoreHorizontal className="h-3 w-3 text-[#1C1611]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 bg-white border border-[#DDD4C6] rounded-xl shadow-lg w-28 overflow-hidden animate-fade-up z-50">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/pins/${pinId}/edit`); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-[#1C1611] hover:bg-[#F2EBE0] transition-colors"
                >
                  <Pencil className="h-3 w-3 text-[#A89E93]" />
                  編集する
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    削除する
                  </button>
                ) : (
                  <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] text-[#6B6055] mb-2 leading-snug">削除しますか？</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleDelete}
                        className="flex-1 text-[10px] bg-red-500 text-white py-1 rounded-md font-semibold hover:bg-red-600"
                      >
                        削除
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                        className="flex-1 text-[10px] border border-[#DDD4C6] text-[#A89E93] py-1 rounded-md hover:bg-[#F2EBE0]"
                      >
                        戻る
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Caption (the white margin below the photo) ── */}
      <div className="pt-2 pb-0.5 px-0.5" style={{ width: 188 }}>
        {/* Handwritten-style title */}
        {title && (
          <p className="font-serif italic text-[12px] text-[#1C1611] leading-snug line-clamp-2 mb-1.5">
            {title}
          </p>
        )}

        {/* Author + heart — always visible */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); if (userId) router.push(`/users/${userId}`); }}
            aria-label={`${username}のページ`}
            className={`text-[10px] transition-colors truncate leading-tight ${darkMode ? "text-[#A89E93] hover:text-[#6B6055]" : "text-[#C8BEB3] hover:text-[#A89E93]"}`}
          >
            {username}
          </button>

          <button
            aria-label={liked ? "いいねを取り消す" : "いいねする"}
            onClick={handleLike}
            className="flex items-center gap-1 flex-shrink-0 group/heart"
          >
            <Heart
              className={`h-3 w-3 transition-all ${likeAnimating ? "animate-heart-pop" : ""} ${
                liked
                  ? "text-[#C4856A] fill-[#C4856A]"
                  : darkMode
                  ? "text-[#A89E93] group-hover/heart:text-[#C4856A]"
                  : "text-[#C8BEB3] group-hover/heart:text-[#C4856A]"
              }`}
              strokeWidth={liked ? 0 : 1.5}
            />
            {likeCount > 0 && (
              <span className={`text-[10px] tabular-nums leading-tight ${liked ? "text-[#C4856A]" : darkMode ? "text-[#A89E93]" : "text-[#C8BEB3]"}`}>
                {likeCount}
              </span>
            )}
          </button>
        </div>

        {/* Tags — like stickers on the back of a photo */}
        {tagList.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5" onClick={(e) => e.stopPropagation()}>
            {tagList.map((tag) => (
              <span
                key={tag}
                className={`text-[9px] px-1.5 py-0.5 rounded-sm ${darkMode ? "text-[#A89E93] bg-[#2C2416]" : "text-[#A89E93] bg-[#F2EBE0]"}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────
   PinCard — legacy alias used in profile/search pages.
   Renders as a wider grid card (masonry compatible).
───────────────────────────────────────────────────── */
export function PinCard(props: PinCardProps) {
  const { pinId, imageUrl, title, username, category, tags, isOwner = false, userId } = props;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/likes?pinId=${pinId}`)
      .then((r) => r.json())
      .then((data) => {
        setLikeCount(data.count ?? 0);
        if (session?.user?.id && Array.isArray(data.likedBy)) {
          setLiked(data.likedBy.includes(session.user.id));
        }
      });
  }, [pinId, session?.user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) { setLikeAnimating(true); setTimeout(() => setLikeAnimating(false), 350); }
    await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId, userId: session.user.id }),
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/pins/${pinId}`, { method: "DELETE" });
    setConfirmDelete(false);
    router.refresh();
  };

  const tagList = (tags || category || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3);

  return (
    <article
      className="group photo-print select-none w-full cursor-pointer"
      onClick={() => router.push(`/pins/${pinId}`)}
      aria-label={title || "思い出の写真"}
    >
      {/* Photo */}
      <div className="relative overflow-hidden bg-[#E8DFCF]">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title || ""}
          width={600}
          height={800}
          className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 50vw, 33vw"
        />

        {isOwner && (
          <div
            ref={menuRef}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="操作メニュー"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); setConfirmDelete(false); }}
              className="h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white"
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-[#1C1611]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-[#DDD4C6] rounded-xl shadow-lg w-32 overflow-hidden animate-fade-up z-50">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/pins/${pinId}/edit`); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-[#1C1611] hover:bg-[#F2EBE0]"
                >
                  <Pencil className="h-3 w-3 text-[#A89E93]" />
                  編集する
                </button>
                {!confirmDelete ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    削除する
                  </button>
                ) : (
                  <div className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] text-[#6B6055] mb-2 leading-snug">削除しますか？</p>
                    <div className="flex gap-1.5">
                      <button onClick={handleDelete} className="flex-1 text-[10px] bg-red-500 text-white py-1.5 rounded-lg font-semibold hover:bg-red-600">削除</button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} className="flex-1 text-[10px] border border-[#DDD4C6] text-[#A89E93] py-1.5 rounded-lg hover:bg-[#F2EBE0]">戻る</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="pt-2.5 pb-0.5 px-0.5">
        {title && (
          <h3 className="font-serif italic text-[13px] text-[#1C1611] leading-snug line-clamp-2 mb-1.5">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); if (userId) router.push(`/users/${userId}`); }}
            aria-label={`${username}のページ`}
            className="text-[11px] text-[#C8BEB3] hover:text-[#A89E93] transition-colors truncate"
          >
            {username}
          </button>
          <button aria-label={liked ? "いいねを取り消す" : "いいねする"} onClick={handleLike} className="flex items-center gap-1 flex-shrink-0 group/heart">
            <Heart
              className={`h-3.5 w-3.5 transition-all ${likeAnimating ? "animate-heart-pop" : ""} ${liked ? "text-[#C4856A] fill-[#C4856A]" : "text-[#C8BEB3] group-hover/heart:text-[#C4856A]"}`}
              strokeWidth={liked ? 0 : 1.5}
            />
            {likeCount > 0 && (
              <span className={`text-[11px] tabular-nums ${liked ? "text-[#C4856A]" : "text-[#C8BEB3]"}`}>{likeCount}</span>
            )}
          </button>
        </div>
        {tagList.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5" onClick={(e) => e.stopPropagation()}>
            {tagList.map((tag) => (
              <span key={tag} className="text-[10px] text-[#A89E93] bg-[#F2EBE0] px-1.5 py-0.5 rounded-sm">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
