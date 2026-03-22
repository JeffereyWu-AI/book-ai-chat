// 網站首頁 / 的頁面元件

import React from 'react'
import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import {getAllBooks} from "@/lib/actions/book.actions";
import Search from "@/components/Search";

// 在伺服器端執行，先把資料抓好，再把 HTML 傳給瀏覽器。
const Page = async ({ searchParams }: { searchParams: Promise<{ query?: string }> }) => {
    const { query } = await searchParams;

    const bookResults = await getAllBooks(query)    // 呼叫後端邏輯，從資料庫取書本列表。
    const books = bookResults.success ? bookResults.data ?? [] : []

    return (
        <main className="wrapper container">
            <HeroSection />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
                <h2 className="text-3xl font-serif font-bold text-[#212a3b]">Recent Books</h2>
                <Search />
            </div>

            <div className="library-books-grid">
                {/* 將每一本從資料庫抓回來的書轉成一張 BookCard。 */}
                {books.map((book) => (
                    <BookCard key={book._id} title={book.title} author={book.author} coverURL={book.coverURL} slug={book.slug} />
                ))}
            </div>
        </main>
    )
}

export default Page
