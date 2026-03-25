// 設定哪些外部網域的圖片可以被 next/image 載入與最佳化
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // 允許傳給 server actions 的 request body 最大可以到 100MB。
    experimental: {
        serverActions: {
            bodySizeLimit: '100mb',
        }
    },
    // 在 build 專案時，即使 TypeScript 有型別錯誤，也 不會阻止 build 成功。
    // 通常在學習或快速開發階段會這樣設定；正式上線專案通常會關掉（設為 false），強迫修好型別錯誤。
    typescript: {
        ignoreBuildErrors: true,
    },
    // Next.js 為了安全與最佳化，預設只允許特定來源的遠端圖片被 Image 元件載入。
    images: { remotePatterns: [
            { protocol: 'https', hostname: 'covers.openlibrary.org' },
            // 允許載入你部署在 Vercel Blob Storage 上的圖片（例如使用者上傳的封面圖）。
            { protocol: 'https', hostname: 'l0sxxn82v5lgprww.public.blob.vercel-storage.com' },
        ]}
};

export default nextConfig;

// 設定 next/image 可以從 Open Library 和你的 Vercel Blob Storage 網域載入遠端圖片。