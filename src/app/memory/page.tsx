"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Play, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Pin {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  category: string;
  type: string;
  createdAt: string;
  userId: string;
}

export default function MemoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all");
  const [selectedYear, setSelectedYear] = useState("すべて");
  const [selectedMonth, setSelectedMonth] = useState("すべて");
  const [selectedTag, setSelectedTag] = useState("すべて");
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const myPins = data
          .filter((pin: any) => pin.userId === session.user.id)
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        setPins(myPins);
        setLoading(false);
      });
  }, [session]);

  const allTags = [
    "すべて",
    ...Array.from(
      new Set(
        pins.flatMap((pin) =>
          pin.category
            ? pin.category
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        ),
      ),
    ),
  ];

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

  const filteredPins = pins.filter((pin) => {
    const pinYear = new Date(pin.createdAt).getFullYear().toString();
    const pinMonth = (new Date(pin.createdAt).getMonth() + 1).toString();
    const pinDate = new Date(pin.createdAt).toISOString().slice(0, 10);
    const tags = pin.category
      ? pin.category.split(",").map((t) => t.trim())
      : [];
    const typeMatch =
      filter === "all" ||
      (filter === "photo" && pin.type !== "video") ||
      (filter === "video" && pin.type === "video");
    const yearMatch = selectedYear === "すべて" || pinYear === selectedYear;
    const monthMatch = selectedMonth === "すべて" || pinMonth === selectedMonth;
    const tagMatch = selectedTag === "すべて" || tags.includes(selectedTag);
    const dateMatch =
      !dateParam ||
      new Date(pin.createdAt).toISOString().slice(0, 10) === dateParam;
    return typeMatch && yearMatch && monthMatch && tagMatch && dateMatch;
  });

  const activeFilterCount = [
    filter !== "all",
    selectedYear !== "すべて",
    selectedMonth !== "すべて",
    selectedTag !== "すべて",
  ].filter(Boolean).length;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <p className="text-[#AFA495] text-sm">ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      <div className="px-4 pt-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-sm text-[#AFA495] tracking-wide">記憶</h1>
            <p className="text-xs text-[#C4BAB0] mt-0.5">
              {filteredPins.length}件
            </p>
          </div>

          {/* フィルター */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDE8DC] rounded-full text-xs text-[#7A6E5F]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              フィルター
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-[#2C2416] text-white text-[9px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilter && (
              <div className="absolute right-0 top-9 bg-white border border-[#EDE8DC] rounded-2xl shadow-lg w-64 z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#2C2416]">
                    フィルター
                  </p>
                  <button
                    onClick={() => {
                      setFilter("all");
                      setSelectedYear("すべて");
                      setSelectedMonth("すべて");
                      setSelectedTag("すべて");
                    }}
                    className="text-xs text-[#AFA495]"
                  >
                    リセット
                  </button>
                </div>

                {/* 種類 */}
                <p className="text-[10px] text-[#AFA495] mb-2">種類</p>
                <div className="flex gap-2 mb-3">
                  {[
                    { label: "すべて", value: "all" },
                    { label: "📷", value: "photo" },
                    { label: "🎥", value: "video" },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() =>
                        setFilter(f.value as "all" | "photo" | "video")
                      }
                      className={`px-3 py-1 text-xs rounded-full ${
                        filter === f.value
                          ? "bg-[#2C2416] text-white"
                          : "bg-[#EDE8DC] text-[#7A6E5F]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* タグ */}
                <p className="text-[10px] text-[#AFA495] mb-2">タグ</p>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 text-xs rounded-full ${
                        selectedTag === tag
                          ? "bg-[#2C2416] text-white"
                          : "bg-[#EDE8DC] text-[#7A6E5F]"
                      }`}
                    >
                      {tag === "すべて" ? "すべて" : `#${tag}`}
                    </button>
                  ))}
                </div>

                {/* 年 */}
                <p className="text-[10px] text-[#AFA495] mb-2">年</p>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setSelectedMonth("すべて");
                  }}
                  className="w-full bg-[#EDE8DC] border-none rounded-lg px-3 py-1.5 text-xs text-[#2C2416] focus:outline-none mb-3"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === "すべて" ? "すべての年" : `${y}年`}
                    </option>
                  ))}
                </select>

                {/* 月 */}
                {selectedYear !== "すべて" && (
                  <>
                    <p className="text-[10px] text-[#AFA495] mb-2">月</p>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full bg-[#EDE8DC] border-none rounded-lg px-3 py-1.5 text-xs text-[#2C2416] focus:outline-none"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m === "すべて" ? "すべての月" : `${m}月`}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* グリッド */}
        {loading ? (
          <p className="text-center text-[#AFA495] text-sm mt-12">
            読み込み中...
          </p>
        ) : filteredPins.length === 0 ? (
          <div className="text-center mt-16">
            <p className="text-2xl mb-3">🐾</p>
            <p className="text-sm text-[#AFA495]">まだ記憶がありません</p>
            <p className="text-xs text-[#C4BAB0] mt-1">
              今日の思い出を残しましょう
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                className="relative aspect-square bg-[#EDE8DC] cursor-pointer overflow-hidden"
                onClick={() =>
                  pin.type === "video"
                    ? router.push("/video")
                    : router.push(`/pins/${pin.id}`)
                }
              >
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
                {pin.type === "video" && (
                  <div className="absolute top-1 right-1">
                    <Play
                      className="h-3.5 w-3.5 text-white drop-shadow"
                      fill="white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
