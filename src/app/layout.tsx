import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PetLog",
  description: "ペットとの思い出を残すアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <div className="app-shell">
              <Sidebar />
              <main
                className="app-main md:ml-56 ml-0 min-h-screen bg-[#F5F0E8]"
                style={{ overflow: "auto" }}
              >
                {children}
              </main>
            </div>
            <BottomNav />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
