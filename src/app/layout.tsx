import type { Metadata } from "next";
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
});

export const metadata: Metadata = {
  title: "memoPaw — 大切なペットとの思い出を残そう",
  description: "ペットとの大切な瞬間を写真に残して、いつでも振り返れる思い出帳を作ろう。",
  keywords: ["ペット", "思い出", "写真", "動物", "SNS", "メモリー"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning className="bg-background">
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
