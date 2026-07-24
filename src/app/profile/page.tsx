"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { PinCard } from "@/components/pins/PinCard";
import Link from "next/link";

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

        setAlbums(Object.values(albumMap));
      });
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7F5F3]">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-[#6B6560]">ログインしてください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
          <p className="text-sm text-[#A39E99] mt-0.5">{session.user.email}</p>
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
                ? "border-b-2 border-[#1A1814] text-[#1A1814] -mb-px"
                : "text-[#A39E99] hover:text-[#6B6560]"
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
          <div className="flex flex-col gap-4">
            {albums.length === 0 ? (
              <p className="text-center text-[#A39E99] text-sm mt-8">
                タグをつけて投稿するとアルバムが作成されます
              </p>
            ) : (
              albums.map((album) => (
                <div
                  key={album.tag}
                  className="bg-white rounded-xl border border-[#E8E4E0] p-4 cursor-pointer hover:bg-[#F7F5F3] transition-colors"
                  onClick={() =>
                    router.push(`/album/${encodeURIComponent(album.tag)}`)
                  }
                >
                  <div className="flex-1 mb-3">
                    <h2 className="font-medium text-[#1A1814]">#{album.tag}</h2>
                    <p className="text-xs text-[#A39E99] mt-0.5">
                      📷 {album.photoCount}枚　🎥 {album.videoCount}本
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                    {album.thumbnails.map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-[#E8E4E0] overflow-hidden"
                      >
                        {url &&
                          (url.includes(".mp4") ||
                          url.includes(".mov") ||
                          url.includes("video") ? (
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img
                              src={url}
                              alt={album.tag}
                              className="w-full h-full object-cover"
                            />
                          ))}
                      </div>
                    ))}
                    {Array.from({ length: 3 - album.thumbnails.length }).map(
                      (_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square bg-[#E8E4E0]"
                        />
                      ),
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
