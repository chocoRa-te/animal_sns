"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Play } from "lucide-react";

interface Pin {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  type: string;
  category: string;
  createdAt: string;
}

export default function CreateAlbumPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPins, setSelectedPins] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("すべて");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/settings?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setIsPublic(data?.defaultPostVisibility ?? true));

    fetch(`/api/pins?viewerId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const myPins = data.filter(
          (pin: any) => pin.userId === session.user.id,
        );
        setPins(myPins);
        // タグ一覧
        const tags = Array.from(
          new Set(
            myPins.flatMap((pin: any) =>
              pin.category
                ? pin.category
                    .split(",")
                    .map((t: string) => t.trim())
                    .filter(Boolean)
                : [],
            ),
          ),
        ) as string[];
        setAllTags(tags);
      });
  }, [session]);

  const filteredPins = pins.filter((pin) => {
    if (filter === "すべて") return true;
    return pin.category
      ?.split(",")
      .map((t) => t.trim())
      .includes(filter);
  });

  const togglePin = (pinId: string) => {
    setSelectedPins((prev) =>
      prev.includes(pinId)
        ? prev.filter((id) => id !== pinId)
        : [...prev, pinId],
    );
  };

  const handleCreate = async () => {
    if (!title.trim() || !session?.user?.id) return;
    setLoading(true);
    await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        userId: session.user.id,
        pinIds: selectedPins,
        isPublic,
      }),
    });
    router.back();
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#DDD5C4] bg-[#F5F0E8]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-[#AFA495]"
        >
          <ChevronLeft className="h-4 w-4" />
          キャンセル
        </button>
        <h1 className="text-sm font-medium text-[#2C2416]">新しいアルバム</h1>
        <button
          onClick={handleCreate}
          disabled={loading || !title.trim()}
          className="text-sm font-medium text-[#2C2416] disabled:text-[#AFA495]"
        >
          {loading ? "作成中..." : "作成"}
        </button>
      </div>

      {/* 公開設定 */}
      <div className="px-4 pt-4">
        <button
          onClick={() => setIsPublic(!isPublic)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-[#DDD5C4] text-[#7A6E5F] hover:bg-[#EDE8DC] transition-colors"
        >
          {isPublic ? "🌐 公開" : "🔒 非公開"}
        </button>
      </div>

      <div className="px-4 py-4">
        
        {/* アルバム名 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="アルバム名"
            className="w-full bg-[#EDE8DC] border border-[#DDD5C4] rounded-xl px-4 py-3 text-sm text-[#2C2416] placeholder:text-[#C4BAB0] focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* タグフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {["すべて", ...allTags].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-full transition-colors ${
                filter === tag
                  ? "bg-[#2C2416] text-[#F5F0E8]"
                  : "bg-[#EDE8DC] text-[#7A6E5F] border border-[#DDD5C4]"
              }`}
            >
              {tag === "すべて" ? "すべて" : `#${tag}`}
            </button>
          ))}
        </div>

        {/* 選択数 */}
        <p className="text-xs text-[#AFA495] mb-3">
          {selectedPins.length}枚選択中
        </p>

        {/* 写真グリッド */}
        <div className="grid grid-cols-3 gap-0.5">
          {filteredPins.map((pin) => (
            <div
              key={pin.id}
              className="relative aspect-square bg-[#EDE8DC] cursor-pointer overflow-hidden"
              onClick={() => togglePin(pin.id)}
            >
              {pin.imageUrl ? (
                <img
                  src={pin.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : pin.videoUrl ? (
                <video
                  src={pin.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : null}

              {pin.type === "video" && (
                <div className="absolute top-1 right-1">
                  <Play
                    className="h-3.5 w-3.5 text-white drop-shadow"
                    fill="white"
                  />
                </div>
              )}

              {/* 選択チェック */}
              {selectedPins.includes(pin.id) && (
                <div className="absolute inset-0 bg-[#2C2416]/40 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-[#2C2416] flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#F5F0E8]" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredPins.length === 0 && (
          <p className="text-center text-[#AFA495] text-sm mt-8">
            写真がありません
          </p>
        )}
      </div>
    </div>
  );
}
