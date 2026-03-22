// 「書本分段內容」的 Mongoose Model 定義檔

import { model, Schema, models, Types } from "mongoose";
import { IBookSegment } from "@/types";

const BookSegmentSchema = new Schema<IBookSegment>({
    clerkId: { type: String, required: true },  // 哪個使用者的書段（Clerk 使用者 ID）。
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },  // 指向 Book collection 裡某一本書的 _id。
    content: { type: String, required: true },
    segmentIndex: { type: Number, required: true, index: true },    // 這段是第幾段，通常從 0 或 1 開始編號，按原書順序。
    pageNumber: { type: Number, index: true, }, // 可選欄位；如果在切段時有保留 PDF 的頁碼，就記在這裡。
    wordCount: { type: Number, required: true },    // 這一段文字的字數。
}, { timestamps: true });

BookSegmentSchema.index({ bookId: 1, segmentIndex: 1 }, { unique: true });  // 對同一本書（相同 bookId），同一個 segmentIndex 不能出現兩次。
BookSegmentSchema.index({ bookId: 1, pageNumber: 1 });  // 快速查「某本書的第 X 頁所有段落」。

BookSegmentSchema.index({ bookId: 1, content: 'text' });    // 只在特定一本書的內容中搜尋。

const BookSegment = models.BookSegment || model<IBookSegment>('BookSegment', BookSegmentSchema);

export default BookSegment;

// 未來需要：
// 依照順序讀一整本書 → 用 find({ bookId }).sort({ segmentIndex: 1 })。
// 找某頁內容 → 用 (bookId, pageNumber) 索引。
// 在書內搜尋文字 → 用 content 的 text index 搭配 bookId。