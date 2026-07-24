// src/components/pins/PinCard.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PinCardProps {
  imageUrl: string;
  title: string;
  username: string;
  /** @deprecated height is no longer used — aspect ratio is driven by the image */
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
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/likes?pinId=${pinId}`)
      .then((res) => res.json())
      .then((data) => setLikeCount(data.count ?? 0));
  }, [pinId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user?.id) return;

    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId, userId: session.user.id }),
    });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
  };

  const tagList = (tags ?? category ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-xl shadow-sm bg-[var(--surface)] group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Entire card is a link for accessibility */}
      <Link
        href={`/pins/${pinId}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-xl"
        aria-label={title}
      >
        {/* Image — natural aspect ratio */}
        <div className="relative w-full overflow-hidden bg-[var(--border)]">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={title}
            width={400}
            height={300}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="w-full h-auto object-cover transition-transform duration-300 ease-out"
            style={{
              transform: isHovered ? "scale(1.04)" : "scale(1)",
              filter: isHovered ? "brightness(0.88)" : "brightness(1)",
              display: "block",
            }}
          />
        </div>

        {/* Card footer */}
        <div className="p-3">
          {title && (
            <h3 className="font-semibold text-sm line-clamp-2 text-[var(--text-primary)] leading-snug mb-1">
              {title}
            </h3>
          )}
          <p
            className="text-xs text-[var(--text-secondary)] font-medium hover:underline inline-block"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (userId) router.push(`/users/${userId}`);
            }}
          >
            @{username}
          </p>

          {/* Tags — inside card, below username */}
          {tagList.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {tagList.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-[var(--accent)] bg-[var(--accent-light)] px-1.5 py-0.5 rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Like count */}
          {likeCount > 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-0.5">
              <Heart className="w-3 h-3 inline" />
              {likeCount}
            </p>
          )}
        </div>
      </Link>

      {/* Hover overlay actions */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none rounded-xl">
          {/* Save button */}
          <div className="absolute top-2 right-2 pointer-events-auto">
            <button
              className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full text-xs font-semibold shadow transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              aria-label="保存"
            >
              保存
            </button>
          </div>

          {/* Top-left actions */}
          <div className="absolute top-2 left-2 flex gap-1 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
              aria-label="シェア"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Share2 className="w-4 h-4 text-[var(--text-primary)]" />
            </Button>

            {isOwner && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
                  aria-label="メニュー"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 text-[var(--text-primary)]" />
                </Button>

                {menuOpen && (
                  <div
                    className="absolute left-0 top-9 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-32 z-50"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/pins/${pinId}/edit`);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--background)] rounded-t-xl"
                    >
                      編集
                    </button>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!confirm("削除しますか？")) return;
                        await fetch(`/api/pins/${pinId}`, { method: "DELETE" });
                        router.refresh();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
                aria-label="その他"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MoreHorizontal className="w-4 h-4 text-[var(--text-primary)]" />
              </Button>
            )}
          </div>

          {/* Bottom-right actions */}
          <div className="absolute bottom-14 right-2 flex gap-1 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
              aria-label="コメント"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/pins/${pinId}`);
              }}
            >
              <MessageCircle className="w-4 h-4 text-[var(--text-primary)]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
              aria-label="いいね"
              onClick={handleLike}
            >
              <Heart
                className={`w-4 h-4 ${liked ? "text-red-500 fill-red-500" : "text-[var(--text-primary)]"}`}
              />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
