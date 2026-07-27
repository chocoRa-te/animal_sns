"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, X, ChevronLeft, PawPrint, Check, Plus } from "lucide-react";

/* ─── Constants ──────────────────────────────────────────── */
const PET_TAGS = ["散歩", "ごはん", "お昼寝", "遊び", "成長記録", "お出かけ", "病院", "お風呂"];

function todayFormatted() {
  const d = new Date();
  const wd = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日（${wd}）`;
}

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

  const [preview, setPreview]         = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle]             = useState("");
  const [memo, setMemo]               = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [customTag, setCustomTag]     = useState("");
  const [showCustom, setShowCustom]   = useState(false);
  const [dragActive, setDragActive]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [progress, setProgress]       = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const [done, setDone]               = useState(false);

  const hasPhoto = !!preview;
  const date = todayFormatted();

  /* ── File handling ── */
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("画像ファイルを選んでください"); return; }
    if (file.size > 10 * 1024 * 1024)    { setError("10MB以下の画像を選んでください"); return; }
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
    const t = customTag.trim().replace(/^#+/, "");
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); }
    setCustomTag("");
    setShowCustom(false);
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
      if (!cloudRes.ok) throw new Error("upload failed");
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
      setTimeout(() => { router.push("/"); router.refresh(); }, 1400);
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
      setLoading(false);
      setProgress(0);
    }
  };

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 z-50"
        style={{ background: "#1C1611" }}>
        <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
          style={{ background: "rgba(201,169,110,0.15)" }}>
          <Check className="w-8 h-8 text-[#C9A96E]" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <p className="font-serif italic text-[22px] text-[#F5EED8] leading-snug mb-1">
            思い出帳に残しました
          </p>
          <p className="text-[13px] text-[#6B6055]">{date}の記録</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#1C1611" }}>

      {/* ════════════════════════════════════════════════
          TOP BAR — ultra minimal, date-centered
      ════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5"
        style={{ paddingTop: 18, paddingBottom: 14 }}
      >
        <button
          onClick={() => router.back()}
          aria-label="戻る"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ color: "#6B6055" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#F8F4EE")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6B6055")}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-[11px] tracking-[0.18em] uppercase font-medium" style={{ color: "#C9A96E" }}>
            {date}
          </p>
        </div>

        {/* Ghost placeholder for balance */}
        <div className="w-9" />
      </div>

      {/* ════════════════════════════════════════════════
          PHOTO ZONE — fills top ~55% of the screen
          Dark velvet: the photograph on a dark table
      ════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 px-6"
        style={{ paddingBottom: 20 }}
      >
        {preview ? (
          /* ── Photo preview ── */
          <div className="relative group">
            {/* Progress bar sits above the photo as a hairline */}
            {loading && progress > 0 && progress < 100 && (
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[3px] overflow-hidden z-10"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "#C9A96E" }}
                />
              </div>
            )}

            {/* The photograph — Polaroid-style: white border, heavy bottom margin for caption */}
            <div
              className="relative shadow-[0_12px_48px_rgba(0,0,0,0.55)]"
              style={{
                background: "#FFFFFF",
                padding: "7px 7px 52px 7px",
                borderRadius: 3,
              }}
            >
              <img
                src={preview}
                alt="プレビュー"
                className="w-full block object-cover"
                style={{ aspectRatio: "4/3", borderRadius: 1 }}
              />

              {/* Caption inside the white Polaroid margin — this IS the title field */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
                style={{ height: 52, paddingLeft: 16, paddingRight: 16 }}>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="ひとこと添えて…"
                  maxLength={60}
                  className="w-full text-center text-[12px] bg-transparent border-none outline-none font-serif italic leading-snug"
                  style={{ color: "#4A3E30", caretColor: "#C9A96E" }}
                  aria-label="キャプション"
                />
              </div>
            </div>

            {/* Change photo button — appears on hover */}
            <button
              onClick={() => { setSelectedFile(null); setPreview(null); setProgress(0); }}
              aria-label="写真を変更する"
              className="absolute top-3 right-3 flex items-center gap-1.5 transition-opacity"
              style={{
                background: "rgba(28,22,17,0.72)",
                backdropFilter: "blur(8px)",
                borderRadius: 20,
                padding: "5px 10px 5px 8px",
                opacity: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
            >
              <X className="w-3 h-3" style={{ color: "#A89E93" }} />
              <span className="text-[10px]" style={{ color: "#A89E93" }}>変更</span>
            </button>
          </div>
        ) : (
          /* ── Empty drop zone ── */
          <label
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center w-full cursor-pointer transition-all"
            style={{
              aspectRatio: "4/3",
              borderRadius: 16,
              border: `2px dashed ${dragActive ? "#C9A96E" : "#3D3228"}`,
              background: dragActive ? "rgba(201,169,110,0.06)" : "rgba(255,255,255,0.02)",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              aria-label="写真を選択"
            />
            <div className="flex flex-col items-center gap-4 pointer-events-none select-none">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: "rgba(201,169,110,0.1)",
                }}
              >
                <Camera className="w-7 h-7" style={{ color: "#C9A96E" }} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-medium mb-1" style={{ color: "#F5EED8" }}>
                  写真を選ぶ
                </p>
                <p className="text-[12px] italic font-serif" style={{ color: "#6B6055" }}>
                  {todayPrompt()}
                </p>
              </div>
            </div>
          </label>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          CREAM ZONE — the "caption paper" at the bottom
          Appears only after a photo is selected.
          Otherwise shows a quiet hint.
      ════════════════════════════════════════════════ */}
      {hasPhoto ? (
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: "#F8F4EE",
            borderRadius: "20px 20px 0 0",
            paddingTop: 24,
          }}
        >
          {/* Drag handle pill */}
          <div className="flex justify-center mb-5 flex-shrink-0">
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#DDD4C6" }} />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-6">

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-2xl text-[13px]"
                style={{ background: "rgba(196,133,106,0.12)", color: "#C4856A", border: "1px solid rgba(196,133,106,0.25)" }}>
                {error}
              </div>
            )}

            {/* Memo */}
            <div className="mb-5">
              <label
                htmlFor="create-memo"
                className="block text-[10px] tracking-[0.14em] uppercase font-medium mb-2"
                style={{ color: "#A89E93" }}
              >
                今日のひとこと
              </label>
              <textarea
                id="create-memo"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="この瞬間、どんなことを感じた？"
                rows={2}
                className="w-full resize-none text-[14px] leading-relaxed border-none outline-none bg-transparent font-serif"
                style={{
                  color: "#1C1611",
                  caretColor: "#C9A96E",
                }}
              />
              {/* Thin ruled line under textarea */}
              <div style={{ height: 1, background: "#DDD4C6", marginTop: 8 }} />
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-[10px] tracking-[0.14em] uppercase font-medium mb-3"
                style={{ color: "#A89E93" }}>
                タグ
              </label>
              <div className="flex flex-wrap gap-2">
                {PET_TAGS.map(tag => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 text-[12px] rounded-full transition-all"
                      style={{
                        background: active ? "#1C1611" : "#F2EBE0",
                        color: active ? "#F8F4EE" : "#6B6055",
                        border: "none",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}

                {/* Custom tags already added */}
                {tags.filter(t => !PET_TAGS.includes(t)).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] rounded-full transition-all"
                    style={{
                      background: "#C9A96E",
                      color: "#1C1611",
                      fontWeight: 500,
                      border: "none",
                    }}
                    aria-label={`${tag}を削除`}
                  >
                    #{tag}
                    <X className="w-2.5 h-2.5 opacity-60" />
                  </button>
                ))}

                {/* Add custom tag button */}
                {showCustom ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ background: "#F2EBE0", border: "1px solid #DDD4C6" }}>
                    <input
                      type="text"
                      value={customTag}
                      onChange={e => setCustomTag(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addCustomTag(); }
                        if (e.key === "Escape") { setShowCustom(false); setCustomTag(""); }
                      }}
                      placeholder="タグ名"
                      autoFocus
                      className="bg-transparent border-none outline-none text-[12px] w-20"
                      style={{ color: "#1C1611" }}
                    />
                    <button
                      onClick={addCustomTag}
                      className="text-[11px] font-medium px-1.5"
                      style={{ color: "#C9A96E" }}
                    >
                      追加
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCustom(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] rounded-full transition-all"
                    style={{
                      background: "transparent",
                      border: "1.5px dashed #DDD4C6",
                      color: "#A89E93",
                    }}
                    aria-label="タグを追加"
                  >
                    <Plus className="w-3 h-3" />
                    追加
                  </button>
                )}
              </div>
            </div>

            {/* Bottom padding so content clears the CTA bar */}
            <div style={{ height: 100 }} />
          </div>

          {/* ── Anchored CTA bar ── */}
          <div
            className="flex-shrink-0 px-6 pb-6 pt-4 flex flex-col gap-2"
            style={{
              borderTop: "1px solid #EBE4D8",
              background: "#F8F4EE",
            }}
          >
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              style={{
                background: "#1C1611",
                borderRadius: 14,
                padding: "15px 24px",
                color: "#F8F4EE",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.01em",
                border: "none",
                cursor: "pointer",
              }}
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: "rgba(248,244,238,0.25)", borderTopColor: "#F8F4EE" }}
                  />
                  <span>思い出帳に残しています…</span>
                </>
              ) : (
                <>
                  <PawPrint className="w-4 h-4 opacity-70" strokeWidth={2} />
                  <span>思い出帳に残す</span>
                  <span
                    className="ml-auto text-[12px] font-normal"
                    style={{ color: "rgba(248,244,238,0.35)" }}
                  >
                    {date}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ── No photo yet: quiet hint at the very bottom ── */
        <div className="mt-auto flex-shrink-0 px-6 pb-8">
          <p className="text-center text-[12px]" style={{ color: "#3D3228" }}>
            写真を選ぶと、メモやタグを追加できます
          </p>
        </div>
      )}
    </div>
  );
}
