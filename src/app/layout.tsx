import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "memoPaw — ペットとの思い出帳",
  description: "大切なペットとの日々を、美しい思い出帳に。写真一枚から始まる、かけがえない記録。",
  keywords: ["ペット", "思い出", "写真", "動物", "アルバム", "メモリー"],
  openGraph: {
    title: "memoPaw — ペットとの思い出帳",
    description: "大切なペットとの日々を、美しい思い出帳に。",
    locale: "ja_JP",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8F4EE",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning className="bg-paper">
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
