"use client";

import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MemoryCard } from "@/components/pins/PinCard";
import { useSession } from "next-auth/react";
import { Camera, PawPrint, Sparkles } from "lucide-react";
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

// Rotating daily prompts — changes each day, same for all users on that day
const DAILY_PROMPTS = [
  "今日、どんな顔を見せてくれた？",
  "今日の一番かわいい瞬間は？",
  "今日のお気に入りの表情、残しておこう。",
  "今日も一緒にいてくれてありがとう。",
  "何気ない今日が、いつか宝物になる。",
  "今日の笑顔、忘れないために。",
  "小さな幸せ、写真に残しておこう。",
];

function getDailyPrompt(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

const MOOD_TAGS = ["散歩", "ごはん", "お昼寝", "遊び", "成長記録", "お出かけ", "病院", "お風呂"];

export default function Home() {
  const { data: session } = useSession();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [showPast, setShowPast] = useState<"all" | "following">("all");

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const weekdays = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  const todayLabel = `${today.getMonth() + 1}月${today.getDate()}日 ${weekdays[today.getDay()]}`;
  const dailyPrompt = getDailyPrompt();

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

  const allFiltered = useMemo(() => {
    return pins.filter((pin) => {
      const tagOk = !activeTag || (pin.category || "").split(",").map((t) => t.trim()).includes(activeTag);
      const tlOk = showPast === "all" || followingIds.includes(pin.userId);
      return tagOk && tlOk;
    });
  }, [pins, activeTag, showPast, followingIds]);

  const todayPins = useMemo(
    () => allFiltered.filter((p) => (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : todayKey) === todayKey),
    [allFiltered, todayKey]
  );

  const pastPins = useMemo(
    () => allFiltered.filter((p) => (p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : todayKey) !== todayKey),
    [allFiltered, todayKey]
  );

  const grouped = useMemo(() => groupByDate(pastPins), [pastPins]);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main min-h-screen flex flex-col">

        {/* ═══════════════════════════════════════════
            TODAY ZONE — the living present
            ─ Dark, warm, present-tense, action-first
        ═══════════════════════════════════════════ */}
        <section
          className="today-zone relative flex-shrink-0"
          aria-label="今日の思い出"
        >
          {/* Subtle texture overlay */}
          <div className="today-texture" aria-hidden="true" />

          <div className="relative z-10 px-8 pt-10 pb-8 max-w-2xl">

            {/* Date & prompt */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium tracking-[0.15em] text-[#C9A96E] uppercase">
                  Today
                </span>
                <div className="h-px flex-1 bg-[#C9A96E]/20" />
              </div>
              <h1 className="font-serif text-[32px] font-semibold text-[#F5EED8] leading-none tracking-tight mb-3">
                {todayLabel}
              </h1>
              <p className="text-[14px] text-[#C8B89A] leading-relaxed font-light italic">
                &ldquo;{dailyPrompt}&rdquo;
              </p>
            </div>

            {/* PRIMARY ACTION — the entire reason this screen exists */}
            <Link
              href="/create"
              className="today-cta group"
              aria-label="今日の思い出を残す"
            >
              <div className="today-cta-inner">
                <div className="today-cta-icon">
                  <Camera className="h-6 w-6 text-[#1C1611]" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#1C1611] leading-tight">
                    今日の思い出を残す
                  </p>
                  <p className="text-[11px] text-[#6B6055] mt-0.5">
                    写真・動画を追加する
                  </p>
                </div>
              </div>
              <div className="today-cta-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#6B6055" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>

            {/* Today's photos strip — if any exist */}
            {!loading && todayPins.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-[#C9A96E]" strokeWidth={1.5} />
                  <span className="text-[11px] text-[#C8B89A] font-medium">
                    今日 · {todayPins.length}枚
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {todayPins.map((pin, idx) => (
                    <div
                      key={pin.id}
                      className="flex-shrink-0"
                      style={{
                        transform: `rotate(${idx % 3 === 0 ? -0.9 : idx % 3 === 1 ? 0.6 : -0.4}deg)`,
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
                        darkMode
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            PAST ZONE — the warm archive
            ─ Light, cream, nostalgic, browse-mode
        ═══════════════════════════════════════════ */}
        <section
          className="past-zone flex-1 px-8 pt-8 pb-20"
          aria-label="過去の思い出"
        >
          {/* Controls bar */}
          <div className="flex items-center justify-between mb-5 gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-[16px] font-semibold text-[#1C1611]">
                思い出帳
              </h2>
              <div className="flex items-center gap-0.5 bg-[#E8DFCF] rounded-full p-0.5">
                <button
                  onClick={() => setShowPast("all")}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${showPast === "all" ? "bg-[#1C1611] text-[#F8F4EE]" : "text-[#A89E93] hover:text-[#1C1611]"}`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setShowPast("following")}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${showPast === "following" ? "bg-[#1C1611] text-[#F8F4EE]" : "text-[#A89E93] hover:text-[#1C1611]"}`}
                >
                  フォロー中
                </button>
              </div>
            </div>

            {/* Tag filter — scrollable chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTag(null)}
                className={`flex-shrink-0 px-3 py-1 text-[10px] font-medium rounded-full border transition-all ${!activeTag ? "bg-[#1C1611] text-[#F8F4EE] border-[#1C1611]" : "border-[#DDD4C6] text-[#A89E93] hover:border-[#A89E93]"}`}
              >
                すべて
              </button>
              {MOOD_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`flex-shrink-0 px-3 py-1 text-[10px] font-medium rounded-full border transition-all ${activeTag === tag ? "bg-[#1C1611] text-[#F8F4EE] border-[#1C1611]" : "border-[#DDD4C6] text-[#A89E93] hover:border-[#A89E93]"}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#DDD4C6] mb-8" />

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-10">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-3.5 w-24 bg-[#E8DFCF] rounded animate-pulse mb-4" />
                  <div className="flex gap-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex-shrink-0 bg-[#E8DFCF] rounded animate-pulse" style={{ width: 180 + j * 12, height: 200 + j * 15 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state — only shown if no past memories at all */}
          {!loading && pastPins.length === 0 && todayPins.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-5 text-center">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#DDD4C6]" />
                <PawPrint className="absolute inset-0 m-auto h-6 w-6 text-[#C8BEB3]" strokeWidth={1.25} />
              </div>
              <div>
                <p className="font-serif text-[18px] text-[#1C1611] mb-2 leading-snug">
                  最初の一枚を残しましょう
                </p>
                <p className="text-[13px] text-[#A89E93] leading-relaxed max-w-[240px]">
                  今日の何気ない瞬間が、<br />いつか一番大切な思い出になります。
                </p>
              </div>
            </div>
          )}

          {/* Only-today state — past archive is empty but today has memories */}
          {!loading && pastPins.length === 0 && todayPins.length > 0 && (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <p className="font-serif italic text-[16px] text-[#A89E93]">
                今日が、最初のページ。
              </p>
              <p className="text-[12px] text-[#C8BEB3]">
                明日以降の思い出がここに集まっていきます。
              </p>
            </div>
          )}

          {/* Timeline journal */}
          {!loading && grouped.length > 0 && (
            <div className="relative max-w-2xl">
              <div className="journal-line" />
              <div className="flex flex-col gap-12">
                {grouped.map(({ dateKey, label, relLabel, pins: dayPins }) => (
                  <section key={dateKey} className="day-entry animate-fade-up" aria-label={label}>
                    <div className="day-dot" aria-hidden="true" />
                    <div className="flex items-baseline gap-2 mb-4">
                      {relLabel && (
                        <span className="font-serif text-[11px] font-medium text-[#C4856A] tracking-widest uppercase">
                          {relLabel}
                        </span>
                      )}
                      <time dateTime={dateKey} className={`font-serif text-[13px] ${relLabel ? "text-[#A89E93]" : "font-semibold text-[#1C1611]"}`}>
                        {label}
                      </time>
                      <span className="text-[11px] text-[#C8BEB3]">{dayPins.length}枚</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                      {dayPins.map((pin, idx) => (
                        <div
                          key={pin.id}
                          className="flex-shrink-0"
                          style={{ transform: `rotate(${idx % 3 === 0 ? -0.8 : idx % 3 === 1 ? 0.5 : -0.3}deg)` }}
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
        </section>
      </main>
    </div>
  );
}
