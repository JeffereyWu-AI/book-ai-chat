// 顯示某一本書的詳細頁（根據 slug），並且只有登入用戶才能訪問，同時提供語音控制功能

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.actions"; // 從 DB / API 取得書資料
import VapiControls from "@/components/VapiControls";

// async → 可以直接在 server 拿資料
export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  } // 沒登入 → 強制跳去 /sign-in

  const { slug } = await params;
  const result = await getBookBySlug(slug); // 查資料庫（MongoDB）

  if (!result.success || !result.data) {
    redirect("/");
  } // 如果：查詢失敗, 或沒有這本書, 直接導回首頁

  const book = result.data;

  return (
    <div className="book-page-container">
      {/* 返回按鈕 */}
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="size-6 text-[#212a3b]" />
      </Link>

      <VapiControls book={book} />
    </div>
  );
}
