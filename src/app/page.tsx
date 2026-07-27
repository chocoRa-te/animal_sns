"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PinCard } from "@/components/pins/PinCard";
import { useSession } from "next-auth/react";
import Masonry from "react-masonry-css";
import { Camera, PawPrint } from "lucide-react";
import Link from "next/link";

interface Pin {
  id: string;
  imageUrl: string;
  title: string;
  username: string;
  category: string;
  userId: string;
  tags?: string;
  createdAt?: string;
}

const PET_TAGS = [
  { label: "すべて", value: "すべて" },
  { label: "散歩",   value: "散歩" },
  { label: "ごはん", value: "ごはん" },
  { label: "お昼寝", value: "お昼寝" },
  { label: "遊び",   value: "遊び" },
  { label: "成長記録", value: "成長記録" },
  { label: "お出かけ", value: "お出かけ" },
  { label: "病院",   value: "病院" },
];

const MASONRY_COLS = { default: 3, 1280: 3, 1024: 3, 768: 2, 640: 2 };

// Format today's date in Japanese
function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Home() {
  const { data: session } = useSession();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selected, setSelected] = useState("すべて");
  const [timeline, setTimeline] = useState<"all" | "following">("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/pins?type=image")
      .then((r) => r.json())
      .then((data) => {
        setPins(
          data.map((pin: any) => ({
            id: pin.id,
            imageUrl: pin.imageUrl,
            title: pin.title,
            username: pin.user?.name ?? "unknown",
            category: pin.category ?? "",
            userId: pin.userId,
            tags: pin.category ?? "",
            createdAt: pin.createdAt,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/follow?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setFollowingIds(data.followingIds ?? []));
  }, [session]);

  const filtered = pins.filter((pin) => {
    const tagMatch =
      selected === "すべて" ||
      (pin.category || "").split(",").map((t) => t.trim()).includes(selected);
    const timelineMatch =
      timeline === "all" || followingIds.includes(pin.userId);
    return tagMatch && timelineMatch;
  });

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main min-h-screen bg-[#F5F0E8]">
        {/* ── Page header ───────────────────────── */}
        <header className="px-6 pt-8 pb-4">
          <div className="flex items-end justify-between gap-4 max-w-4xl">
            <div>
              <p className="text-xs text-[#AFA495] tracking-widest uppercase mb-1 font-medium">
                {todayLabel()}
              </p>
              <h1 className="font-serif text-3xl font-semibold text-[#2C2416] leading-tight">
                {timeline === "following" && session
                  ? "みんなの思い出"
                  : "今日の思い出"}
              </h1>
            </div>
            {/* Timeline toggle — understated pill pair */}
            <div className="flex items-center gap-1 bg-[#EDE8DC] rounded-full p-0.5 flex-shrink-0">
              <button
                onClick={() => setTimeline("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeline === "all"
                    ? "bg-[#2C2416] text-[#F5F0E8] shadow-sm"
                    : "text-[#7A6E5F] hover:text-[#2C2416]"
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setTimeline("following")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeline === "following"
                    ? "bg-[#2C2416] text-[#F5F0E8] shadow-sm"
                    : "text-[#7A6E5F] hover:text-[#2C2416]"
                }`}
              >
                フォロー中
              </button>
            </div>
          </div>

          {/* Tag filter bar */}
          <div className="flex gap-2 flex-nowrap overflow-x-auto scrollbar-hide mt-4 pb-0.5 max-w-4xl">
            {PET_TAGS.map((tag) => (
              <button
                key={tag.value}
                onClick={() => setSelected(tag.value)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all border ${
                  selected === tag.value
                    ? "bg-[#2C2416] text-[#F5F0E8] border-[#2C2416]"
                    : "bg-transparent text-[#7A6E5F] border-[#DDD5C4] hover:border-[#BFB39E] hover:text-[#2C2416]"
                }`}
              >
                {tag.value === "すべて" ? "すべて" : `#${tag.label}`}
              </button>
            ))}
          </div>
        </header>

        {/* ── Divider rule */}
        <div className="mx-6 h-px bg-[#DDD5C4] mb-6 max-w-4xl" />

        {/* ── Content area ─────────────────────── */}
        <section className="px-6 pb-12 max-w-4xl" aria-label="思い出一覧">

          {/* Skeleton loading */}
          {loading && (
            <div className="masonry-grid" style={{ display: "flex", marginLeft: "-10px" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ paddingLeft: "10px", flex: "0 0 33.3333%" }}>
                  <div
                    className="w-full rounded-2xl bg-[#EDE8DC] animate-pulse mb-2.5"
                    style={{ height: `${180 + (i % 3) * 60}px` }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-[#EDE8DC] flex items-center justify-center">
                  <PawPrint className="h-8 w-8 text-[#BFB39E]" strokeWidth={1.5} />
                </div>
                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#BFB39E] scale-110 opacity-40" />
              </div>
              <div>
                <p className="font-serif text-xl text-[#2C2416] mb-1.5">
                  まだ思い出がありません
                </p>
                <p className="text-sm text-[#AFA495] leading-relaxed max-w-xs">
                  今日の一枚から始めましょう。<br />
                  写真は、やがて宝物になります。
                </p>
              </div>
              <Link
                href="/create"
                className="mt-1 flex items-center gap-2 px-5 py-2.5 bg-[#2C2416] text-[#F5F0E8] text-sm font-medium rounded-full hover:bg-[#483C2A] transition-colors"
              >
                <Camera className="h-4 w-4 text-[#C9A96E]" strokeWidth={1.75} />
                今日の思い出を残す
              </Link>
            </div>
          )}

          {/* Memory grid */}
          {!loading && filtered.length > 0 && (
            <Masonry
              breakpointCols={MASONRY_COLS}
              className="masonry-grid"
              columnClassName="masonry-grid_column"
            >
              {filtered.map((pin) => (
                <div key={pin.id}>
                  <PinCard
                    imageUrl={pin.imageUrl}
                    title={pin.title}
                    username={pin.username}
                    category={pin.category}
                    pinId={pin.id}
                    isOwner={session?.user?.id === pin.userId}
                    userId={pin.userId}
                    tags={pin.tags}
                  />
                </div>
              ))}
            </Masonry>
          )}
        </section>
      </main>
    </div>
  );
}
