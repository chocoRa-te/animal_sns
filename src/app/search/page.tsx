"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Search, Play, X } from "lucide-react";

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

  const handleSearch = async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setIsSearched(true);

    try {
      const res = await fetch(`/api/pins?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsSearched(false);
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => setResults(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">検索</h1>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="キーワード・タグ・ユーザー名で検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSearch();
              }}
              autoFocus
              className="w-full border border-[var(--border)] rounded-full px-4 py-2.5 pr-10 text-sm bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="クリア"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSearch()}
            className="p-2.5 bg-[var(--accent)] rounded-full hover:bg-[var(--accent-hover)] transition-colors"
            aria-label="検索"
          >
            <Search className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Result heading — correctly inside return */}
        {!loading && (
          <p className="text-xs text-[var(--text-muted)] mb-4">
            {isSearched
              ? `「${query}」の検索結果 ${results.length}件`
              : `最新の投稿 ${results.length}件`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-[var(--border)] animate-pulse rounded-sm" />
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && results.length === 0 && isSearched && (
          <p className="text-center text-[var(--text-muted)] text-sm py-12">
            「{query}」に一致する投稿がありません
          </p>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-3 gap-0.5">
            {results.map((pin) => (
              <div
                key={pin.id}
                className="relative aspect-square bg-[var(--border)] cursor-pointer overflow-hidden group"
                onClick={() => {
                  if (pin.type === "video") {
                    router.push(`/pins/${pin.id}`);
                  } else {
                    router.push(`/pins/${pin.id}`);
                  }
                }}
              >
                {pin.imageUrl ? (
                  <img
                    src={pin.imageUrl}
                    alt={pin.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : pin.videoUrl ? (
                  <video
                    src={pin.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : null}

                {/* Video indicator */}
                {pin.type === "video" && (
                  <div className="absolute top-1.5 right-1.5">
                    <Play
                      className="h-4 w-4 text-white drop-shadow-lg"
                      fill="white"
                    />
                  </div>
                )}

                {/* Hover title overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end pointer-events-none">
                  <p className="text-white text-xs font-medium px-2 pb-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {pin.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
