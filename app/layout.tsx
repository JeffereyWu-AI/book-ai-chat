// 這個檔案決定了整個網站的外層框架與全域設定。

import type { Metadata } from "next";
import { IBM_Plex_Serif, Mona_Sans} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
// Clerk 是用來做使用者登入 / 註冊 / Session 管理的認證服務。

import Navbar from "@/components/Navbar";
import "./globals.css";
import {Toaster} from "@/components/ui/sonner";
// 匯入 Toaster 元件，用來顯示全域的通知（toast）。

const ibmPlexSerif = IBM_Plex_Serif({
    variable: "--font-ibm-plex-serif",
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap'
});

const monaSans = Mona_Sans({
    variable: '--font-mona-sans',
    subsets: ['latin'],
    display: 'swap'
})

export const metadata: Metadata = {
  title: "Bookified",
  description: "Transform your books into interactive AI conversations. Upload PDFs, and chat with your books using voice.",
};

// 在 App Router 中，Next 會自動把每個頁面的內容傳進 RootLayout 的 children prop。
// 所以 children 代表目前正在顯示的頁面內容

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 優點：之後你可以在任何子元件（例如頁面）中使用 Clerk 的功能
    <ClerkProvider>
        <html lang="en">
          <body
            className={`${ibmPlexSerif.variable} ${monaSans.variable} relative font-sans antialiased`}
          >
            {/* 每一個頁面上方，都會固定顯示同一個導覽列。 */}
            <Navbar />
            {/* 這裡就是頁面的實際內容。 */}
            {children}
            {/* 放在 body 的最後，用來顯示 toast 通知。 */}
            <Toaster />
          </body>
        </html>
    </ClerkProvider>
  );
}
