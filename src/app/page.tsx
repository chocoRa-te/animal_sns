"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { PinCard } from "@/components/pins/PinCard";
import { useSession } from "next-auth/react";

interface Pin {
  id: string;
  imageUrl: string;
  title: string;
  username: string;
  height: number;
  category: string;
  userId: string;
}

const categories = ["すべて", "自然", "料理", "インテリア", "旅行"];

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
            height: 200 + Math.floor(Math.random() * 200),
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
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F3" }}>
      <Navbar />

      <div className="sticky top-[57px]  z-40 bg-[#F7F5F3] py-4">
        <div className="container mx-auto px-4">
          {/* タイムライン切り替え */}
          <div className="flex gap-6 mb-4 border-b border-[#E8E4E0]">
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
          <div className="flex gap-2 flex-nowrap overflow-x-auto scrollbar-hide pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-sm whitespace-nowrap transition-colors ${
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((pin) => (
            <PinCard
              key={pin.id}
              imageUrl={pin.imageUrl}
              title={pin.title}
              username={pin.username}
              height={pin.height}
              category={pin.category}
              pinId={pin.id}
              isOwner={session?.user?.id === pin.userId}
              userId={pin.userId}
              tags={pin.category}
              // onClick={() => setSelected(pin.category)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
