"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HTMLFlipBook from "react-pageflip";

interface Pin {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  category: string;
  type: string;
  createdAt: string;
  userId: string;
}

export default function TimelineAlbumPage() {
  const { year, month } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const bookRef = useRef<any>(null);
  const [pageSize, setPageSize] = useState({ width: 300, height: 500 });
  const [leftOffset, setLeftOffset] = useState("calc(8vw + 8px - 1140px)");
  const [startPage, setStartPage] = useState(0);
  // containerRef を追加
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const RATIO = 1170 / 740;
    const MIN_PW = 220;
    const sliverRatio = 0.06;
    const rightMarginRatio = 0.02; // 右端の余白
    const verticalMarginRatio = 0.04; // 上下の余白（影のためのスペース）

    const updateSize = () => {
      const availW = container.clientWidth;
      const availH = container.clientHeight * (1 - verticalMarginRatio); // 上下に余白を残す

      let pw = (availW * (1 - rightMarginRatio)) / (1 + sliverRatio);
      let ph = pw / RATIO;
      if (ph > availH) {
        ph = availH;
        pw = ph * RATIO;
      }
      pw = Math.max(MIN_PW, Math.floor(pw));
      ph = Math.floor(ph);

      const sliver = Math.max(20, Math.round(pw * sliverRatio));
      const leftOffsetPx = -pw + sliver;

      setPageSize({ width: pw, height: ph });
      setLeftOffset(`${Math.round(leftOffsetPx)}px`);
      setStartPage(1);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [loading]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data
          .filter((pin: any) => {
            if (pin.userId !== session.user.id) return false;
            const d = new Date(pin.createdAt);
            return (
              d.getFullYear() === Number(year) &&
              d.getMonth() + 1 === Number(month)
            );
          })
          .sort(
            (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        setPins(filtered);
        setLoading(false);
      });
  }, [session, year, month]);

  if (!session) return null;

  if (loading) {
    return (
      <div
        style={{
          background: "#F5F0E8",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#AFA495", fontSize: 12 }}>読み込み中...</p>
      </div>
    );
  }

  const FIXED_IMAGE =
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400";

  // ページ余白：pageSizeに対する比率で計算し、どのブレークポイントでも呼吸感を保つ
  const padX = Math.max(20, Math.round(pageSize.width * 0.1));
  const padTop = Math.max(22, Math.round(pageSize.height * 0.06));
  const padBottom = Math.max(18, Math.round(pageSize.height * 0.05));

  const leftPage = (key: string, date?: string) => (
    <div
      key={key}
      style={{
        background: "#F5F0E8",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: `${padTop}px ${padX}px ${padBottom}px`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        filter: "grayscale(100%)",
      }}
    >
      {/* 綴じ目の影（右端） */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 20,
          background:
            "linear-gradient(to right, transparent, rgba(44,36,22,0.16) 92%)",
          pointerEvents: "none",
        }}
      />

      {date && (
        <p
          style={{
            fontSize: 9,
            color: "#AFA495",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: "Georgia, serif",
            flexShrink: 0,
          }}
        >
          {date}
        </p>
      )}

      {/* 写真：縦中央配置、比率固定 */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "60%",
            maxWidth: 240,
            transform: "rotate(1.5deg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -7,
              left: "40%",
              width: 22,
              height: 8,
              background: "rgba(201,169,110,0.3)",
              borderRadius: 1,
              transform: "rotate(-3deg)",
              zIndex: 1,
            }}
          />
          <div
            style={{
              background: "#FFFFFF",
              padding: "10px 10px 26px",
              boxShadow:
                "0 6px 16px rgba(44,36,22,0.12), 0 1px 3px rgba(44,36,22,0.06)",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 5",
                background: "#EDE8DC",
                overflow: "hidden",
              }}
            >
              <img
                src={FIXED_IMAGE}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.12,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: "#F5F0E8",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          background: "red",
          color: "white",
          padding: 4,
          zIndex: 9999,
          fontSize: 12,
        }}
      >
        container: {containerRef.current?.clientWidth} x{" "}
        {containerRef.current?.clientHeight} / pageSize: {pageSize.width} x{" "}
        {pageSize.height}
      </p>
      {/* ヘッダー */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
        }}
      >
        <button
          onClick={() => router.push("/profile")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#AFA495",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
          アルバム
        </button>
        <p style={{ color: "#C4BAB0", fontSize: 11, letterSpacing: "0.1em" }}>
          {Math.min(Math.max(0, currentPage), pins.length)} / {pins.length}
        </p>
      </div>

      {/* 本エリア */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: leftOffset,
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          {/* 左ページを隠すオーバーレイ */}
          {/* <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pageSize.width}px`,
              background: "#F5F0E8",
              zIndex: 50,
              pointerEvents: "none",
            }}
          /> */}
          {/* @ts-ignore */}
          <HTMLFlipBook
            key={`${pageSize.width}-${pageSize.height}`}
            ref={bookRef}
            width={pageSize.width}
            height={pageSize.height}
            size="fixed"
            minWidth={150}
            maxWidth={800}
            minHeight={300}
            maxHeight={1200}
            showCover={true}
            // usePortrait={true}
            // showCover={false}
            usePortrait={false}
            mobileScrollSupport={true}
            startPage={startPage}
            drawShadow={true}
            flippingTime={1700}
            startZIndex={20}
            autoSize={true}
            maxShadowOpacity={0.5}
            onFlip={(e: any) => {
              const photoIndex = Math.round(e.data / 2); // 生ページ番号 → 写真の枚数に変換
              setCurrentPage(Math.min(Math.max(0, photoIndex), pins.length));
            }}
            style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.3)" }}
          >
            {/* ページ0：表紙（右に表示） */}
            <div
              key="cover"
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, #EDE4D3 0%, #E4D5B8 45%, #D9C49C 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* エンボス風の二重枠 */}
              <div
                style={{
                  position: "absolute",
                  inset: 18,
                  border: "1px solid rgba(44,36,22,0.18)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 24,
                  border: "1px solid rgba(44,36,22,0.1)",
                  pointerEvents: "none",
                }}
              />

              {/* コーナー装飾（革表紙の金具風） */}
              {[
                { top: 30, left: 30, borderWidth: "2px 0 0 2px" },
                { top: 30, right: 30, borderWidth: "2px 2px 0 0" },
                { bottom: 30, left: 30, borderWidth: "0 0 2px 2px" },
                { bottom: 30, right: 30, borderWidth: "0 2px 2px 0" },
              ].map((pos, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    width: 20,
                    height: 20,
                    borderColor: "#C9A96E",
                    borderStyle: "solid",
                    opacity: 0.7,
                    pointerEvents: "none",
                    ...pos,
                  }}
                />
              ))}

              {/* ブックマークリボン */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: "16%",
                  width: 14,
                  height: "48%",
                  background: "#C9A96E",
                  boxShadow: "0 2px 6px rgba(44,36,22,0.2)",
                  clipPath: "polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%)",
                }}
              />

              {/* 写真の窓：中身をのぞかせる円形フレーム */}
              <div
                style={{
                  width: "44%",
                  maxWidth: 170,
                  aspectRatio: "1 / 1",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #F5F0E8",
                  boxShadow:
                    "0 6px 18px rgba(44,36,22,0.22), 0 0 0 1px rgba(201,169,110,0.5)",
                  marginBottom: 22,
                  background: "#EDE8DC",
                }}
              >
                <img
                  src={pins[0]?.imageUrl || FIXED_IMAGE}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "sepia(0.12)",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  color: "#8A7757",
                  marginBottom: 8,
                }}
              >
                🐾 {year}年{month}月
              </p>

              <p
                style={{
                  fontSize: 30,
                  fontWeight: 300,
                  color: "#2C2416",
                  fontFamily: "Georgia, serif",
                  lineHeight: 1.3,
                  textAlign: "center",
                }}
              >
                {month}月の
                <br />
                思い出
              </p>

              <div
                style={{
                  width: 32,
                  height: 1,
                  background: "#C9A96E",
                  margin: "18px auto",
                }}
              />

              <p
                style={{
                  fontSize: 9,
                  color: "#8A7757",
                  letterSpacing: "0.1em",
                }}
              >
                {pins.length}枚の記録
              </p>
            </div>

            {/* ページ1：表紙をめくった後の左ページ */}
            <div
              key="cover-left"
              style={{
                background: "#F5F0E8",
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 綴じ目の影（右端）：他の左ページと統一 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 20,
                  background:
                    "linear-gradient(to right, transparent, rgba(44,36,22,0.16) 92%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* 各写真ページ */}
            {pins.flatMap((pin, i) => [
              /* 右ページ（写真） */
              <div
                key={pin.id}
                style={{
                  background: "#F5F0E8",
                  width: "100%",
                  height: "100%",
                  boxSizing: "border-box",
                  padding: `${padTop}px ${padX}px ${padBottom}px`,
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* 綴じ目の影（左端） */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 20,
                    background:
                      "linear-gradient(to left, transparent, rgba(44,36,22,0.14) 92%)",
                    pointerEvents: "none",
                  }}
                />
                <p
                  style={{
                    fontSize: 9,
                    color: "#AFA495",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontFamily: "Georgia, serif",
                    flexShrink: 0,
                  }}
                >
                  {new Date(pin.createdAt).toLocaleDateString("ja-JP", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </p>

                {/* 写真：ページ縦中央に配置。余白で「置かれている」感を出す */}
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "78%",
                      maxWidth: 340,
                      transform: "rotate(-1.2deg)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: -7,
                        left: "44%",
                        width: 26,
                        height: 9,
                        background: "rgba(201,169,110,0.35)",
                        borderRadius: 1,
                        transform: "rotate(-2deg)",
                        zIndex: 1,
                      }}
                    />
                    <div
                      style={{
                        background: "#FFFFFF",
                        padding: "14px 14px 32px",
                        boxShadow:
                          "0 10px 28px rgba(44,36,22,0.16), 0 2px 6px rgba(44,36,22,0.08)",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "4 / 5",
                          background: "#EDE8DC",
                          overflow: "hidden",
                        }}
                      >
                        {pin.imageUrl && (
                          <img
                            src={pin.imageUrl}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* キャプション：写真の下、中央寄せで余白を持たせる */}
                <div
                  style={{ flexShrink: 0, marginTop: 18, textAlign: "center" }}
                >
                  {pin.title && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#2C2416",
                        fontFamily: "Georgia, serif",
                        lineHeight: 1.5,
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {pin.title}
                    </p>
                  )}
                  {pin.description && (
                    <p
                      style={{
                        fontSize: 9,
                        color: "#7A6E5F",
                        fontFamily: "Georgia, serif",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                      }}
                    >
                      {pin.description}
                    </p>
                  )}
                  {pin.category && (
                    <p
                      style={{
                        fontSize: 8,
                        color: "#AFA495",
                        letterSpacing: "0.08em",
                        marginTop: 8,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {pin.category
                        .split(",")
                        .map((t: string) => `#${t.trim()}`)
                        .join("  ")}
                    </p>
                  )}
                </div>

                <p
                  style={{
                    position: "absolute",
                    bottom: padBottom,
                    right: padX,
                    fontSize: 8,
                    color: "#C4BAB0",
                    letterSpacing: "0.2em",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
              </div>,

              /* 左ページ（固定画像） */
              leftPage(
                `left-${pin.id}`,
                new Date(pin.createdAt).toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                }),
              ),
            ])}

            {/* 枚数調整用の空ページ */}
            {pins.length % 2 !== 0 ? (
              <div
                key="empty"
                style={{ background: "#F5F0E8", width: "100%", height: "100%" }}
              />
            ) : (
              <div
                key="empty2"
                style={{ background: "#F5F0E8", width: "100%", height: "100%" }}
              />
            )}

            {/* 裏表紙 */}
            <div
              key="back"
              style={{
                background: "#EDE8DC",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ fontSize: 20, color: "#AFA495" }}>🐾</p>
            </div>
          </HTMLFlipBook>
        </div>
      </div>

      {/* ナビゲーション */}
      <div
        className="pb-24 md:pb-8"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          paddingTop: 16,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <button
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          style={{
            background: "none",
            border: "0.5px solid #DDD5C4",
            borderRadius: 20,
            padding: "8px 16px",
            color: "#AFA495",
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ChevronLeft style={{ width: 12, height: 12 }} />
          前のページ
        </button>
        <button
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          style={{
            background: "none",
            border: "0.5px solid #DDD5C4",
            borderRadius: 20,
            padding: "8px 16px",
            color: "#AFA495",
            fontSize: 11,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          次のページ
          <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}
