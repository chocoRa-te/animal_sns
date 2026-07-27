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

const MASONRY_COLS = { default: 3, 1280: 3, 1024: 3, 768: 2, 640: 2 };

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

  useEffect(() => {
    if (!session?.user?.id) return;
    const uid = session.user.id;

    fetch(`/api/settings?userId=${uid}`)
      .then((r) => r.json())
      .then((data) => setBio(data.bio ?? ""));

    fetch("/api/pins?type=image")
      .then((r) => r.json())
      .then((data) =>
        setPins(
          data
            .filter((p: any) => p.userId === uid)
            .map((p: any) => ({
              id: p.id, imageUrl: p.imageUrl,
              title: p.title, username: p.user?.name ?? "unknown",
              category: p.category ?? "", userId: p.userId, type: p.type,
            }))
        )
      );

    fetch("/api/pins?type=video")
      .then((r) => r.json())
      .then((data) =>
        setVideos(
          data
            .filter((p: any) => p.userId === uid)
            .map((p: any) => ({
              id: p.id, imageUrl: p.imageUrl, videoUrl: p.videoUrl,
              title: p.title, username: p.user?.name ?? "unknown",
              category: p.category ?? "", userId: p.userId, type: p.type,
            }))
        )
      );

    fetch(`/api/likes?userId=${uid}`)
      .then((r) => r.json())
      .then((data) =>
        setLikedPins(
          (data.pins ?? []).map((p: any) => ({
            id: p.id, imageUrl: p.imageUrl,
            title: p.title, username: p.user?.name ?? "unknown",
            category: p.category ?? "", userId: p.userId,
          }))
        )
      );

    fetch("/api/pins")
      .then((r) => r.json())
      .then((data) => {
        const myPins = data.filter((p: any) => p.userId === uid);
        const map: Record<string, Album> = {};
        myPins.forEach((p: any) => {
          if (!p.category) return;
          p.category.split(",").forEach((raw: string) => {
            const tag = raw.trim();
            if (!tag) return;
            if (!map[tag]) map[tag] = { tag, photoCount: 0, videoCount: 0, thumbnails: [] };
            if (p.type === "video") map[tag].videoCount++;
            else map[tag].photoCount++;
            if (map[tag].thumbnails.length < 3) {
              const thumb = p.imageUrl || p.videoUrl;
              if (thumb) map[tag].thumbnails.push(thumb);
            }
          });
        });
        setAlbums(Object.values(map));
      });
  }, [session]);

  if (!session) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="app-main min-h-screen bg-[#F5F0E8] flex items-center justify-center">
          <p className="text-[#7A6E5F] text-sm">
            <Link href="/login" className="underline underline-offset-2 hover:text-[#2C2416]">ログイン</Link>してください
          </p>
        </main>
      </div>
    );
  }

  const activeList = tab === "posts" ? pins : tab === "likes" ? likedPins : [];

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main min-h-screen bg-[#F5F0E8]">

        {/* ── Profile header ────────────────────── */}
        <header className="px-6 pt-10 pb-6 max-w-4xl">
          <div className="flex items-start gap-5">

            {/* Avatar */}
            <div className="photo-frame rounded-sm flex-shrink-0" style={{ padding: "4px 4px 12px 4px" }}>
              <div className="h-16 w-16 bg-[#2C2416] flex items-center justify-center text-[#F5F0E8] text-xl font-semibold overflow-hidden rounded-[1px]">
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

            {/* Name + stats */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="font-serif text-2xl font-semibold text-[#2C2416] leading-tight">
                {session.user?.name}
              </h1>
              <p className="font-serif italic text-sm text-[#AFA495] mt-0.5">
                の思い出帳
              </p>
              {bio && (
                <p className="text-sm text-[#7A6E5F] mt-2.5 leading-relaxed max-w-xs">
                  {bio}
                </p>
              )}

              {/* Stats row — memories, not followers */}
              <div className="flex gap-5 mt-4">
                <div className="text-center">
                  <p className="font-serif text-lg font-semibold text-[#2C2416] leading-none">{pins.length}</p>
                  <p className="text-[10px] text-[#AFA495] mt-0.5 tracking-wide">写真</p>
                </div>
                <div className="h-6 w-px bg-[#DDD5C4] self-center" aria-hidden="true" />
                <div className="text-center">
                  <p className="font-serif text-lg font-semibold text-[#2C2416] leading-none">{albums.length}</p>
                  <p className="text-[10px] text-[#AFA495] mt-0.5 tracking-wide">アルバム</p>
                </div>
                <div className="h-6 w-px bg-[#DDD5C4] self-center" aria-hidden="true" />
                <div className="text-center">
                  <p className="font-serif text-lg font-semibold text-[#2C2416] leading-none">{likedPins.length}</p>
                  <p className="text-[10px] text-[#AFA495] mt-0.5 tracking-wide">いいね</p>
                </div>
              </div>
            </div>

            {/* Edit button */}
            <Link
              href="/profile/edit"
              className="flex-shrink-0 text-xs font-medium px-4 py-2 border border-[#DDD5C4] rounded-full text-[#7A6E5F] hover:bg-[#EDE8DC] hover:text-[#2C2416] transition-colors"
            >
              プロフィール編集
            </Link>
          </div>
        </header>

        {/* ── Tab bar ───────────────────────────── */}
        <div className="border-b border-[#DDD5C4] px-6 max-w-4xl">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                  tab === id
                    ? "border-[#2C2416] text-[#2C2416]"
                    : "border-transparent text-[#AFA495] hover:text-[#7A6E5F]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={tab === id ? 2 : 1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ───────────────────────── */}
        <section className="px-6 py-6 max-w-4xl pb-12" aria-label="プロフィールコンテンツ">

          {/* Photo / likes grid */}
          {(tab === "posts" || tab === "likes") && (
            <>
              {activeList.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-4 text-center">
                  <p className="font-serif text-lg text-[#BFB39E]">
                    {tab === "posts" ? "まだ写真がありません" : "まだいいねがありません"}
                  </p>
                  {tab === "posts" && (
                    <Link
                      href="/create"
                      className="text-sm text-[#2C2416] underline underline-offset-2 hover:text-[#483C2A] transition-colors"
                    >
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {videos.length === 0 ? (
                <p className="col-span-full text-center py-20 font-serif text-lg text-[#BFB39E]">
                  まだ動画がありません
                </p>
              ) : (
                videos.map((video) => (
                  <div
                    key={video.id}
                    className="photo-frame rounded-sm cursor-pointer aspect-[9/16] overflow-hidden"
                    onClick={() => router.push("/video")}
                  >
                    {video.imageUrl ? (
                      <img
                        src={video.imageUrl}
                        alt={video.title}
                        className="w-full h-full object-cover rounded-[1px]"
                      />
                    ) : (
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover rounded-[1px]"
                        muted
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Album grid */}
          {tab === "albums" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {albums.length === 0 ? (
                <p className="col-span-full text-center py-20 font-serif text-lg text-[#BFB39E]">
                  タグをつけると自動でアルバムが作られます
                </p>
              ) : (
                albums.map((album) => (
                  <div
                    key={album.tag}
                    className="photo-frame rounded-sm cursor-pointer group hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/album/${encodeURIComponent(album.tag)}`)}
                  >
                    {/* 3-column thumbnail grid */}
                    <div className="grid grid-cols-3 gap-0.5 rounded-[1px] overflow-hidden bg-[#EDE8DC]">
                      {album.thumbnails.map((url, i) => (
                        <div key={i} className="aspect-square overflow-hidden">
                          {url.includes(".mp4") || url.includes(".mov") ? (
                            <video src={url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={url} alt={album.tag} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 3 - album.thumbnails.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-[#EDE8DC]" />
                      ))}
                    </div>

                    {/* Caption */}
                    <div className="pt-2 pb-0.5">
                      <p className="font-serif italic text-sm text-[#2C2416] font-medium">
                        #{album.tag}
                      </p>
                      <p className="text-[11px] text-[#AFA495] mt-0.5">
                        写真 {album.photoCount}枚
                        {album.videoCount > 0 && ` · 動画 ${album.videoCount}本`}
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
