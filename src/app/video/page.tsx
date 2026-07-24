"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import {
  Heart,
  MessageCircle,
  Plus,
  Play,
  Pause,
  VolumeX,
  Volume2,
} from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  category: string;
  userId: string;
  user: { name: string; image: string | null };
}

export default function VideoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [showIcon, setShowIcon] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false); // デフォルトは音あり

  // 動画投稿のみ取得
  useEffect(() => {
    fetch("/api/pins?type=video")
      .then((res) => res.json())
      .then((data) => setVideos(data));
  }, []);

  const currentVideo = videos[currentIndex];

  // いいね数を取得
  useEffect(() => {
    if (!currentVideo) return;
    fetch(`/api/likes?pinId=${currentVideo.id}`)
      .then((res) => res.json())
      .then((data) => setLikeCount(data.count));
    setLiked(false);
  }, [currentIndex, currentVideo]);

  //   useEffect(() => {
  //     if (videoRef.current) {
  //       videoRef.current.play().catch(() => {});
  //       setIsPlaying(true);
  //     }
  //   }, [currentIndex]);

  // スクロールで次の動画へ
  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // いいね
  const handleLike = async () => {
    if (!session?.user?.id || !currentVideo) return;
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId: currentVideo.id, userId: session.user.id }),
    });
    const data = await res.json();
    setLiked(data.liked);
    setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
  };

  // コメントを取得
  const fetchComments = async (pinId: string) => {
    const res = await fetch(`/api/pins/${pinId}`);
    const data = await res.json();
    setComments(data.comments ?? []);
  };

  // コメント送信
  const handleComment = async () => {
    if (!newComment.trim() || !session?.user?.id || !currentVideo) return;
    const res = await fetch(`/api/pins/${currentVideo.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment, userId: session.user.id }),
    });
    const comment = await res.json();
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  return (
    <div className="h-screen bg-black overflow-hidden" onWheel={handleScroll}>
      <Navbar />
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-white text-sm">まだ動画がありません</p>
          <button
            onClick={() => router.push("/video/upload")}
            className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium"
          >
            動画を投稿する
          </button>
        </div>
      ) : currentVideo ? (
        <div className="relative h-full flex items-center justify-center">
          {/* 動画 */}
          <video
            ref={videoRef}
            key={currentVideo.id}
            src={currentVideo.videoUrl}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onClick={() => {
              // シングルクリックかダブルクリックか判定するためにタイマーを使う
              if (clickTimer.current) {
                // ダブルクリックなのでタイマーをキャンセル（一時停止しない）
                clearTimeout(clickTimer.current);
                clickTimer.current = null;
                return;
              }
              clickTimer.current = setTimeout(() => {
                // シングルクリックの処理
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play();
                  }
                  setIsPlaying(!isPlaying);
                  setShowIcon(true);
                  setTimeout(() => setShowIcon(false), 800);
                }
                clickTimer.current = null;
              }, 250);
            }}
            onDoubleClick={async () => {
              if (!session?.user?.id || !currentVideo) return;

              // いいね処理
              const res = await fetch("/api/likes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pinId: currentVideo.id,
                  userId: session.user.id,
                }),
              });
              const data = await res.json();
              setLiked(data.liked);
              setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));

              // ハートアニメーション
              setShowHeart(true);
              setTimeout(() => setShowHeart(false), 1000);
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setProgress(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            }}
          />

          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

          {/* 一時停止・再生アイコン（一瞬表示） */}
          {showIcon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
                {isPlaying ? (
                  <Play className="h-8 w-8 text-white ml-1" />
                ) : (
                  <Pause className="h-8 w-8 text-white" />
                )}
              </div>
            </div>
          )}

          {/* ダブルタップいいねアニメーション */}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-24 w-24 text-red-500 fill-red-500 animate-ping" />
            </div>
          )}

          {/* ダブルタップいいねアニメーション */}
          {/* {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart
                className="h-24 w-24 text-red-500 fill-red-500"
                style={{
                  animation: "heartPop 0.8s ease-out forwards",
                }}
              />
            </div>
          )} */}

          {/* 右側アクション */}
          <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
            {/* いいね */}
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Heart
                  className={`h-5 w-5 ${liked ? "text-red-500 fill-red-500" : "text-white"}`}
                />
              </div>
              <span className="text-white text-xs">{likeCount}</span>
            </button>

            {/* ミュート切り替え */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </div>
            </button>

            {/* コメント */}
            <button
              onClick={() => {
                setShowComments(true);
                if (currentVideo) fetchComments(currentVideo.id);
              }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
            </button>
          </div>

          {/* シークバー */}
          <div className="absolute bottom-12 left-0 right-0 z-10 px-4">
            <input
              type="range"
              min={0}
              max={duration}
              value={progress}
              step={0.1}
              className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${(progress / duration) * 100}%, rgba(255,255,255,0.3) ${(progress / duration) * 100}%)`,
              }}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (videoRef.current) {
                  videoRef.current.currentTime = val;
                  setProgress(val);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 下部情報 */}
          <div className="absolute bottom-20 left-4 right-20">
            <p
              className="text-white font-semibold text-sm mb-1 cursor-pointer hover:underline"
              onClick={() => router.push(`/users/${currentVideo.userId}`)}
            >
              @{currentVideo.user?.name}
            </p>
            {currentVideo.title && (
              <p className="text-white text-sm mb-1">{currentVideo.title}</p>
            )}
            {currentVideo.description && (
              <p className="text-white/80 text-xs line-clamp-2">
                {currentVideo.description}
              </p>
            )}
            {currentVideo.category && (
              <div className="flex gap-1 flex-wrap mt-1">
                {currentVideo.category
                  .split(",")
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className="text-white/70 text-xs">
                      #{tag.trim()}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* インジケーター */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            {videos.map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all ${i === currentIndex ? "h-6 bg-white" : "h-2 bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* コメントパネル（下からスライド） */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* 背景タップで閉じる */}
          <div className="flex-1" onClick={() => setShowComments(false)} />
          <div className="bg-white rounded-t-2xl max-h-[70vh] flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E4E0]">
              <h2 className="text-sm font-semibold text-[#1A1814]">
                コメント {comments.length}
              </h2>
              <button
                onClick={() => setShowComments(false)}
                className="text-[#A39E99] text-lg"
              >
                ✕
              </button>
            </div>
            {/* コメント一覧 */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-[#A39E99] text-sm text-center mt-4">
                  まだコメントがありません
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {comment.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#1A1814]">
                        @{comment.user?.name}
                      </p>
                      <p className="text-sm text-[#6B6560]">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* コメント入力 */}
            {session && (
              <div className="flex gap-2 px-4 py-3 border-t border-[#E8E4E0]">
                <input
                  type="text"
                  placeholder="コメントを追加..."
                  className="flex-1 border border-[#E8E4E0] rounded-full px-4 py-2 text-sm bg-[#F7F5F3] focus:outline-none focus:border-[#A39E99]"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                />
                <button
                  onClick={handleComment}
                  className="bg-[#1A1814] text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-[#3D3830] transition-colors"
                >
                  送信
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 投稿ボタン */}
      <button
        onClick={() => router.push("/video/upload")}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#F7F5F3] transition-colors z-50"
      >
        <Plus className="h-6 w-6 text-[#1A1814]" />
      </button>
    </div>
  );
}
