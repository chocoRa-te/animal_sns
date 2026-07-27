"use client";

import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MemoryCard } from "@/components/pins/PinCard";
import { useSession } from "next-auth/react";
import { Camera, PawPrint } from "lucide-react";
import Link from "next/link";

interface Pin {
  id: string;
  imageUrl: string;
  title: string;
  username: string;
  userId: string;
  category: string;
  tags?: string;
  createdAt?: string;
}

// Group pins by calendar date
function groupByDate(pins: Pin[]): { dateKey: string; label: string; relLabel: string; pins: Pin[] }[] {
  const map = new Map<string, Pin[]>();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  for (const pin of pins) {
    const raw = pin.createdAt ? new Date(pin.createdAt) : new Date();
    const key = raw.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(pin);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, dayPins]) => {
      const d = new Date(key + "T12:00:00");
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
      const relLabel = key === todayKey ? "今日" : key === yesterdayKey ? "昨日" : "";
      return { dateKey: key, label, relLabel, pins: dayPins };
    });
}

const FILTER_TAGS = ["散歩", "ごはん", "お昼寝", "遊び", "成長記録", "お出かけ", "病院", "お風呂"];

export default function Home() {
  const { data: session } = useSession();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<"all" | "following">("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/pins?type=image")
      .then((r) => r.json())
      .then((data: any[]) =>
        setPins(
          data.map((p) => ({
            id: p.id,
            imageUrl: p.imageUrl,
            title: p.title,
            username: p.user?.name ?? "unknown",
            userId: p.userId,
            category: p.category ?? "",
            tags: p.category ?? "",
            createdAt: p.createdAt,
          }))
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/follow?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((data) => setFollowingIds(data.followingIds ?? []));
  }, [session]);

  const filtered = useMemo(() => {
    return pins.filter((pin) => {
      const tagOk =
        !activeTag ||
        (pin.category || "").split(",").map((t) => t.trim()).includes(activeTag);
      const timelineOk =
        timeline === "all" || followingIds.includes(pin.userId);
      return tagOk && timelineOk;
    });
  }, [pins, activeTag, timeline, followingIds]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const isToday = (key: string) => key === todayKey;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main min-h-screen bg-[#F8F4EE]">

        {/* ── Masthead ───────────────────────────────── */}
        <header className="px-8 pt-10 pb-2 max-w-3xl">

          {/* Timeline toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-serif text-[28px] font-semibold text-[#1C1611] leading-tight tracking-tight">
                思い出帳
              </h1>
              <p className="text-[13px] text-[#A89E93] mt-0.5">
                {today.getFullYear()}年{today.getMonth() + 1}月
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#E8DFCF] rounded-full p-0.5">
              <button
                onClick={() => setTimeline("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeline === "all"
                    ? "bg-[#1C1611] text-[#F8F4EE] shadow-sm"
                    : "text-[#A89E93] hover:text-[#1C1611]"
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setTimeline("following")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  timeline === "following"
                    ? "bg-[#1C1611] text-[#F8F4EE] shadow-sm"
                    : "text-[#A89E93] hover:text-[#1C1611]"
                }`}
              >
                フォロー中
              </button>
            </div>
          </div>

          {/* Tag filter — horizontal scrollable */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveTag(null)}
              className={`flex-shrink-0 px-3.5 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
                !activeTag
                  ? "bg-[#1C1611] text-[#F8F4EE] border-[#1C1611]"
                  : "border-[#DDD4C6] text-[#A89E93] hover:border-[#A89E93] hover:text-[#1C1611]"
              }`}
            >
              すべて
            </button>
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`flex-shrink-0 px-3.5 py-1.5 text-[11px] font-medium rounded-full border transition-all ${
                  activeTag === tag
                    ? "bg-[#1C1611] text-[#F8F4EE] border-[#1C1611]"
                    : "border-[#DDD4C6] text-[#A89E93] hover:border-[#A89E93] hover:text-[#1C1611]"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </header>

        {/* ── Journal body ──────────────────────────── */}
        <div className="px-8 pb-16 max-w-3xl">

          {/* Thin rule under masthead */}
          <div className="h-px bg-[#DDD4C6] mt-5 mb-8" />

          {/* Loading */}
          {loading && (
            <div className="flex flex-col gap-10">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-4 w-28 bg-[#E8DFCF] rounded animate-pulse mb-4" />
                  <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="flex-shrink-0 bg-[#E8DFCF] rounded animate-pulse"
                        style={{ width: 180 + j * 20, height: 200 + j * 20 }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-24 gap-6 text-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#DDD4C6]" />
                <div className="absolute inset-3 rounded-full border border-[#E8DFCF]" />
                <PawPrint
                  className="absolute inset-0 m-auto h-7 w-7 text-[#C8BEB3]"
                  strokeWidth={1.25}
                />
              </div>
              <div>
                <p className="font-serif text-[20px] text-[#1C1611] mb-2 leading-snug">
                  まだ思い出がありません
                </p>
                <p className="text-sm text-[#A89E93] leading-relaxed max-w-[260px]">
                  今日の一枚から始めましょう。<br />
                  写真は、やがて宝物になります。
                </p>
              </div>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1611] text-[#F8F4EE] text-[13px] font-medium rounded-full hover:bg-[#3A2E22] transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-[#C9A96E]" strokeWidth={1.75} />
                今日の思い出を残す
              </Link>
            </div>
          )}

          {/* ── Timeline ──────────────────────── */}
          {!loading && grouped.length > 0 && (
            <div className="relative">
              {/* Vertical binding line */}
              <div className="journal-line" />

              <div className="flex flex-col gap-12">
                {grouped.map(({ dateKey, label, relLabel, pins: dayPins }) => (
                  <section
                    key={dateKey}
                    className="day-entry animate-fade-up"
                    aria-label={label}
                  >
                    {/* Date bullet */}
                    <div className={`day-dot ${isToday(dateKey) ? "day-dot--today" : ""}`} aria-hidden="true" />

                    {/* Date heading */}
                    <div className="flex items-baseline gap-2 mb-4">
                      {relLabel && (
                        <span className="font-serif text-[11px] font-medium text-[#C4856A] uppercase tracking-widest">
                          {relLabel}
                        </span>
                      )}
                      <time
                        dateTime={dateKey}
                        className={`font-serif text-[13px] ${relLabel ? "text-[#A89E93]" : "font-semibold text-[#1C1611]"}`}
                      >
                        {label}
                      </time>
                      <span className="text-[11px] text-[#C8BEB3]">
                        {dayPins.length}枚
                      </span>
                    </div>

                    {/* Photo strip — horizontal scroll */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                      {dayPins.map((pin, idx) => (
                        <div
                          key={pin.id}
                          className="flex-shrink-0"
                          style={{
                            // Subtle natural rotation for visual warmth
                            transform: `rotate(${idx % 3 === 0 ? -0.8 : idx % 3 === 1 ? 0.5 : -0.3}deg)`,
                          }}
                        >
                          <MemoryCard
                            pinId={pin.id}
                            imageUrl={pin.imageUrl}
                            title={pin.title}
                            username={pin.username}
                            userId={pin.userId}
                            category={pin.category}
                            isOwner={session?.user?.id === pin.userId}
                            tags={pin.tags}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
