"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { PinCard } from "@/components/pins/PinCard";
import Link from "next/link";
import { Menu, X, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface Pin {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  title: string;
  username: string;
  height: number;
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

interface TimelineMonth {
  year: number;
  month: number;
  count: number;
  thumbnail: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [videos, setVideos] = useState<Pin[]>([]);
  const [likedPins, setLikedPins] = useState<Pin[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tab, setTab] = useState<"posts" | "videos" | "albums" | "likes">(
    "posts",
  );
  const [bio, setBio] = useState("");
  const [timeline, setTimeline] = useState<Record<number, TimelineMonth[]>>({});
  const [showMenu, setShowMenu] = useState(false);
  const [customAlbums, setCustomAlbums] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    // bioを取得
    fetch(`/api/settings?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setBio(data.bio ?? ""));

    // 自分の画像投稿を取得
    fetch("/api/pins?type=image")
      .then((res) => res.json())
      .then((data) => {
        const myPins = data
          .filter((pin: any) => pin.userId === session.user.id)
          .map((pin: any) => ({
            id: pin.id,
            imageUrl: pin.imageUrl,
            title: pin.title,
            username: pin.user?.name ?? "unknown",
            height: 200 + Math.floor(Math.random() * 200),
            category: pin.category ?? "",
            userId: pin.userId,
            type: pin.type,
          }));
        setPins(myPins);
      });

    // 自分の動画投稿を取得
    fetch("/api/pins?type=video")
      .then((res) => res.json())
      .then((data) => {
        const myVideos = data
          .filter((pin: any) => pin.userId === session.user.id)
          .map((pin: any) => ({
            id: pin.id,
            imageUrl: pin.imageUrl,
            videoUrl: pin.videoUrl,
            title: pin.title,
            username: pin.user?.name ?? "unknown",
            height: 200,
            category: pin.category ?? "",
            userId: pin.userId,
            type: pin.type,
          }));
        setVideos(myVideos);
      });

    // いいねした投稿を取得
    fetch(`/api/likes?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const liked = data.pins.map((pin: any) => ({
          id: pin.id,
          imageUrl: pin.imageUrl,
          title: pin.title,
          username: pin.user?.name ?? "unknown",
          height: 200 + Math.floor(Math.random() * 200),
          category: pin.category ?? "",
          userId: pin.userId,
        }));
        setLikedPins(liked);
      });
    // アルバム（タグ別）を作成
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const myPins = data.filter(
          (pin: any) => pin.userId === session.user.id,
        );
        const albumMap: Record<string, Album> = {};

        myPins.forEach((pin: any) => {
          if (!pin.category) return;
          const tags = pin.category.split(",").filter(Boolean);

          tags.forEach((tag: string) => {
            const trimmedTag = tag.trim();
            if (!albumMap[trimmedTag]) {
              albumMap[trimmedTag] = {
                tag: trimmedTag,
                photoCount: 0,
                videoCount: 0,
                thumbnails: [],
              };
            }
            if (pin.type === "video") albumMap[trimmedTag].videoCount++;
            else albumMap[trimmedTag].photoCount++;
            if (albumMap[trimmedTag].thumbnails.length < 3) {
              const thumb = pin.imageUrl || pin.videoUrl;
              if (thumb) albumMap[trimmedTag].thumbnails.push(thumb);
            }
          });
        });

        // カスタムアルバムを取得
        fetch(`/api/albums?userId=${session.user.id}`)
          .then((res) => res.json())
          .then((data) => setCustomAlbums(data));

        setAlbums(Object.values(albumMap));

        // タイムライン生成
        const timelineMap: Record<string, TimelineMonth> = {};
        myPins.forEach((pin: any) => {
          const d = new Date(pin.createdAt);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          if (!timelineMap[key]) {
            timelineMap[key] = {
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              count: 0,
              thumbnail: pin.imageUrl || pin.videoUrl || "",
            };
          }
          timelineMap[key].count++;
        });

        const byYear: Record<number, TimelineMonth[]> = {};
        Object.values(timelineMap).forEach((m) => {
          if (!byYear[m.year]) byYear[m.year] = [];
          byYear[m.year].push(m);
        });
        Object.keys(byYear).forEach((year) => {
          byYear[Number(year)].sort((a, b) => b.month - a.month);
        });
        setTimeline(byYear);
      });
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-[#6B6560]">ログインしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* ヘッダー */}
        <div className="flex justify-end mb-6 relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-[#AFA495] md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* ポップアップメニュー */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 bg-white border border-[#DDD5C4] rounded-xl shadow-lg w-44 z-50">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#7A6E5F] hover:bg-[#EDE8DC] rounded-t-xl transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <Settings className="h-4 w-4" />
                  設定
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-50 rounded-b-xl transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
        {/* プロフィール情報 */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              (session.user.name?.[0]?.toUpperCase() ?? "U")
            )}
          </div>
          <h1 className="text-xl font-semibold text-[#1A1814]">
            {session.user.name}
          </h1>
          {/* <p className="text-sm text-[#A39E99] mt-0.5">{session.user.email}</p> */}
          {bio && (
            <p className="text-sm text-[#6B6560] mt-2 text-center max-w-xs">
              {bio}
            </p>
          )}
          <Link
            href="/profile/edit"
            className="mt-3 px-4 py-1.5 text-xs font-medium border border-[#E8E4E0] rounded-full text-[#6B6560] hover:bg-[#E8E4E0] transition-colors"
          >
            プロフィールを編集
          </Link>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-6 border-b border-[#E8E4E0] mb-6">
          <button
            onClick={() => setTab("posts")}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === "posts"
                ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px"
                : "text-[#A39E99] hover:text-[#6B6560]"
            }`}
          >
            投稿
          </button>
          <button
            onClick={() => setTab("videos")}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === "videos"
                ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px"
                : "text-[#A39E99] hover:text-[#6B6560]"
            }`}
          >
            動画
          </button>
          <button
            onClick={() => setTab("likes")}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === "likes"
                ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px"
                : "text-[#A39E99] hover:text-[#6B6560]"
            }`}
          >
            いいね
          </button>
          <button
            onClick={() => setTab("albums")}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === "albums"
                ? "border-b-2 border-[#2C2416] text-[#2C2416] -mb-px"
                : "text-[#AFA495] hover:text-[#7A6E5F]"
            }`}
          >
            アルバム
          </button>
        </div>

        {/* 投稿・いいねタブ */}
        {(tab === "posts" || tab === "likes") && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(tab === "posts" ? pins : likedPins).map((pin) => (
                <PinCard
                  key={pin.id}
                  imageUrl={pin.imageUrl}
                  title={pin.title}
                  username={pin.username}
                  height={pin.height}
                  pinId={pin.id}
                  isOwner={tab === "posts"}
                  userId={pin.userId}
                />
              ))}
            </div>
            {(tab === "posts" ? pins : likedPins).length === 0 && (
              <p className="text-center text-[#A39E99] text-sm mt-8">
                {tab === "posts"
                  ? "まだ投稿がありません"
                  : "まだいいねがありません"}
              </p>
            )}
          </>
        )}

        {/* 動画タブ */}
        {tab === "videos" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/video`)}
                >
                  {video.imageUrl ? (
                    <img
                      src={video.imageUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  {video.title && (
                    <p className="absolute bottom-2 left-2 text-white text-xs font-medium line-clamp-2">
                      {video.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {videos.length === 0 && (
              <p className="text-center text-[#A39E99] text-sm mt-8">
                まだ動画がありません
              </p>
            )}
          </>
        )}

        {/* アルバムタブ */}
        {tab === "albums" && (
          <div>
            {/* タイムライン */}
            <p className="text-[10px] text-[#AFA495] tracking-widest uppercase mb-3">
              タイムライン
            </p>
            <div className="h-px bg-[#DDD5C4] mb-6" />
            {Object.keys(timeline).length === 0 ? (
              <p className="text-center text-[#AFA495] text-sm mb-8">
                まだ記録がありません
              </p>
            ) : (
              Object.keys(timeline)
                .map(Number)
                .sort((a, b) => b - a)
                .map((year) => (
                  <div key={year} className="mb-8">
                    <p className="text-sm text-[#AFA495] font-serif mb-3">
                      {year}
                    </p>
                    <div
                      className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {timeline[year].map((m, i) => {
                        const bookColors = [
                          { bg: "#EDE8DC", spine: "#DDD5C4" },
                          { bg: "#E8E2D8", spine: "#C9BFB5" },
                          { bg: "#E4DDD3", spine: "#C4BAB0" },
                          { bg: "#E0D9CF", spine: "#BFB5AB" },
                          { bg: "#DDD6CC", spine: "#BDB3A9" },
                        ];
                        const color = bookColors[i % bookColors.length];
                        return (
                          <div
                            key={`${year}-${m.month}`}
                            className="flex-shrink-0 cursor-pointer"
                            style={{ width: 88 }}
                            onClick={() => {
                              console.log("タップ", year, m.month);
                              router.push(`/album/timeline/${year}/${m.month}`);
                            }}
                          >
                            <div
                              className="relative overflow-hidden"
                              style={{
                                width: 88,
                                height: 116,
                                borderRadius: "2px 8px 8px 2px",
                                background: color.bg,
                                boxShadow:
                                  "-3px 3px 8px rgba(44,36,22,0.15), inset -2px 0 4px rgba(44,36,22,0.08)",
                              }}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 8,
                                  background: color.spine,
                                }}
                              />
                              {m.thumbnail ? (
                                <img
                                  src={m.thumbnail}
                                  alt=""
                                  style={{
                                    position: "absolute",
                                    left: 8,
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    width: "calc(100% - 8px)",
                                    height: "100%",
                                    objectFit: "cover",
                                    opacity: 0.85,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    position: "absolute",
                                    left: 8,
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 24,
                                  }}
                                >
                                  🐾
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-[#2C2416] font-serif text-center mt-2">
                              {m.month}月
                            </p>
                            <p className="text-[9px] text-[#AFA495] text-center mt-0.5">
                              {m.count}件
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
            {/* カスタムアルバム */}
            <p className="text-[10px] text-[#AFA495] tracking-widest uppercase mb-3 mt-8">
              マイアルバム
            </p>
            <div className="h-px bg-[#DDD5C4] mb-6" />
            <div className="grid grid-cols-2 gap-5">
              {customAlbums.map((album, i) => {
                const bookColors = [
                  { bg: "#EDE8DC", spine: "#DDD5C4" },
                  { bg: "#E8E2D8", spine: "#C9BFB5" },
                  { bg: "#E4DDD3", spine: "#C4BAB0" },
                  { bg: "#E0D9CF", spine: "#BFB5AB" },
                  { bg: "#DDD6CC", spine: "#BDB3A9" },
                ];
                const color = bookColors[i % bookColors.length];
                const thumbnail =
                  album.pins?.[0]?.pin?.imageUrl ||
                  album.pins?.[0]?.pin?.videoUrl;
                return (
                  <div
                    key={album.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/album/custom/${album.id}`)}
                  >
                    <div
                      className="relative overflow-hidden w-full"
                      style={{
                        aspectRatio: "3/4",
                        borderRadius: "2px 12px 12px 2px",
                        background: color.bg,
                        boxShadow:
                          "-4px 4px 12px rgba(44,36,22,0.15), inset -3px 0 6px rgba(44,36,22,0.08)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 12,
                          background: color.spine,
                        }}
                      />
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt=""
                          style={{
                            position: "absolute",
                            left: 12,
                            top: 0,
                            right: 0,
                            bottom: 40,
                            width: "calc(100% - 12px)",
                            height: "calc(100% - 40px)",
                            objectFit: "cover",
                            opacity: 0.85,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: "absolute",
                            left: 12,
                            top: 0,
                            right: 0,
                            bottom: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 36,
                          }}
                        >
                          🐾
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 12,
                          right: 0,
                          height: 40,
                          background: "#F5F0E8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 8px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 10,
                            color: "#2C2416",
                            textAlign: "center",
                            fontFamily: "Georgia, serif",
                            lineHeight: 1.3,
                          }}
                        >
                          {album.title}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#2C2416] font-serif mt-2 pl-3">
                      {album.title}
                    </p>
                    <p className="text-[10px] text-[#AFA495] mt-0.5 pl-3">
                      {album.pins?.length}件
                    </p>
                  </div>
                );
              })}

              {/* 新しいアルバム */}
              <div
                className="cursor-pointer"
                onClick={() => router.push("/album/create")}
              >
                <div
                  className="w-full border border-dashed border-[#C4BAB0] flex flex-col items-center justify-center gap-2"
                  style={{
                    aspectRatio: "3/4",
                    borderRadius: "2px 12px 12px 2px",
                  }}
                >
                  <div className="w-8 h-8 rounded-full border border-[#C4BAB0] flex items-center justify-center">
                    <span className="text-[#AFA495] text-lg">+</span>
                  </div>
                  <p className="text-[11px] text-[#AFA495]">新しいアルバム</p>
                </div>
                <p className="text-xs text-[#AFA495] font-serif mt-2 pl-3">
                  新しいアルバム
                </p>
              </div>
            </div>{" "}
          </div>
        )}
      </div>
    </div>
  );
}
