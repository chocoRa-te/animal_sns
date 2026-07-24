// src/components/pins/PinCard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Heart, MessageCircle, MoreHorizontal, Share2, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PinCardProps {
  imageUrl: string;
  title: string;
  username: string;
  /** @deprecated height is no longer used — image drives its own height */
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
  onClick,
  pinId,
  isOwner = false,
  userId,
}: PinCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  // Always fetch like count and own liked status
  useEffect(() => {
    fetch(`/api/likes?pinId=${pinId}`)
      .then((res) => res.json())
      .then((data) => {
        setLikeCount(data.count ?? 0);
        if (session?.user?.id && data.likedBy) {
          setLiked(data.likedBy.includes(session.user.id));
        }
      });
  }, [pinId, session?.user?.id]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
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
    <div
      className="group relative w-full rounded-2xl overflow-hidden bg-[#FFFFFF] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false); }}
      onClick={() => router.push(`/pins/${pinId}`)}
    >
      {/* ── Image ── */}
      <div className="relative w-full overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          width={600}
          height={800}
          className="w-full h-auto object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Hover overlay — desktop action buttons */}
        {isHovered && (
          <div className="absolute inset-0 bg-[#1A1814]/10 animate-fade-in" />
        )}

        {/* Desktop: top-left actions on hover */}
        {isHovered && (
          <div
            className="absolute top-2 left-2 flex gap-1 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="シェア"
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
            >
              <Share2 className="w-4 h-4 text-[#1A1814]" />
            </button>

            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  aria-label="メニューを開く"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <MoreHorizontal className="w-4 h-4 text-[#1A1814]" />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 top-10 bg-white border border-[#E8E4E0] rounded-2xl shadow-lg w-36 z-50 overflow-hidden animate-fade-in">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/pins/${pinId}/edit`);
                      }}
                      className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3]"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#6B6560]" />
                      編集
                    </button>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        削除
                      </button>
                    ) : (
                      <div
                        className="px-3 py-2 animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-xs text-[#6B6560] mb-2 leading-snug">
                          この思い出を削除しますか？
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={handleDelete}
                            className="flex-1 text-xs bg-red-500 text-white py-1.5 rounded-lg font-medium hover:bg-red-600 transition-colors"
                          >
                            削除
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(false);
                            }}
                            className="flex-1 text-xs border border-[#E8E4E0] text-[#6B6560] py-1.5 rounded-lg hover:bg-[#F7F5F3] transition-colors"
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
        )}

        {/* Desktop: comment button on hover */}
        {isHovered && (
          <div
            className="absolute bottom-2 right-2 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="コメントを見る"
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/pins/${pinId}`);
              }}
            >
              <MessageCircle className="w-4 h-4 text-[#1A1814]" />
            </button>
          </div>
        )}
      </div>

      {/* ── Info strip — always visible, memory-book caption style ── */}
      <div className="px-3 pt-2.5 pb-3">
        {/* Title */}
        <h3 className="font-medium text-sm leading-snug line-clamp-2 text-[#1A1814] mb-1">
          {title}
        </h3>

        {/* Username + like button row */}
        <div className="flex items-center justify-between gap-2">
          <button
            aria-label={`${username}のプロフィールへ`}
            className="text-xs text-[#A39E99] hover:text-[#6B6560] transition-colors truncate"
            onClick={(e) => {
              e.stopPropagation();
              if (userId) router.push(`/users/${userId}`);
            }}
          >
            @{username}
          </button>

          {/* Heart — always visible for mobile access */}
          <button
            aria-label={liked ? "いいねを取り消す" : "いいね"}
            onClick={handleLike}
            className="flex items-center gap-1 shrink-0 group/heart"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                likeAnimating ? "animate-heart-pop" : ""
              } ${
                liked
                  ? "text-[#C9A96E] fill-[#C9A96E]"
                  : "text-[#A39E99] group-hover/heart:text-[#C9A96E]"
              }`}
            />
            {likeCount > 0 && (
              <span className={`text-xs tabular-nums ${liked ? "text-[#C9A96E]" : "text-[#A39E99]"}`}>
                {likeCount}
              </span>
            )}
          </button>
        </div>

        {/* Tags */}
        {tagList.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5">
            {tagList.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-[#A39E99] bg-[#F7F5F3] px-1.5 py-0.5 rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
