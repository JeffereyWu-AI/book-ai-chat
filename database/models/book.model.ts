// 「書本資料」的 Mongoose Model 定義檔

import { model, Schema, models } from "mongoose";
import {IBook} from "@/types";

const BookSchema = new Schema<IBook>({
    clerkId: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    author: { type: String, required: true },
    persona: { type: String },
    fileURL: { type: String, required: true },  // PDF 檔案可以被公開存取的 URL（上傳到 Vercel Blob 後回傳的 url）。
    fileBlobKey: { type: String, required: true },  // PDF 在 Blob Storage 裡的 key / 路徑（uploadedPdfBlob.pathname）。
    coverURL: { type: String },
    coverBlobKey: { type: String }, // 封面圖片在 Blob Storage 裡的 key。
    fileSize: { type: Number, required: true },
    totalSegments: { type: Number, default: 0 },    // 該書被拆成幾個文字段落（對應 IBookSegment 的數量）。
}, { timestamps: true });   // 讓 Mongoose 自動幫你加上 createdAt、updatedAt 兩個欄位，對應到 IBook 介面裡的時間欄位。

const Book = models.Book || model<IBook>('Book', BookSchema);   // 若 models.Book 已存在，就直接用現成的。

export default Book;
