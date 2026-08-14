"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { X, Plus, ChevronLeft } from "lucide-react";

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
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/settings?userId=${session.user.id}`)
      .then((res) => res.json())
      .then((data) => setIsPublic(data?.defaultPostVisibility ?? true));
  }, [session]);

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 100 * 1024 * 1024) {
        setError("ファイルサイズは100MB以下にしてください");
        return;
      }
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("dropped!", e.dataTransfer.files);
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 100 * 1024 * 1024) {
        setError("ファイルサイズは100MB以下にしてください");
        return;
      }
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearPreview = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
  };

  const handleSavePin = async () => {
    if (!selectedFile) {
      setError("画像を選択してください");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );
      formData.append("quality", "auto");
      formData.append("fetch_format", "auto");
      setUploadProgress(25);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      setUploadProgress(75);
      if (!cloudinaryRes.ok) throw new Error("アップロードに失敗しました");

      const cloudinaryData = await cloudinaryRes.json();
      const imageUrl = cloudinaryData.secure_url;
      setUploadProgress(100);

      await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          category: tags.join(","),
          userId: session?.user?.id,
          isPublic,
        }),
      });

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_TAGS = [
    "散歩",
    "ごはん",
    "お昼寝",
    "遊び",
    "成長記録",
    "お出かけ",
    "病院",
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-24">
      <div className="max-w-lg mx-auto px-6 py-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-[#7A6E5F] hover:text-[#2C2416] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            戻る
          </button>
          <p className="text-xs text-[#AFA495]">
            {new Date().toLocaleDateString("ja-JP", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </p>
          <button
            onClick={handleSavePin}
            disabled={loading || !selectedFile}
            className="px-4 py-1.5 bg-[#2C2416] text-[#F5F0E8] text-sm font-medium rounded-full hover:bg-[#483C2A] transition-colors disabled:opacity-40"
          >
            {loading ? "保存中..." : "残す"}
          </button>
        </div>

        {/* 公開設定 */}
        <button
          onClick={() => setIsPublic(!isPublic)}
          className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-[#DDD5C4] text-[#7A6E5F] hover:bg-[#EDE8DC] transition-colors"
        >
          {isPublic ? "🌐 公開" : "🔒 非公開"}
        </button>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-500 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* 画像アップロード（フィルム風） */}
        {preview ? (
          <div className="relative mb-4">
            <div className="bg-[#2C2416] px-2 py-1.5 rounded-t-2xl flex justify-between">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-3.5 h-2.5 bg-[#F5F0E8]/20 rounded-sm"
                />
              ))}
            </div>
            <div className="relative bg-[#2C2416] px-2">
              <img
                src={preview}
                alt="Preview"
                className="w-full object-cover max-h-80"
              />
              <button
                onClick={clearPreview}
                className="absolute top-2 right-4 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5 text-[#2C2416]" />
              </button>
            </div>
            <div className="bg-[#2C2416] px-2 py-1.5 rounded-b-2xl flex justify-between">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-3.5 h-2.5 bg-[#F5F0E8]/20 rounded-sm"
                />
              ))}
            </div>
            {loading && uploadProgress > 0 && (
              <div className="mt-2 bg-[#DDD5C4] rounded-full overflow-hidden">
                <div
                  className="bg-[#2C2416] h-1 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            style={{ position: "relative", zIndex: 10 }}
            className={`block mb-4 cursor-pointer transition-colors ${dragActive ? "opacity-80" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <div className="bg-[#2C2416] px-2 py-1.5 rounded-t-2xl flex justify-between">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-3.5 h-2.5 bg-[#F5F0E8]/20 rounded-sm"
                />
              ))}
            </div>
            <div className="bg-[#2C2416] px-2 py-10 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 bg-[#F5F0E8]/10 rounded-xl border-2 border-[#F5F0E8]/20 flex items-center justify-center">
                  <span className="text-3xl">🐾</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#C9A96E] rounded-full flex items-center justify-center">
                  <Plus className="h-3.5 w-3.5 text-[#2C2416]" />
                </div>
              </div>
              <p className="text-[#F5F0E8]/80 text-sm font-medium">
                アルバムから選ぶ
              </p>
              <p className="text-[#F5F0E8]/40 text-xs">
                またはドラッグ&ドロップ
              </p>
            </div>
            <div className="bg-[#2C2416] px-2 py-1.5 rounded-b-2xl flex justify-between">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="w-3.5 h-2.5 bg-[#F5F0E8]/20 rounded-sm"
                />
              ))}
            </div>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* キャプション */}
        <div className="mb-4">
          <p className="text-xs text-[#AFA495] mb-1.5 font-medium">
            今日のひとこと
          </p>
          <textarea
            placeholder="この瞬間、どんなことを感じましたか？"
            className="w-full bg-[#EDE8DC] border border-[#DDD5C4] rounded-xl px-4 py-3 text-sm text-[#2C2416] placeholder:text-[#C4BAB0] focus:outline-none focus:border-[#BFB39E] resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* タイトル */}
        <div className="mb-4">
          <p className="text-xs text-[#AFA495] mb-1.5 font-medium">
            タイトル（任意）
          </p>
          <input
            type="text"
            placeholder="思い出のタイトル"
            className="w-full bg-[#EDE8DC] border border-[#DDD5C4] rounded-xl px-4 py-3 text-sm text-[#2C2416] placeholder:text-[#C4BAB0] focus:outline-none focus:border-[#BFB39E]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* タグ */}
        <div>
          <p className="text-xs text-[#AFA495] mb-2 font-medium">
            思い出のタグ
          </p>
          <div className="flex gap-2 flex-wrap mb-3">
            {DEFAULT_TAGS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  if (!tags.includes(cat)) setTags([...tags, cat]);
                  else setTags(tags.filter((t) => t !== cat));
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  tags.includes(cat)
                    ? "bg-[#2C2416] text-[#F5F0E8]"
                    : "bg-[#EDE8DC] text-[#7A6E5F] border border-[#DDD5C4]"
                }`}
              >
                #{cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="#オリジナルタグ"
              className="flex-1 bg-[#EDE8DC] border border-[#DDD5C4] rounded-xl px-4 py-2.5 text-sm text-[#2C2416] placeholder:text-[#C4BAB0] focus:outline-none focus:border-[#BFB39E]"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  customTag.trim() &&
                  !tags.includes(customTag.trim())
                ) {
                  setTags([...tags, customTag.trim()]);
                  setCustomTag("");
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (customTag.trim() && !tags.includes(customTag.trim())) {
                  setTags([...tags, customTag.trim()]);
                  setCustomTag("");
                }
              }}
              className="px-4 py-2.5 bg-[#EDE8DC] border border-[#DDD5C4] text-[#7A6E5F] text-sm rounded-xl hover:bg-[#DDD5C4] transition-colors"
            >
              追加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
