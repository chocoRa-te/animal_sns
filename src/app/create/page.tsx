"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera, X, ChevronLeft, PawPrint, Check,
  ImagePlus, ArrowRight,
} from "lucide-react";

/* ─── Helpers ─────────────────────────────────────────────── */
const PET_TAGS = ["散歩", "ごはん", "お昼寝", "遊び", "成長記録", "お出かけ", "病院", "お風呂"];

function todayFormatted() {
  const d = new Date();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return {
    full: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${wd}）`,
    monthDay: `${d.getMonth() + 1}月${d.getDate()}日`,
    weekday: `${wd}曜日`,
  };
}

/* One rotating prompt per day (deterministic from date) */
const PROMPTS = [
  "今日のあの顔、残しておこう。",
  "小さな瞬間が、一番愛おしい。",
  "この子がいてくれるだけで、今日はいい日。",
  "いつか必ず、宝物になる日が来る。",
  "一枚の写真が、記憶をずっと守ってくれる。",
  "今日も元気でいてくれた。それだけで十分。",
  "この瞬間を、未来の自分へ。",
];
function todayPrompt() {
  const d = new Date();
  const idx = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate()) % PROMPTS.length;
  return PROMPTS[idx];
}

/* ─── Component ───────────────────────────────────────────── */
export default function CreatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* state */
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* Step tracking — photo must come first */
  const hasPhoto = !!preview;

  const date = todayFormatted();

  /* ── File handling ── */
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("画像ファイルを選んでください"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("10MB以下の画像を選んでください"); return; }
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
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type !== "dragleave" && e.type !== "drop");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  /* ── Tags ── */
  const toggleTag = (tag: string) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const addCustomTag = () => {
    const t = customTag.trim();
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setCustomTag(""); }
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!selectedFile) { setError("写真を選んでください"); return; }
    try {
      setLoading(true); setError(null); setProgress(10);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      setProgress(30);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      setProgress(70);
      if (!cloudRes.ok) throw new Error("アップロードに失敗しました");
      const cloudData = await cloudRes.json();
      setProgress(85);

      await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: memo,
          imageUrl: cloudData.secure_url,
          category: tags.join(","),
          userId: session?.user?.id,
        }),
      });

      setProgress(100);
      setDone(true);
      setTimeout(() => { router.push("/"); router.refresh(); }, 1200);
    } catch {
      setError("エラーが発生しました。もう一度試してください。");
      setLoading(false);
      setProgress(0);
    }
  };

  /* ── Success overlay ── */
  if (done) {
    return (
      <div className="fixed inset-0 bg-[#1C1611] flex flex-col items-center justify-center gap-5 z-50">
        <div className="w-16 h-16 rounded-full bg-[#C9A96E]/20 flex items-center justify-center animate-fade-up">
          <Check className="w-8 h-8 text-[#C9A96E]" strokeWidth={2} />
        </div>
        <p className="font-serif italic text-[#F8F4EE] text-lg animate-fade-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
          思い出帳に残しました
        </p>
        <p className="text-[#6B6055] text-sm animate-fade-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          {date.monthDay}の記録
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#1C1611] flex flex-col">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          aria-label="戻る"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#A89E93] hover:text-[#F8F4EE] hover:bg-white/8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Date — center */}
        <div className="text-center">
          <p className="text-[#C9A96E] text-xs tracking-widest font-medium uppercase">
            {date.monthDay}
          </p>
          <p className="text-[#6B6055] text-[10px]">{date.weekday}</p>
        </div>

        {/* Save — top-right shortcut (visible once photo chosen) */}
        <button
          onClick={handleSave}
          disabled={!hasPhoto || loading}
          aria-label="保存する"
          className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
            hasPhoto && !loading
              ? "bg-[#C9A96E] text-[#1C1611] hover:bg-[#D4B47D]"
              : "text-[#3D3228] pointer-events-none"
          }`}
        >
          {loading ? "保存中…" : "残す"}
        </button>
      </div>

      {/* ── Photo zone ───────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pb-4">
        {preview ? (
          /* ── Preview: looks like a photo laid on a dark table ── */
          <div className="relative group">
            {/* Polaroid-style white frame */}
            <div className="bg-white p-2 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-sm">
              <img
                src={preview}
                alt="プレビュー"
                className="w-full aspect-[4/3] object-cover rounded-[1px] block"
              />
              {/* Caption area */}
              <div className="px-1 pt-2">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="キャプションを書く…"
                  className="w-full text-[11px] font-serif italic text-[#2C2416] placeholder:text-[#C8BEB3] bg-transparent border-none outline-none text-center"
                />
              </div>
            </div>

            {/* Remove / change button */}
            <button
              onClick={() => { setSelectedFile(null); setPreview(null); setProgress(0); }}
              aria-label="写真を変更する"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1C1611]/70 backdrop-blur-sm flex items-center justify-center text-[#A89E93] hover:text-[#F8F4EE] transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Upload progress bar */}
            {loading && progress > 0 && progress < 100 && (
              <div className="absolute bottom-[28px] left-2 right-2 h-0.5 bg-[#E8DFCF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          /* ── Empty: full-width drop target ── */
          <label
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full aspect-[4/3] rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              dragActive
                ? "border-[#C9A96E] bg-[#C9A96E]/8"
                : "border-[#3D3228] hover:border-[#6B5A45] hover:bg-white/3"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              aria-label="写真を選択"
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none select-none">
              <div className="w-14 h-14 rounded-2xl bg-[#2C2416] flex items-center justify-center">
                <Camera className="w-7 h-7 text-[#C9A96E]" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-[#F8F4EE] text-sm font-medium mb-0.5">写真を選ぶ</p>
                <p className="text-[#6B6055] text-xs">タップまたはドロップ</p>
              </div>
            </div>
          </label>
        )}
      </div>

      {/* ── Prompt — appears before photo is chosen ── */}
      {!hasPhoto && (
        <div className="px-5 pb-5 flex-shrink-0">
          <p className="font-serif italic text-[#6B6055] text-sm text-center leading-relaxed">
            {todayPrompt()}
          </p>
        </div>
      )}

      {/* ── Fields — slide in once photo is chosen ── */}
      {hasPhoto && (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-5 pb-8 flex flex-col gap-5">

            {/* ── Error ── */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-[#C4856A]/15 border border-[#C4856A]/30 text-[#C4856A] text-sm">
                {error}
              </div>
            )}

            {/* ── Memo ── */}
            <div>
              <label htmlFor="create-memo" className="block text-[10px] tracking-widest uppercase text-[#6B6055] font-medium mb-2">
                今日のひとこと
              </label>
              <textarea
                id="create-memo"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="この瞬間、どんなことを感じましたか？"
                rows={3}
                className="w-full bg-[#2C2416]/60 border border-[#3D3228] rounded-xl px-4 py-3 text-sm text-[#F8F4EE] placeholder:text-[#4A3E30] focus:outline-none focus:border-[#C9A96E]/60 resize-none leading-relaxed transition-colors"
              />
            </div>

            {/* ── Tags ── */}
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#6B6055] font-medium mb-3">
                思い出のタグ
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PET_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      tags.includes(tag)
                        ? "bg-[#C9A96E] text-[#1C1611] border-[#C9A96E] font-medium"
                        : "bg-transparent text-[#6B6055] border-[#3D3228] hover:border-[#6B5A45] hover:text-[#A89E93]"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Custom tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="#オリジナルタグ"
                  className="flex-1 bg-[#2C2416]/60 border border-[#3D3228] rounded-xl px-4 py-2.5 text-sm text-[#F8F4EE] placeholder:text-[#4A3E30] focus:outline-none focus:border-[#C9A96E]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-4 py-2.5 bg-[#2C2416] text-[#A89E93] text-xs font-medium rounded-xl border border-[#3D3228] hover:border-[#6B5A45] hover:text-[#F8F4EE] transition-colors"
                >
                  追加
                </button>
              </div>

              {/* Selected custom tags */}
              {tags.some(t => !PET_TAGS.includes(t)) && (
                <div className="flex gap-1.5 flex-wrap mt-2.5">
                  {tags.filter(t => !PET_TAGS.includes(t)).map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#C9A96E]/15 border border-[#C9A96E]/30 rounded-full text-xs text-[#C9A96E]"
                    >
                      #{tag}
                      <button
                        onClick={() => setTags(tags.filter(t => t !== tag))}
                        aria-label={`${tag}を削除`}
                        className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Save CTA ── */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#C9A96E] text-[#1C1611] font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-[#D4B47D] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#1C1611]/30 border-t-[#1C1611] rounded-full animate-spin" />
                    <span>思い出帳に残しています…</span>
                  </>
                ) : (
                  <>
                    <PawPrint className="w-4 h-4" strokeWidth={2} />
                    <span>思い出帳に残す</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-40" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="w-full py-2.5 text-sm text-[#4A3E30] hover:text-[#6B6055] transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer hint — before photo ── */}
      {!hasPhoto && (
        <div className="mt-auto px-5 pb-8 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#2C2416]/60 border border-[#3D3228]">
            <ImagePlus className="w-4 h-4 text-[#6B6055] flex-shrink-0" strokeWidth={1.5} />
            <p className="text-xs text-[#4A3E30] leading-relaxed">
              写真を選ぶと、タイトルやタグを追加できます
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
