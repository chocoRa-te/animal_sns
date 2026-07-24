"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";

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

  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("ファイルサイズは10MB以下にしてください");
        return;
      }
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ドラッグ&ドロップ処理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("ファイルサイズは10MB以下にしてください");
        return;
      }
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // プレビューをクリア
  const clearPreview = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
  };

  // ピンを保存
  const handleSavePin = async () => {
    if (!selectedFile) {
      setError("画像を選択してください");
      return;
    }
    // if (!title.trim()) {
    //   setError("タイトルを入力してください");
    //   return;
    // }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      // Cloudinaryに画像をアップロード
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );
      setUploadProgress(25);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      setUploadProgress(75);

      if (!cloudinaryRes.ok)
        throw new Error("画像のアップロードに失敗しました");

      const cloudinaryData = await cloudinaryRes.json();
      const imageUrl = cloudinaryData.secure_url;
      setUploadProgress(100);

      // DBに保存
      await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageUrl,
          category: tags.join(","), // カンマ区切りで保存
          userId: session?.user?.id,
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

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-xl font-semibold mb-6 text-[#1A1814]">
          投稿を作成
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* 画像アップロード */}
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto rounded-xl object-cover"
              />
              <button
                onClick={clearPreview}
                className="absolute top-2 right-2 px-3 py-1 bg-white text-[#1A1814] text-xs font-medium rounded-full shadow-sm hover:bg-[#F7F5F3] transition-colors"
              >
                変更
              </button>
              {loading && uploadProgress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#E8E4E0] rounded-b-xl overflow-hidden">
                  <div
                    className="bg-[#1A1814] h-1 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? "border-[#1A1814] bg-[#E8E4E0]"
                  : "border-[#E8E4E0] bg-white"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-[#A39E99]" />
              <p className="text-sm text-[#6B6560] mb-1">
                画像をドラッグ&ドロップ
              </p>
              <p className="text-xs text-[#A39E99] mb-4">または</p>
              <label className="bg-[#1A1814] hover:bg-[#3D3830] text-white px-4 py-2 rounded-full cursor-pointer text-sm font-medium transition-colors">
                デバイスから選択
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
              <p className="mt-3 text-xs text-[#A39E99]">
                推奨: 高画質の .jpg ファイル、10MB以下
              </p>
            </div>
          )}

          {/* タイトル */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">
              タイトル
            </label>
            <input
              type="text"
              placeholder="タイトルを入力"
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A39E99] text-[#1A1814]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">
              説明（任意）
            </label>
            <textarea
              placeholder="説明を入力"
              className="w-full border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A39E99] text-[#1A1814] resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* タグ */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[#A39E99] uppercase tracking-wide">
              タグ
            </label>

            {/* デフォルトタグ */}
            <p className="text-xs text-[#A39E99] mb-2">デフォルト</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {["自然", "料理", "インテリア", "旅行"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (!tags.includes(cat)) {
                      setTags([...tags, cat]);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${
                    tags.includes(cat)
                      ? "bg-[#1A1814]/20 text-[#1A1814] border border-[#1A1814]/30"
                      : "bg-[#E8E4E0] text-[#6B6560] hover:bg-[#1A1814] hover:text-white"
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>

            {/* 選択中タグ */}
            {tags.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-[#A39E99] mb-2">選択中</p>
                <div className="flex gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-[#1A1814]/10 border border-[#1A1814]/20 rounded-sm text-xs text-[#1A1814]"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* オリジナルタグ入力 */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="オリジナルタグを入力..."
                className="flex-1 border border-[#E8E4E0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#A39E99] text-[#1A1814]"
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
                className="px-3 py-2 bg-[#E8E4E0] text-[#6B6560] text-xs font-medium rounded-lg hover:bg-[#1A1814] hover:text-white transition-colors"
              >
                追加
              </button>
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSavePin}
            disabled={loading}
            className="w-full py-2.5 bg-[#1A1814] text-white rounded-lg text-sm font-medium hover:bg-[#3D3830] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                保存中...
              </span>
            ) : (
              "投稿する"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
