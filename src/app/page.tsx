"use client";

import { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import { Navbar } from "@/components/layout/Navbar";
import { PinCard } from "@/components/pins/PinCard";
import { useSession } from "next-auth/react";

interface Pin {
  id: string;
  imageUrl: string;
  title: string;
  username: string;
  category: string;
  userId: string;
  tags?: string;
}

const ANIMAL_CATEGORIES = [
  "すべて",
  "いぬ",
  "ねこ",
  "うさぎ",
  "とり",
  "さかな",
  "は虫類",
  "ハムスター",
  "その他",
];

const MASONRY_BREAKPOINTS = {
  default: 4,
  1280: 4,
  1024: 3,
  768: 2,
  480: 2,
};

function PinSkeleton() {
  return (
    <div className="mb-4 rounded-xl overflow-hidden bg-[var(--surface)] animate-pulse">
      <div className="bg-[var(--border)]" style={{ height: `${180 + Math.floor(Math.random() * 160)}px` }} />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[var(--border)] rounded w-3/4" />
        <div className="h-2.5 bg-[var(--border)] rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("すべて");
  const [timeline, setTimeline] = useState<"all" | "following">("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/pins?type=image")
      .then((res) => res.json())
      .then((data) => {
        setPins(
          data.map((pin: any) => ({
            id: pin.id,
            imageUrl: pin.imageUrl,
            title: pin.title,
            username: pin.user?.name ?? "unknown",
            category: pin.category ?? "その他",
            userId: pin.userId,
            tags: pin.category ?? "",
          })),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/follow?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setFollowingIds(data.followingIds ?? []));
  }, [session]);

  const filtered = pins.filter((pin) => {
    const categoryMatch =
      selected === "すべて" ||
      (pin.category ?? "")
        .split(",")
        .map((t) => t.trim())
        .includes(selected);
    const timelineMatch =
      timeline === "all" || followingIds.includes(pin.userId);
    return categoryMatch && timelineMatch;
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-40 bg-[var(--background)] py-3 border-b border-[var(--border)]">
        <div className="container mx-auto px-4">
          {/* Timeline toggle */}
          <div className="flex gap-6 mb-3 border-b border-[var(--border)]">
            <button
              onClick={() => setTimeline("all")}
              className={`pb-2 text-sm font-medium transition-colors ${
                timeline === "all"
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)] -mb-px"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setTimeline("following")}
              className={`pb-2 text-sm font-medium transition-colors ${
                timeline === "following"
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)] -mb-px"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              フォロー中
            </button>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-nowrap overflow-x-auto scrollbar-hide pb-0.5">
            {ANIMAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  selected === cat
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                }`}
              >
                {cat === "すべて" ? "すべて" : `#${cat}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <PinSkeleton key={i} />
            ))}
          </Masonry>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-[var(--accent)] mb-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 opacity-30" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="2.2" />
                <circle cx="11" cy="4.5" r="1.8" />
                <circle cx="15.5" cy="5.5" r="2" />
                <circle cx="18.5" cy="9.5" r="1.8" />
                <path d="M12 10c-2.5 0-5.5 2-6 5-.3 1.8.5 3.5 2 4.2 1 .5 2.2.3 3-.3.5-.3 1-.5 1-.5s.5.2 1 .5c.8.6 2 .8 3 .3 1.5-.7 2.3-2.4 2-4.2-.5-3-3.5-5-6-5z" />
              </svg>
            </span>
            <p className="text-[var(--text-muted)] text-sm">
              {timeline === "following"
                ? "フォロー中のユーザーの投稿がありません"
                : `「${selected}」の投稿がありません`}
            </p>
          </div>
        ) : (
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {filtered.map((pin) => (
              <PinCard
                key={pin.id}
                imageUrl={pin.imageUrl}
                title={pin.title}
                username={pin.username}
                category={pin.category}
                pinId={pin.id}
                isOwner={session?.user?.id === pin.userId}
                userId={pin.userId}
                tags={pin.tags}
              />
            ))}
          </Masonry>
        )}
      </main>
    </div>
  );
}
