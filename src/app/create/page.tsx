"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, PawPrint } from "lucide-react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";

const PET_TAGS = ["散歩", "ごはん", "お昼寝", "遊び", "成長記録", "お出かけ", "病院", "お風呂"];

function todayLabel(): string {
  const d = new Date();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
}

export default function CreatePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルサイズは10MB以下にしてください");
      return;
    }
    setSelectedFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setCustomTag("");
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError("写真を選んでください");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      setUploadProgress(25);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      setUploadProgress(75);
      if (!cloudRes.ok) throw new Error("アップロードに失敗しました");

      const cloudData = await cloudRes.json();
      setUploadProgress(95);

      await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl: cloudData.secure_url,
          category: tags.join(","),
          userId: session?.user?.id,
        }),
      });

      setUploadProgress(100);
      router.push("/");
      router.refresh();
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main min-h-screen bg-[#F5F0E8]">
        <div className="max-w-2xl mx-auto px-6 py-8">

          {/* Page header */}
          <header className="mb-7">
            <p className="text-xs text-[#AFA495] tracking-widest uppercase mb-1 font-medium">
              {todayLabel()}
            </p>
            <h1 className="font-serif text-2xl font-semibold text-[#2C2416]">
              今日の思い出を残す
            </h1>
            <p className="text-sm text-[#AFA495] mt-1">
              この瞬間は、きっといつか大切な記憶になります。
            </p>
          </header>

          {/* Divider */}
          <div className="h-px bg-[#DDD5C4] mb-7" />

          {error && (
            <div className="mb-5 px-4 py-3 bg-[#EDE8DC] border border-[#DDD5C4] rounded-xl text-sm text-[#2C2416]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-6">

            {/* ── Photo upload ────────────────── */}
            {preview ? (
              <div className="relative photo-frame rounded-sm">
                <img
                  src={preview}
                  alt="プレビュー"
                  className="w-full h-auto rounded-[1px] block"
                />
                <button
                  onClick={() => { setSelectedFile(null); setPreview(null); setUploadProgress(0); }}
                  aria-label="写真を変更する"
                  className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-[#2C2416]" />
                </button>
                {loading && uploadProgress > 0 && (
                  <div className="absolute bottom-8 left-1 right-1 bg-[#EDE8DC] rounded-full overflow-hidden h-0.5">
                    <div
                      className="bg-[#C9A96E] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <label
                className={`relative block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-[#C9A96E] bg-[#EDE8DC]"
                    : "border-[#DDD5C4] bg-[#FDFAF4] hover:border-[#BFB39E] hover:bg-[#EDE8DC]"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                  aria-label="写真を選択"
                />
                <ImagePlus
                  className="h-10 w-10 mx-auto mb-3 text-[#BFB39E]"
                  strokeWidth={1.25}
                />
                <p className="text-sm text-[#7A6E5F] font-medium mb-1">
                  写真をドロップ、またはクリックして選択
                </p>
                <p className="text-xs text-[#AFA495]">
                  jpg / png / heic — 10MB以下
                </p>
              </label>
            )}

            {/* ── Title ───────────────────────── */}
            <div>
              <label htmlFor="memory-title" className="block text-xs font-medium text-[#7A6E5F] mb-2">
                タイトル（任意）
              </label>
              <input
                id="memory-title"
                type="text"
                placeholder="例：初めてのお散歩"
                className="w-full px-4 py-3 border border-[#DDD5C4] rounded-xl text-sm bg-[#FDFAF4] text-[#2C2416] placeholder:text-[#BFB39E] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-colors font-serif italic"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* ── Memo ────────────────────────── */}
            <div>
              <label htmlFor="memory-memo" className="block text-xs font-medium text-[#7A6E5F] mb-2">
                今日のメモ（任意）
              </label>
              <textarea
                id="memory-memo"
                placeholder="この瞬間、どんなことを感じましたか？"
                className="w-full px-4 py-3 border border-[#DDD5C4] rounded-xl text-sm bg-[#FDFAF4] text-[#2C2416] placeholder:text-[#BFB39E] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-colors resize-none leading-relaxed"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* ── Tags ────────────────────────── */}
            <div>
              <label className="block text-xs font-medium text-[#7A6E5F] mb-2">
                思い出のタグ
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      tags.includes(tag)
                        ? "bg-[#2C2416] text-[#F5F0E8] border-[#2C2416]"
                        : "bg-transparent text-[#7A6E5F] border-[#DDD5C4] hover:border-[#BFB39E] hover:text-[#2C2416]"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Custom tag input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="オリジナルタグを追加..."
                  className="flex-1 px-3.5 py-2.5 border border-[#DDD5C4] rounded-xl text-sm bg-[#FDFAF4] text-[#2C2416] placeholder:text-[#BFB39E] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-colors"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) addCustomTag();
                  }}
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-4 py-2.5 bg-[#EDE8DC] text-[#7A6E5F] text-xs font-medium rounded-xl hover:bg-[#DDD5C4] hover:text-[#2C2416] transition-colors"
                >
                  追加
                </button>
              </div>

              {/* Selected tags */}
              {tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2.5">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#2C2416]/8 border border-[#BFB39E] rounded-full text-xs text-[#2C2416]"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        aria-label={`${tag}タグを削除`}
                        className="ml-0.5 text-[#AFA495] hover:text-[#2C2416] transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Save button ─────────────────── */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={loading || !selectedFile}
                className="w-full py-3.5 bg-[#2C2416] text-[#F5F0E8] text-sm font-medium rounded-xl hover:bg-[#483C2A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-[#F5F0E8] border-t-transparent rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <PawPrint className="h-4 w-4 text-[#C9A96E]" strokeWidth={1.75} />
                    思い出帳に残す
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-2.5 text-sm text-[#AFA495] hover:text-[#7A6E5F] transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
