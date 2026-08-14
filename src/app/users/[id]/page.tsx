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

export default function UserProfilePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [userName, setUserName] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatus, setFollowStatus] = useState<
    "none" | "pending" | "accepted"
  >("none");
  const [isBlocked, setIsBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 自分自身か、承認済みフォロワーなら中身が見える
  const canViewContent =
    !isPrivateAccount || session?.user?.id === id || followStatus === "accepted";

  // メニューの外をクリックしたら閉じる
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

    // 対象ユーザーの鍵垢設定を取得
    fetch(`/api/settings?userId=${id}`)
      .then((res) => res.json())
      .then((data) => setIsPrivateAccount(!!data?.isPrivate));

    // ピン取得（viewerIdを渡し、サーバー側で公開範囲を絞り込む）
    const viewerParam = session?.user?.id
      ? `&viewerId=${session.user.id}`
      : "";
    fetch(`/api/pins?${viewerParam}`)
      .then((res) => res.json())
      .then((data) => {
        const userPins = data
          .filter((pin: any) => pin.userId === id)
          .map((pin: any) => ({
            id: pin.id,
            imageUrl: pin.imageUrl,
            title: pin.title,
            username: pin.user?.name ?? "unknown",
            height: 200 + Math.floor(Math.random() * 200),
            category: pin.category ?? "その他",
            userId: pin.userId,
          }));
        setPins(userPins);
        if (userPins.length > 0) setUserName(userPins[0].username);
      });

    if (session?.user?.id) {
      // フォロー状態確認
      fetch(`/api/follow?followerId=${session.user.id}&followingId=${id}`)
        .then((res) => res.json())
        .then((data) => {
          setIsFollowing(data.following);
          setFollowStatus(data.status ?? "none");
        });

      // ブロック状態確認
      fetch(`/api/block?blockerId=${session.user.id}&blockedId=${id}`)
        .then((res) => res.json())
        .then((data) => setIsBlocked(data.blocked));
    }
  }, [id, session]);

  // フォロー・アンフォロー
  const handleFollow = async () => {
    if (!session?.user?.id) return;

    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerId: session.user.id,
        followingId: id,
      }),
    });
    const data = await res.json();
    setIsFollowing(data.following);
    setFollowStatus(data.following ? data.status : "none");
  };

  // DM
  const handleDM = async () => {
    if (!session?.user?.id) return;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        targetUserId: id,
        isGroup: false,
      }),
    });
    const room = await res.json();
    router.push(`/chat/${room.id}`);
  };

  // ブロック・アンブロック
  const handleBlock = async () => {
    if (!session?.user?.id) return;
    if (
      !confirm(
        isBlocked
          ? "ブロックを解除しますか？"
          : "このユーザーをブロックしますか？",
      )
    )
      return;

    const res = await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blockerId: session.user.id,
        blockedId: id,
      }),
    });
    const data = await res.json();
    setIsBlocked(data.blocked);
    setMenuOpen(false);

    // ブロックしたらフォロー状態もリセット
    if (data.blocked) {
      setIsFollowing(false);
      setFollowStatus("none");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 右上の3点メニュー */}
        {session && session.user.id !== id && (
          <div className="flex justify-end mb-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-[#E8E4E0] transition-colors relative"
            >
              <MoreHorizontal className="h-5 w-5 text-[#6B6560]" />
            </button>
            {menuOpen && (
              <div className="absolute mt-10 bg-white border border-[#E8E4E0] rounded-xl shadow-lg w-40 z-50">
                <button
                  onClick={handleBlock}
                  className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-colors ${
                    isBlocked
                      ? "text-[#6B6560] hover:bg-[#F7F5F3]"
                      : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  {isBlocked ? "ブロック解除" : "ブロック"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="h-20 w-20 rounded-full bg-[#1A1814] flex items-center justify-center text-white text-2xl font-bold mb-3">
            {userName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <h1 className="text-xl font-semibold text-[#1A1814]">{userName}</h1>

          {session && session.user.id !== id && (
            <div className="flex gap-2 mt-3 items-center">
              {/* フォローボタン */}
              {!isBlocked && (
                <button
                  onClick={handleFollow}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    followStatus === "pending"
                      ? "bg-[#E8E4E0] text-[#6B6560]"
                      : isFollowing
                        ? "bg-[#E8E4E0] text-[#6B6560] hover:bg-[#d4cfc9]"
                        : "bg-[#1A1814] text-white hover:bg-[#3D3830]"
                  }`}
                >
                  {followStatus === "pending"
                    ? "リクエスト済み"
                    : isFollowing
                      ? "フォロー中"
                      : "フォローする"}
                </button>
              )}

              {/* メッセージボタン */}
              {!isBlocked && (
                <button
                  onClick={handleDM}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#E8E4E0] text-[#6B6560] hover:bg-[#d4cfc9] transition-colors"
                >
                  メッセージ
                </button>
              )}
            </div>
          )}
        </div>

        {/* ブロック中は投稿を非表示 */}
        {isBlocked ? (
          <p className="text-center text-[#A39E99] text-sm mt-8">
            このユーザーをブロックしています
          </p>
        ) : !canViewContent ? (
          <div className="text-center mt-8">
            <p className="text-[#A39E99] text-sm mb-1">
              このアカウントは非公開です
            </p>
            <p className="text-[#C4BAB0] text-xs">
              フォローが承認されると投稿が見れるようになります
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pins.map((pin) => (
              <PinCard
                key={pin.id}
                imageUrl={pin.imageUrl}
                title={pin.title}
                username={pin.username}
                height={pin.height}
                pinId={pin.id}
                isOwner={false}
                userId={pin.userId}
              />
            ))}
            {pins.length === 0 && (
              <p className="col-span-3 text-center text-[#A39E99] text-sm mt-8">
                まだ投稿がありません
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}