// src/components/pins/PinCard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PinCardProps {
  imageUrl: string;
  title: string;
  username: string;
  /** @deprecated no longer used */
  height?: number;
  category?: string;
  tags?: string;
  onClick?: () => void;
  pinId: string;
  isOwner?: boolean;
  userId?: string;
}

export function PinCard({
  imageUrl,
  title,
  username,
  category,
  tags,
  pinId,
  isOwner = false,
  userId,
}: PinCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch like state
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

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowDeleteConfirm(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (newLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 300);
    }
    await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId, userId: session.user.id }),
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/pins/${pinId}`, { method: "DELETE" });
    setShowDeleteConfirm(false);
    router.refresh();
  };

  const tagList = (tags || category || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    /*
     * The outer wrapper is a "photo-frame" — white padding top/sides + extra
     * bottom space to mimic a printed Polaroid/fujifilm instax print.
     * The slight shadow + 1px border reads as a physical object.
     */
    <article
      className="group photo-frame rounded-sm cursor-pointer select-none relative"
      onClick={() => router.push(`/pins/${pinId}`)}
      role="article"
      aria-label={title}
    >
      {/* ── Photograph ─────────────────────────── */}
      <div className="relative w-full overflow-hidden rounded-[1px] bg-[#EDE8DC]">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          width={600}
          height={800}
          className="w-full h-auto object-cover block transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />

        {/* Warm vignette on hover — gives depth */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(44,36,22,0.22) 100%)" }}
        />

        {/* Owner action menu — top right of photo */}
        {isOwner && (
          <div
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="写真の操作メニューを開く"
              onClick={() => { setMenuOpen(!menuOpen); setShowDeleteConfirm(false); }}
              className="h-7 w-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-[#2C2416]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 bg-[#FDFAF4] border border-[#DDD5C4] rounded-xl shadow-lg w-32 overflow-hidden animate-fade-up z-50">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/pins/${pinId}/edit`); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-[#2C2416] hover:bg-[#EDE8DC] transition-colors"
                >
                  <Pencil className="h-3 w-3 text-[#7A6E5F]" />
                  編集する
                </button>
                {!showDeleteConfirm ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    削除する
                  </button>
                ) : (
                  <div className="px-3 py-2.5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] text-[#7A6E5F] mb-2 leading-snug">
                      この思い出を削除しますか？
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleDelete}
                        className="flex-1 text-[10px] bg-red-500 text-white py-1.5 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                      >
                        削除
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                        className="flex-1 text-[10px] border border-[#DDD5C4] text-[#7A6E5F] py-1.5 rounded-lg hover:bg-[#EDE8DC] transition-colors"
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

      {/* ── Caption area — the "handwritten" space below the photo ── */}
      <div className="pt-2.5 pb-0.5 px-0.5">
        {/* Title in serif — like handwriting under a photo */}
        {title && (
          <h3 className="font-serif text-sm leading-snug text-[#2C2416] line-clamp-2 mb-1.5 italic">
            {title}
          </h3>
        )}

        {/* Author + heart row */}
        <div className="flex items-center justify-between gap-1">
          <button
            aria-label={`${username}のページへ`}
            className="text-[11px] text-[#AFA495] hover:text-[#7A6E5F] transition-colors truncate"
            onClick={(e) => {
              e.stopPropagation();
              if (userId) router.push(`/users/${userId}`);
            }}
          >
            {username}
          </button>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Comment hint */}
            <button
              aria-label="コメントを見る"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/pins/${pinId}`);
              }}
              className="text-[#BFB39E] hover:text-[#7A6E5F] transition-colors opacity-0 group-hover:opacity-100"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>

            {/* Heart — always accessible */}
            <button
              aria-label={liked ? "いいねを取り消す" : "いいねする"}
              onClick={handleLike}
              className="flex items-center gap-1 group/heart"
            >
              <Heart
                className={`h-3.5 w-3.5 transition-all ${
                  likeAnimating ? "animate-heart-pop" : ""
                } ${
                  liked
                    ? "text-[#C9A96E] fill-[#C9A96E]"
                    : "text-[#BFB39E] group-hover/heart:text-[#C9A96E]"
                }`}
                strokeWidth={liked ? 0 : 1.5}
              />
              {likeCount > 0 && (
                <span className={`text-[11px] tabular-nums ${liked ? "text-[#C9A96E]" : "text-[#BFB39E]"}`}>
                  {likeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tags — tiny, like stickers on the back of a photo */}
        {tagList.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5" onClick={(e) => e.stopPropagation()}>
            {tagList.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-[#AFA495] bg-[#EDE8DC] px-1.5 py-0.5 rounded-sm leading-tight"
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
