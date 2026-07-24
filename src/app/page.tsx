"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PinCard } from "@/components/pins/PinCard";
import { useSession } from "next-auth/react";
import Masonry from "react-masonry-css";
import { Camera } from "lucide-react";
import Link from "next/link";

interface Pin {
  id: string;
  imageUrl: string;
  title: string;
  username: string;
  category: string;
  userId: string;
  tags?: string;
}

const PET_CATEGORIES = ["すべて", "散歩", "ごはん", "お昼寝", "遊び", "成長記録", "お出かけ"];

const MASONRY_BREAKPOINTS = {
  default: 4,
  1280: 4,
  1024: 3,
  640: 2,
};

export default function Home() {
  const { data: session } = useSession();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selected, setSelected] = useState("すべて");
  const [timeline, setTimeline] = useState<"all" | "following">("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
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
      });
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/follow?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setFollowingIds(data.followingIds));
  }, [session]);

  const filtered = pins.filter((pin) => {
    const categoryMatch = selected === "すべて" || pin.category === selected;
    const timelineMatch =
      timeline === "all" || followingIds.includes(pin.userId);
    return categoryMatch && timelineMatch;
  });

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />

      {/* Filter bar — sticky below navbar */}
      <div
        className="sticky z-40 bg-[#F7F5F3] border-b border-[#E8E4E0] py-3"
        style={{ top: "var(--navbar-h)" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          {/* Timeline tabs */}
          <div className="flex gap-6 mb-3 border-b border-[#E8E4E0]">
            <button
              onClick={() => setTimeline("all")}
              className={`pb-2 text-sm font-medium transition-colors ${
                timeline === "all"
                  ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px"
                  : "text-[#A39E99] hover:text-[#6B6560]"
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setTimeline("following")}
              className={`pb-2 text-sm font-medium transition-colors ${
                timeline === "following"
                  ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px"
                  : "text-[#A39E99] hover:text-[#6B6560]"
              }`}
            >
              フォロー中
            </button>
          </div>

          {/* Pet memory category tags */}
          <div className="flex gap-2 flex-nowrap overflow-x-auto scrollbar-hide pb-0.5">
            {PET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  selected === cat
                    ? "bg-[#1A1814] text-white"
                    : "bg-[#E8E4E0] text-[#6B6560] hover:bg-[#1A1814] hover:text-white"
                }`}
              >
                {cat === "すべて" ? "すべて" : `#${cat}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Memory-book greeting — shown on "all" feed with no category filter */}
        {timeline === "all" && selected === "すべて" && pins.length > 0 && (
          <p className="font-serif italic text-[#A39E99] text-sm mb-5 text-center">
            今日も素敵な思い出を
          </p>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-16 w-16 rounded-full bg-[#E8E4E0] flex items-center justify-center">
              <Camera className="h-7 w-7 text-[#A39E99]" />
            </div>
            <div className="text-center">
              <p className="text-[#1A1814] font-medium text-sm mb-1">
                まだ思い出がありません
              </p>
              <p className="text-[#A39E99] text-xs">
                最初の一枚を残してみましょう
              </p>
            </div>
            <Link
              href="/create"
              className="mt-2 px-5 py-2 bg-[#1A1814] text-white text-sm font-medium rounded-full hover:bg-[#3D3830] transition-colors"
            >
              思い出を残す
            </Link>
          </div>
        ) : (
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
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
      </main>
    </div>
  );
}
