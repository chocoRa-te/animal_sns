"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Search, Play } from "lucide-react";

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

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setIsSearched(true);

    try {
    const res = await fetch(`/api/pins?search=${query}`);
    const data = await res.json();
    setResults(data);
    }catch (err){
      console.error(err)
      setResults([])
    }finally{
    setLoading(false);
  }
}

  useEffect(() => {
    // 検索前は最新投稿を表示
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, []);

  {/* 見出し */}
  {!loading && (
      <p className="text-xs text-[#A39E99] mb-3">
        {isSearched
          ? `「${query}」の検索結果 ${results.length}件`
          : "最新の投稿"}
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-[#1A1814] mb-4">検索</h1>

        {/* 検索欄 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="キーワード・タグ・ユーザー名で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 border border-[#E8E4E0] rounded-full px-4 py-2 text-sm bg-white focus:outline-none focus:border-[#A39E99] text-[#1A1814]"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-[#1A1814] rounded-full hover:bg-[#3D3830] transition-colors"
          >
            <Search className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* ローディング */}
        {loading && (
          <p className="text-center text-[#A39E99] text-sm">検索中...</p>
        )}

        {/* 検索結果 */}
        {!loading && results.length === 0 && query && (
          <p className="text-center text-[#A39E99] text-sm">結果がありません</p>
        )}

        <div className="grid grid-cols-3 gap-0.5">
          {results.map((pin) => (
            <div
              key={pin.id}
              className="relative aspect-square bg-[#E8E4E0] cursor-pointer overflow-hidden"
              onClick={() => {
                if (pin.type === "video") {
                  router.push("/video");
                } else {
                  router.push(`/pins/${pin.id}`);
                }
              }}
            >
              {/* サムネイル */}
              {pin.imageUrl ? (
                <img
                  src={pin.imageUrl}
                  alt={pin.title}
                  className="w-full h-full object-cover"
                />
              ) : pin.videoUrl ? (
                <video
                  src={pin.videoUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : null}

              {/* 動画マーク */}
              {pin.type === "video" && (
                <div className="absolute top-1 right-1">
                  <Play
                    className="h-4 w-4 text-white drop-shadow-lg"
                    fill="white"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
