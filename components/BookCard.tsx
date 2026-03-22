// 一個**「單一本書的卡片元件」**

import Link from "next/link";
import {BookCardProps} from "@/types";
import Image from "next/image";

const BookCard = ({ title, author, coverURL, slug }: BookCardProps) => {
    return (
        // 整張卡片都是一個連結，點任何地方都會前往該書詳細頁。
        <Link href={`/books/${slug}`}>
            <article className="book-card">
                {/* 一組「媒體 + 說明文字」的語義化標籤。 */}
                <figure className="book-card-figure">
                    <div className="book-card-cover-wrapper">
                        <Image src={coverURL} alt={title} width={133} height={200} className="book-card-cover" />
                    </div>

                    <figcaption className="book-card-meta">
                        <h3 className="book-card-title">{title}</h3>
                        <p className="book-card-author">{author}</p>
                    </figcaption>
                </figure>
            </article>
        </Link>
    )
}
export default BookCard
