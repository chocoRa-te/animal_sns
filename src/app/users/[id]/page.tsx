"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { PinCard } from "@/components/pins/PinCard";
import { MoreHorizontal } from "lucide-react";

interface Pin {
  id: string;
  imageUrl: string;
  title: string;
  username: string;
  height: number;
  category: string;
  userId: string;
}

interface UserInfo {
  id: string;
  name: string;
  bio?: string;
  image?: string | null;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<
    "none" | "pending" | "accepted"
  >("none");
  const [isBlocked, setIsBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!id) return;

    // Fetch user info directly (name/bio available even if no pins)
    fetch(`/api/users?query=&id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        const user = Array.isArray(data) ? data.find((u: any) => u.id === id) : null;
        if (user) setUserInfo(user);
      });

    // Pins
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const userPins = data
          .filter((pin: any) => pin.userId === id)
          .map((pin: any) => ({
            id: pin.id,
            imageUrl: pin.imageUrl,
            title: pin.title,
            username: pin.user?.name ?? "unknown",
            height: 200,
            category: pin.category ?? "その他",
            userId: pin.userId,
          }));
        setPins(userPins);
        // Fallback: set name from pins if user API didn't return it
        if (!userInfo && userPins.length > 0) {
          setUserInfo({ id: String(id), name: userPins[0].username });
        }
      });

    // Follower/following counts
    fetch(`/api/follow?userId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        setFollowerCount(data.followerCount ?? 0);
        setFollowingCount(data.followingCount ?? 0);
      });

    if (session?.user?.id) {
      fetch(`/api/follow?followerId=${session.user.id}&followingId=${id}`)
        .then((res) => res.json())
        .then((data) => {
          setIsFollowing(data.following);
          setFollowStatus(data.status ?? "none");
        });

      fetch(`/api/block?blockerId=${session.user.id}&blockedId=${id}`)
        .then((res) => res.json())
        .then((data) => setIsBlocked(data.blocked));
    }
  }, [id, session]);

  const handleFollow = async () => {
    if (!session?.user?.id) return;
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followerId: session.user.id, followingId: id }),
    });
    const data = await res.json();
    setIsFollowing(data.following);
    setFollowStatus(data.following ? data.status : "none");
    setFollowerCount((prev) => (data.following ? prev + 1 : Math.max(0, prev - 1)));
  };

  const handleDM = async () => {
    if (!session?.user?.id) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id, targetUserId: id, isGroup: false }),
    });
    const room = await res.json();
    router.push(`/chat/${room.id}`);
  };

  const handleBlock = async () => {
    if (!session?.user?.id) return;
    if (!confirm(isBlocked ? "ブロックを解除しますか？" : "このユーザーをブロックしますか？")) return;
    const res = await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockerId: session.user.id, blockedId: id }),
    });
    const data = await res.json();
    setIsBlocked(data.blocked);
    setMenuOpen(false);
    if (data.blocked) {
      setIsFollowing(false);
      setFollowStatus("none");
    }
  };

  const displayName = userInfo?.name ?? "...";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 3-dot menu */}
        {session && session.user.id !== id && (
          <div className="flex justify-end mb-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-[var(--border)] transition-colors relative"
              aria-label="オプション"
            >
              <MoreHorizontal className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
            {menuOpen && (
              <div className="absolute mt-10 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-40 z-50">
                <button
                  onClick={handleBlock}
                  className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${
                    isBlocked
                      ? "text-[var(--text-secondary)] hover:bg-[var(--background)]"
                      : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  {isBlocked ? "ブロック解除" : "ブロック"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 rounded-full bg-[var(--ink)] flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden">
            {userInfo?.image ? (
              <img src={userInfo.image} alt={`${displayName}のアバター`} className="w-full h-full object-cover" />
            ) : (
              displayName?.[0]?.toUpperCase() ?? "U"
            )}
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">{displayName}</h1>

          {/* Follower / following counts */}
          <div className="flex gap-6 mt-2">
            <div className="text-center">
              <p className="text-base font-bold text-[var(--text-primary)] leading-none">{followerCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">フォロワー</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-[var(--text-primary)] leading-none">{followingCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">フォロー中</p>
            </div>
          </div>

          {/* Bio */}
          {userInfo?.bio && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 text-center max-w-xs leading-relaxed">
              {userInfo.bio}
            </p>
          )}

          {session && session.user.id !== id && (
            <div className="flex gap-2 mt-4 items-center">
              {!isBlocked && (
                <button
                  onClick={handleFollow}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    followStatus === "pending"
                      ? "bg-[var(--border)] text-[var(--text-secondary)]"
                      : isFollowing
                        ? "bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[#d4cfc9]"
                        : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                  }`}
                >
                  {followStatus === "pending"
                    ? "リクエスト済み"
                    : isFollowing
                      ? "フォロー中"
                      : "フォローする"}
                </button>
              )}
              {!isBlocked && (
                <button
                  onClick={handleDM}
                  className="px-5 py-1.5 rounded-full text-sm font-medium bg-[var(--border)] text-[var(--text-secondary)] hover:bg-[#d4cfc9] transition-colors"
                >
                  メッセージ
                </button>
              )}
            </div>
          )}
        </div>

        {/* Posts */}
        {isBlocked ? (
          <p className="text-center text-[var(--text-muted)] text-sm mt-8">
            このユーザーをブロックしています
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pins.map((pin) => (
              <PinCard
                key={pin.id}
                imageUrl={pin.imageUrl}
                title={pin.title}
                username={pin.username}
                pinId={pin.id}
                isOwner={false}
                userId={pin.userId}
              />
            ))}
            {pins.length === 0 && (
              <p className="col-span-3 text-center text-[var(--text-muted)] text-sm mt-8">
                まだ投稿がありません
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
