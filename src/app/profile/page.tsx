"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PinCard } from "@/components/pins/PinCard";
import { Camera, Video as VideoIcon, BookImage, Heart } from "lucide-react";
import Link from "next/link";
import Masonry from "react-masonry-css";

interface Pin {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  title: string;
  username: string;
  category: string;
  userId: string;
  type?: string;
}

interface Album {
  tag: string;
  photoCount: number;
  videoCount: number;
  thumbnails: string[];
}

type Tab = "posts" | "videos" | "albums" | "likes";

const MASONRY_COLS = { default: 3, 1024: 3, 768: 2, 640: 2 };

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "posts",  label: "写真",     icon: Camera },
  { id: "videos", label: "動画",     icon: VideoIcon },
  { id: "albums", label: "アルバム", icon: BookImage },
  { id: "likes",  label: "いいね",   icon: Heart },
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [videos, setVideos] = useState<Pin[]>([]);
  const [likedPins, setLikedPins] = useState<Pin[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return; }
    const uid = session.user.id;

    fetch(`/api/settings?userId=${uid}`)
      .then((r) => r.json())
      .then((data) => setBio(data.bio ?? ""));

    Promise.all([
      fetch("/api/pins?type=image").then((r) => r.json()),
      fetch("/api/pins?type=video").then((r) => r.json()),
      fetch(`/api/likes?userId=${uid}`).then((r) => r.json()),
      fetch("/api/pins").then((r) => r.json()),
    ]).then(([imgData, vidData, likeData, allData]) => {
      setPins(
        imgData
          .filter((p: any) => p.userId === uid)
          .map((p: any) => ({ id: p.id, imageUrl: p.imageUrl, title: p.title, username: p.user?.name ?? "unknown", category: p.category ?? "", userId: p.userId, type: p.type }))
      );
      setVideos(
        vidData
          .filter((p: any) => p.userId === uid)
          .map((p: any) => ({ id: p.id, imageUrl: p.imageUrl, videoUrl: p.videoUrl, title: p.title, username: p.user?.name ?? "unknown", category: p.category ?? "", userId: p.userId, type: p.type }))
      );
      setLikedPins(
        (likeData.pins ?? []).map((p: any) => ({ id: p.id, imageUrl: p.imageUrl, title: p.title, username: p.user?.name ?? "unknown", category: p.category ?? "", userId: p.userId }))
      );

      const myPins = allData.filter((p: any) => p.userId === uid);
      const map: Record<string, Album> = {};
      myPins.forEach((p: any) => {
        if (!p.category) return;
        p.category.split(",").forEach((raw: string) => {
          const tag = raw.trim();
          if (!tag) return;
          if (!map[tag]) map[tag] = { tag, photoCount: 0, videoCount: 0, thumbnails: [] };
          if (p.type === "video") map[tag].videoCount++;
          else map[tag].photoCount++;
          if (map[tag].thumbnails.length < 4) {
            const thumb = p.imageUrl || p.videoUrl;
            if (thumb) map[tag].thumbnails.push(thumb);
          }
        });
      });
      setAlbums(Object.values(map));
    }).finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="app-main min-h-screen bg-[#F8F4EE] flex items-center justify-center">
          <p className="text-[#A89E93] text-[13px]">
            <Link href="/login" className="underline underline-offset-2 hover:text-[#1C1611] transition-colors">ログイン</Link>してください
          </p>
        </main>
      </div>
    );
  }

  const activeList = tab === "posts" ? pins : tab === "likes" ? likedPins : [];
  const totalMemories = pins.length + videos.length;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main min-h-screen bg-[#F8F4EE]">

        {/* ══════════════════════════════════════════
            Book cover — the identity of this journal
        ══════════════════════════════════════════ */}
        <header className="px-8 pt-12 pb-0 max-w-3xl">
          <div className="flex items-start gap-8 mb-8">

            {/* Avatar as a photo print */}
            <div
              className="flex-shrink-0 bg-white shadow-lg"
              style={{ padding: "5px 5px 20px 5px" }}
            >
              <div
                className="bg-[#E8DFCF] flex items-center justify-center text-[#1C1611] font-semibold overflow-hidden"
                style={{ width: 80, height: 80, fontSize: 28 }}
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "アバター"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  session.user?.name?.[0]?.toUpperCase() ?? "U"
                )}
              </div>
            </div>

            {/* Book title area */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[11px] font-medium tracking-[0.18em] text-[#A89E93] uppercase mb-2">
                思い出帳
              </p>
              <h1 className="font-serif text-[30px] font-semibold text-[#1C1611] leading-tight mb-0.5">
                {session.user?.name}
              </h1>
              <p className="font-serif italic text-[15px] text-[#C8BEB3]">
                の大切な記録
              </p>

              {bio && (
                <p className="text-[13px] text-[#6B6055] mt-3 leading-relaxed max-w-xs">
                  {bio}
                </p>
              )}

              {/* Stats — memories, not metrics */}
              <div className="flex items-center gap-5 mt-5">
                <div>
                  <span className="font-serif text-[22px] font-semibold text-[#1C1611] leading-none">
                    {loading ? "—" : totalMemories}
                  </span>
                  <span className="text-[11px] text-[#A89E93] ml-1.5">思い出</span>
                </div>
                <div className="w-px h-5 bg-[#DDD4C6]" aria-hidden="true" />
                <div>
                  <span className="font-serif text-[22px] font-semibold text-[#1C1611] leading-none">
                    {loading ? "—" : albums.length}
                  </span>
                  <span className="text-[11px] text-[#A89E93] ml-1.5">アルバム</span>
                </div>
                <div className="w-px h-5 bg-[#DDD4C6]" aria-hidden="true" />
                <div>
                  <span className="font-serif text-[22px] font-semibold text-[#1C1611] leading-none">
                    {loading ? "—" : likedPins.length}
                  </span>
                  <span className="text-[11px] text-[#A89E93] ml-1.5">いいね</span>
                </div>
              </div>
            </div>

            {/* Edit button */}
            <Link
              href="/profile/edit"
              className="flex-shrink-0 text-[12px] font-medium px-4 py-2 border rounded-full text-[#6B6055] hover:text-[#1C1611] hover:bg-[#F2EBE0] transition-colors"
              style={{ borderColor: "#DDD4C6" }}
            >
              プロフィール編集
            </Link>
          </div>

          {/* Tab bar — simple underlines, no pill backgrounds */}
          <div className="flex gap-0 border-b" style={{ borderColor: "#DDD4C6" }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium transition-all border-b-2 -mb-px ${
                  tab === id
                    ? "border-[#1C1611] text-[#1C1611]"
                    : "border-transparent text-[#C8BEB3] hover:text-[#6B6055]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={tab === id ? 2 : 1.5} />
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* ══════════════════════════════════════════
            Tab content
        ══════════════════════════════════════════ */}
        <section className="px-8 py-7 max-w-3xl pb-16" aria-label="プロフィールコンテンツ">

          {/* Photo + likes grids */}
          {(tab === "posts" || tab === "likes") && (
            <>
              {activeList.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-5 text-center">
                  <p className="font-serif text-[20px] text-[#C8BEB3]">
                    {tab === "posts" ? "まだ写真がありません" : "まだいいねがありません"}
                  </p>
                  {tab === "posts" && (
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1611] text-[#F8F4EE] text-[13px] font-medium rounded-full hover:bg-[#3A2E22] transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5 text-[#C9A96E]" strokeWidth={1.75} />
                      最初の思い出を残す
                    </Link>
                  )}
                </div>
              ) : (
                <Masonry
                  breakpointCols={MASONRY_COLS}
                  className="masonry-grid"
                  columnClassName="masonry-grid_column"
                >
                  {activeList.map((pin) => (
                    <div key={pin.id}>
                      <PinCard
                        imageUrl={pin.imageUrl}
                        title={pin.title}
                        username={pin.username}
                        category={pin.category}
                        pinId={pin.id}
                        isOwner={tab === "posts"}
                        userId={pin.userId}
                      />
                    </div>
                  ))}
                </Masonry>
              )}
            </>
          )}

          {/* Video grid */}
          {tab === "videos" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {videos.length === 0 ? (
                <p className="col-span-full py-24 text-center font-serif text-[20px] text-[#C8BEB3]">
                  まだ動画がありません
                </p>
              ) : (
                videos.map((video) => (
                  <div
                    key={video.id}
                    className="photo-print cursor-pointer aspect-[9/16] overflow-hidden"
                    onClick={() => router.push("/video")}
                    role="button"
                    aria-label={video.title}
                  >
                    {video.imageUrl ? (
                      <img src={video.imageUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <video src={video.videoUrl} className="w-full h-full object-cover" muted />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Album grid */}
          {tab === "albums" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {albums.length === 0 ? (
                <p className="col-span-full py-24 text-center font-serif text-[20px] text-[#C8BEB3]">
                  タグをつけると自動でアルバムが作られます
                </p>
              ) : (
                albums.map((album) => (
                  <div
                    key={album.tag}
                    className="photo-print cursor-pointer group hover:shadow-md transition-all"
                    style={{ width: "100%" }}
                    onClick={() => router.push(`/album/${encodeURIComponent(album.tag)}`)}
                    role="button"
                    aria-label={`${album.tag}アルバム`}
                  >
                    {/* 4-up thumbnail grid */}
                    <div
                      className="grid overflow-hidden bg-[#E8DFCF]"
                      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
                    >
                      {album.thumbnails.slice(0, 4).map((url, i) => (
                        <div key={i} className="aspect-square overflow-hidden">
                          {url.includes(".mp4") || url.includes(".mov") ? (
                            <video src={url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={url} alt={album.tag} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 4 - album.thumbnails.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-[#E8DFCF]" />
                      ))}
                    </div>

                    {/* Album caption */}
                    <div className="pt-2.5 pb-0.5">
                      <p className="font-serif italic text-[13px] text-[#1C1611] font-semibold">
                        #{album.tag}
                      </p>
                      <p className="text-[11px] text-[#A89E93] mt-0.5">
                        {album.photoCount}枚の写真
                        {album.videoCount > 0 && ` · ${album.videoCount}本の動画`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
