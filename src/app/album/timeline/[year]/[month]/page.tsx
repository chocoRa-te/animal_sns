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

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const spineLeft = w * 0.08 + 8;

      if (w < 768) {
        setPageSize({
          width: Math.floor(w * 0.9),
          height: Math.floor(h - 160),
        });
        setLeftOffset("0px");
        setStartPage(0);
      } else if (w < 1280) {
        setPageSize({
          width: Math.floor(Math.min(w - spineLeft, h * 0.65)),
          height: Math.floor(h - 160),
        });
        setLeftOffset("0px");
        setStartPage(1);
      } else {
        setPageSize({
          width: Math.floor(Math.min(w - spineLeft, h * 1.3)),
          height: Math.floor(h - 160),
        });
        setLeftOffset("calc(8vw + 8px - 1140px)");
        setStartPage(1);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  const leftPage = (key: string, date?: string) => (
    <div
      key={key}
      style={{
        background: "#F5F0E8",
        width: "100%",
        height: "100%",
        padding: "20px 20px 16px",
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        filter: "grayscale(100%)",
      }}
    >
      {date && (
        <p
          style={{
            fontSize: 9,
            color: "#AFA495",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 12,
            fontFamily: "Georgia, serif",
            flexShrink: 0,
          }}
        >
          {date}
        </p>
      )}
      <div
        style={{
          position: "relative",
          width: "55%",
          margin: "0 auto 10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -7,
            left: "42%",
            width: 24,
            height: 9,
            background: "rgba(201,169,110,0.3)",
            borderRadius: 1,
            transform: "rotate(-2deg)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            background: "#FFFFFF",
            padding: "5px 5px 16px",
            boxShadow: "0 2px 8px rgba(44,36,22,0.12)",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "4/3",
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
                opacity: 0.1,
              }}
            />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <p
          style={{
            fontSize: 12,
            color: "#2C2416",
            fontFamily: "Georgia, serif",
            lineHeight: 1.6,
            marginBottom: 6,
          }}
        >
          思い出
        </p>
        <div
          style={{
            height: 1,
            width: "70%",
            background: "#DDD5C4",
            margin: "8px auto",
          }}
        />
        <p style={{ fontSize: 9, color: "#AFA495", letterSpacing: "0.08em" }}>
          #petlog
        </p>
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
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "visible",
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
            mobileScrollSupport={true}
            startPage={startPage}
            drawShadow={true}
            flippingTime={1700}
            startZIndex={20}
            autoSize={true}
            maxShadowOpacity={0.5}
            onFlip={(e: any) => setCurrentPage(Math.min(e.data, pins.length))}
            style={{ boxShadow: "-8px 0 24px rgba(0,0,0,0.3)" }}
          >
            {/* ページ0：表紙（右に表示） */}
            <div
              key="cover"
              style={{
                background: "#EDE8DC",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 24,
                boxSizing: "border-box",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  color: "#AFA495",
                  letterSpacing: "0.12em",
                  marginBottom: 12,
                }}
              >
                {year}年{month}月
              </p>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  color: "#2C2416",
                  fontFamily: "Georgia, serif",
                  lineHeight: 1.3,
                }}
              >
                {month}月の
                <br />
                思い出
              </p>
              <div
                style={{
                  width: 24,
                  height: 1,
                  background: "#C9A96E",
                  margin: "16px auto",
                }}
              />
              <p style={{ fontSize: 9, color: "#AFA495" }}>{pins.length}件</p>
            </div>

            {/* ページ1：表紙をめくった後の左ページ */}
            <div
              key="cover-left"
              style={{ background: "#F5F0E8", width: "100%", height: "100%" }}
            />

            {/* 各写真ページ */}
            {pins.flatMap((pin, i) => [
              /* 右ページ（写真） */
              <div
                key={pin.id}
                style={{
                  background: "#F5F0E8",
                  width: "100%",
                  height: "100%",
                  padding: "20px 20px 16px",
                  boxSizing: "border-box",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontSize: 9,
                    color: "#AFA495",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    marginBottom: 12,
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
                <div
                  style={{
                    position: "relative",
                    width: "55%",
                    margin: "0 auto 10px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -7,
                      left: "42%",
                      width: 24,
                      height: 9,
                      background: "rgba(201,169,110,0.3)",
                      borderRadius: 1,
                      transform: "rotate(-2deg)",
                      zIndex: 1,
                    }}
                  />
                  <div
                    style={{
                      background: "#FFFFFF",
                      padding: "5px 5px 16px",
                      boxShadow: "0 2px 8px rgba(44,36,22,0.12)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "4/3",
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
                <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                  {pin.title && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#2C2416",
                        fontFamily: "Georgia, serif",
                        lineHeight: 1.6,
                        marginBottom: 6,
                      }}
                    >
                      {pin.title}
                    </p>
                  )}
                  {pin.description && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "#7A6E5F",
                        fontFamily: "Georgia, serif",
                        lineHeight: 1.7,
                        marginBottom: 6,
                      }}
                    >
                      {pin.description}
                    </p>
                  )}
                  {pin.category && (
                    <>
                      <div
                        style={{
                          height: 1,
                          background: "#DDD5C4",
                          margin: "8px auto",
                          width: "70%",
                        }}
                      />
                      <p
                        style={{
                          fontSize: 9,
                          color: "#AFA495",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {pin.category
                          .split(",")
                          .map((t: string) => `#${t.trim()}`)
                          .join("  ")}
                      </p>
                    </>
                  )}
                </div>
                <p
                  style={{
                    alignSelf: "flex-end",
                    fontSize: 8,
                    color: "#C4BAB0",
                    letterSpacing: "0.2em",
                    fontFamily: "Georgia, serif",
                    flexShrink: 0,
                    marginTop: 8,
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
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          padding: "16px 24px 32px",
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
