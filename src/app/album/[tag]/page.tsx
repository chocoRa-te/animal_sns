"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Play, ChevronDown } from "lucide-react";

interface Pin {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  category: string;
  type: string;
  createdAt: string;
}

export default function AlbumDetailPage() {
  const { tag } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all");
  const [selectedYear, setSelectedYear] = useState<string>("すべて");
  const [selectedMonth, setSelectedMonth] = useState<string>("すべて");
  const [loading, setLoading] = useState(true);

  const decodedTag = decodeURIComponent(tag as string);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const myPins = data
          .filter((pin: any) => pin.userId === session.user.id)
          .filter((pin: any) => {
            if (!pin.category) return false;
            const tags = pin.category.split(",").map((t: string) => t.trim());
            return tags.includes(decodedTag);
          })
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

        setPins(myPins);
        setLoading(false);
      });
  }, [session, decodedTag]);

  // 年月一覧を作成
  const years = [
    "すべて",
    ...Array.from(
      new Set(
        pins.map((pin) => new Date(pin.createdAt).getFullYear().toString()),
      ),
    )
      .sort()
      .reverse(),
  ];
  const months =
    selectedYear === "すべて"
      ? ["すべて"]
      : [
          "すべて",
          ...Array.from(
            new Set(
              pins
                .filter(
                  (pin) =>
                    new Date(pin.createdAt).getFullYear().toString() ===
                    selectedYear,
                )
                .map((pin) =>
                  (new Date(pin.createdAt).getMonth() + 1).toString(),
                ),
            ),
          ).sort((a, b) => Number(a) - Number(b)),
        ];

  // フィルター処理
  const filteredPins = pins.filter((pin) => {
    const pinYear = new Date(pin.createdAt).getFullYear().toString();
    const pinMonth = (new Date(pin.createdAt).getMonth() + 1).toString();
    const typeMatch =
      filter === "all" ||
      (filter === "photo" && pin.type !== "video") ||
      (filter === "video" && pin.type === "video");
    const yearMatch = selectedYear === "すべて" || pinYear === selectedYear;
    const monthMatch = selectedMonth === "すべて" || pinMonth === selectedMonth;
    return typeMatch && yearMatch && monthMatch;
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-white">ログインしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-gray-300"
          >
            ←
          </button>
          <h1 className="text-white text-lg font-semibold">#{decodedTag}</h1>
          <span className="text-gray-400 text-sm">{filteredPins.length}件</span>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {/* タイプフィルター */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "photo" | "video")
              }
              className="appearance-none bg-[#2C2C2E] text-white text-xs px-3 py-1.5 pr-7 rounded-full focus:outline-none cursor-pointer"
            >
              <option value="all">すべて</option>
              <option value="photo">📷 写真</option>
              <option value="video">🎥 動画</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          {/* 年フィルター */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth("すべて");
              }}
              className="appearance-none bg-[#2C2C2E] text-white text-xs px-3 py-1.5 pr-7 rounded-full focus:outline-none cursor-pointer"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year === "すべて" ? "すべての年" : `${year}年`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          {/* 月フィルター */}
          {selectedYear !== "すべて" && (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-[#2C2C2E] text-white text-xs px-3 py-1.5 pr-7 rounded-full focus:outline-none cursor-pointer"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month === "すべて" ? "すべての月" : `${month}月`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* グリッド（iPhoneの写真アプリ風） */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm">読み込み中...</p>
        ) : filteredPins.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">
            該当するコンテンツがありません
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                className="relative aspect-square bg-[#1C1C1E] cursor-pointer overflow-hidden"
                onClick={() => {
                  if (pin.type === "video") {
                    router.push("/video");
                  } else {
                    router.push(`/pins/${pin.id}`);
                  }
                }}
              >
                {/* サムネイル */}
                {pin.imageUrl ? (
                  <img
                    src={pin.imageUrl}
                    alt={pin.title}
                    className="w-full h-full object-cover"
                  />
                ) : pin.videoUrl ? (
                  <video
                    src={pin.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : null}

                {/* 動画マーク */}
                {pin.type === "video" && (
                  <div className="absolute top-1 right-1">
                    <Play
                      className="h-4 w-4 text-white drop-shadow-lg"
                      fill="white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
