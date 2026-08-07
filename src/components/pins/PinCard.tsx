// src/components/pins/PinCard.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PinCardProps {
  imageUrl: string;
  title: string;
  username: string;
  height: number;
  category?: string;
  tags?: string; // ← 追加
  onClick?: () => void;
  pinId: string;
  isOwner?: boolean;
  userId?: string;
}

export function PinCard({
  imageUrl,
  title,
  username,
  height,
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
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isOwner) {
      fetch(`/api/likes?pinId=${pinId}`)
        .then((res) => res.json())
        .then((data) => setLikeCount(data.count));
    }
  }, [pinId, isOwner]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.id) return;

    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId, userId: session.user.id }),
    });
    const data = await res.json();
    setLiked(data.liked);

    if (isOwner) {
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    }
  };

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-lg shadow-sm"
      style={{ height: `${height}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/pins/${pinId}`)}
    >
      <div className="relative w-full h-full">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-200 ease-in-out"
          style={{
            transform: isHovered ? "scale(1.05)" : "scale(1)",
            filter: isHovered ? "brightness(0.9)" : "brightness(1)",
          }}
        />

        {isHovered && (
          <>
            {/* 右上：保存ボタン */}
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full font-medium text-sm shadow-md"
              >
                保存
              </Button>
            </div>

            {/* 左上：シェアと詳細 */}
            <div className="absolute top-2 left-2 z-10 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-[#F7F5F3]/90 hover:bg-white shadow-sm"
              >
                <Share2 className="w-4 h-4 text-gray-800" />
              </Button>

              {/* 3点メニュー（自分の投稿のみ） */}
              {isOwner && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-[#F7F5F3]/90 hover:bg-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(!menuOpen);
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-800" />
                  </Button>

                  {menuOpen && (
                    <div
                      className="absolute left-0 top-9 bg-white border border-[#E8E4E0] rounded-xl shadow-lg w-32 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/pins/${pinId}/edit`);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-[#1A1814] hover:bg-[#F7F5F3] rounded-t-xl"
                      >
                        編集
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("削除しますか？")) return;
                          await fetch(`/api/pins/${pinId}`, {
                            method: "DELETE",
                          });
                          window.location.reload();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-b-xl"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 自分の投稿でない場合は通常の3点ボタン */}
              {!isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full bg-[#F7F5F3]/90 hover:bg-white shadow-sm"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-800" />
                </Button>
              )}
            </div>

            {/* 右下：コメントといいね */}
            <div className="absolute bottom-2 right-2 z-10 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-[#F7F5F3]/90 hover:bg-white shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/pins/${pinId}`);
                }}
              >
                <MessageCircle className="w-4 h-4 text-gray-800" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-[#F7F5F3]/90 hover:bg-white shadow-sm"
                onClick={handleLike}
              >
                <Heart
                  className={`w-4 h-4 ${liked ? "text-red-500 fill-red-500" : "text-gray-800"}`}
                />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-[#F7F5F3]/90 backdrop-blur-sm">
        <h3 className="font-semibold text-sm line-clamp-1 text-gray-900">
          {title}
        </h3>
        <p
          className="text-xs text-gray-700 font-medium cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            if (userId) router.push(`/users/${userId}`);
          }}
        >
          @{username}
        </p>
        {isOwner && likeCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">❤️ {likeCount}</p>
        )}
      </div>

      {/* タグ表示 */}
      {tags && (
        <div className="flex gap-1 flex-wrap mt-1">
          {tags
            .split(",")
            .filter(Boolean)
            .map((tag) => (
              <span
                key={tag}
                className="text-xs text-[#A39E99]"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: タグクリックでカテゴリ別ページへ
                }}
              >
                #{tag.trim()}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

interface MemoryCardProps {
  pinId: string
  imageUrl: string
  title: string
  username: string
  userId: string
  category?: string
  tags?: string
  isOwner?: boolean
  darkMode?: boolean
}

export function MemoryCard({
  pinId,
  imageUrl,
  title,
  username,
  userId,
  category,
  tags,
  isOwner = false,
  darkMode = false,
}: MemoryCardProps) {
  const router = useRouter()
  

  return (
    <div
      className="cursor-pointer"
      style={{ width: 160 }}
      onClick={() => router.push(`/pins/${pinId}`)}
    >
      {/* ポラロイド風 */}
      <div
        className="shadow-lg"
        style={{
          background: darkMode ? "#2C2416" : "#FFFFFF",
          padding: "8px 8px 28px",
        }}
      >
        <div style={{ width: "100%", aspectRatio: "1", overflow: "hidden", background: "#EDE8DC" }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
        {title && (
          <p style={{
            fontSize: 10,
            color: darkMode ? "#C8B89A" : "#7A6E5F",
            textAlign: "center",
            marginTop: 6,
            fontFamily: "Georgia, serif",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}>
            {title}
          </p>
        )}
      </div>
    </div>
  )
}