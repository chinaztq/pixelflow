import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PixelFlow",
  description: "企业内部 AI 素材协作平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
