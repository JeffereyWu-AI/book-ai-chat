// 專門處理「書本相關後端邏輯」的 Server Actions 集中地
'use server';   // 'use server'：告訴 Next.js 這個檔案裡的函式是 Server Actions，只能在伺服器端執行。

import {CreateBook, TextSegment} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import {escapeRegex, generateSlug, serializeData} from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import {getUserPlan} from "@/lib/subscription.server";

// 取全部 / 搜尋書籍
export const getAllBooks = async (search?: string) => {
    try {
        await connectToDatabase();

        let query = {};

        if (search) {
            const escapedSearch = escapeRegex(search);  // 處理字串安全
            const regex = new RegExp(escapedSearch, 'i');
            query = {
                $or: [
                    { title: { $regex: regex } },
                    { author: { $regex: regex } },
                ]
            };
        }

        const books = await Book.find(query).sort({ createdAt: -1 }).lean();

        return {
            success: true,
            data: serializeData(books)
        }
    } catch (e) {
        console.error('Error connecting to database', e);
        return {
            success: false, error: e
        }
    }
}

// 檢查這個標題是否已建立過
export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({slug}).lean();

        if(existingBook) {
            return {
                exists: true,
                book: serializeData(existingBook)
            }
        }

        return {
            exists: false,
        }
    } catch (e) {
        console.error('Error checking book exists', e);
        return {
            exists: false, error: e
        }
    }
}

// 在通過檔案上傳與解析後，新建一本書，並檢查「使用者是否超過當前方案允許的最大書本數」。
export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(data.title);

        const existingBook = await Book.findOne({slug}).lean();

        if(existingBook) {
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
            }
        }   // 讓前端直接導去那本書。

        // Todo: Check subscription limits before creating a book
        const { getUserPlan } = await import("@/lib/subscription.server");
        const { PLAN_LIMITS } = await import("@/lib/subscription-constants");

        const { auth } = await import("@clerk/nextjs/server");
        const { userId } = await auth();

        // 取得 userId，並確認這個 action 的 data.clerkId 和 userId 一致，否則回 Unauthorized。
        if (!userId || userId !== data.clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const plan = await getUserPlan();
        const limits = PLAN_LIMITS[plan];

        const bookCount = await Book.countDocuments({ clerkId: userId });

        if (bookCount >= limits.maxBooks) {
            const { revalidatePath } = await import("next/cache");
            revalidatePath("/");    // 重繪首頁 cache。

            return {
                success: false,
                error: `You have reached the maximum number of books allowed for your ${plan} plan (${limits.maxBooks}). Please upgrade to add more books.`,
                isBillingError: true,
            };  // 前端會導到 /subscriptions。
        }

        const book = await Book.create({...data, clerkId: userId, slug, totalSegments: 0});

        return {
            success: true,
            data: serializeData(book),
        }
    } catch (e) {
        console.error('Error creating a book', e);

        return {
            success: false,
            error: e,
        }
    }
}

// 用 slug 找一本書
export const getBookBySlug = async (slug: string) => {
    try {
        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return { success: false, error: 'Book not found' };
        }   // 依 slug 查一本 Book，找不到就回「Book not found」。

        return {
            success: true,
            data: serializeData(book)
        }
    } catch (e) {
        console.error('Error fetching book by slug', e);
        return {
            success: false, error: e
        }
    }
}

// 把解析後的書段存進 DB
export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
    try {
        await connectToDatabase();

        console.log('Saving book segments...');

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }) => ({
            clerkId, bookId, content: text, segmentIndex, pageNumber, wordCount
        }));
        // 把每個 TextSegment（text, segmentIndex, pageNumber, wordCount）轉成 BookSegment schema 需要的格式

        await BookSegment.insertMany(segmentsToInsert); // 一次插入所有段。

        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log('Book segments saved successfully.');

        return {
            success: true,
            data: { segmentsCreated: segments.length}
        }
    } catch (e) {
        console.error('Error saving book segments', e);

        return {
            success: false,
            error: e,
        }
    }
}

// Searches book segments using MongoDB text search with regex fallback
// 在某本書中搜尋文字
// 在某一本書的所有 BookSegment 中搜尋關鍵字，用於 AI 對話或書內搜尋。
export const searchBookSegments = async (bookId: string, query: string, limit: number = 5) => {
    try {
        await connectToDatabase();

        console.log(`Searching for: "${query}" in book ${bookId}`);

        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // Try MongoDB text search first (requires text index)
        // 第一階段：嘗試 MongoDB 的全文索引（text index）搜尋
        let segments: Record<string, unknown>[] = [];
        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,   // 只在这本书的所有 BookSegment 裡搜，不看别的书。
                $text: { $search: query },  // Mongo 会用你之前建好的 content: 'text' 索引来查
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ score: { $meta: 'textScore' } })    // 按 MongoDB 计算出的「相關度分数（textScore）」排序，最相关的在前面。
                .limit(limit)
                .lean();
        } catch {
            // Text index may not exist — fall through to regex fallback
            // 如果没有建立 text index 或 Mongo 不支援，就设为空，交给后面第二阶段 regex 来处理
            segments = [];
        }

        // Fallback: regex search matching ANY keyword
        // 把 query 切成關鍵字 keywords，長度 > 2 的才用。
        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);    // 以空白拆分使用者输入
            // 过滤掉太短的字（长度 ≤ 2），例如 "a", "to", "of" 等，这些通常没什么用，又会让搜索变慢。
            const pattern = keywords.map(escapeRegex).join('|');
            // escapeRegex：把关键字裡可能有的特殊字符（如 . * ? 等）转义掉，避免破坏正则语法。
            // join('|')：在 regex 裡 | 代表「或」。
            // 找出 content 字串裡 只要有任何一个 关键字出现就算符合。

            segments = await BookSegment.find({
                bookId: bookObjectId,
                content: { $regex: pattern, $options: 'i' },    // $options: 'i' = 忽略大小写（case-insensitive）
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ segmentIndex: 1 })  // 按段落顺序排序（从前往后）。
                .limit(limit)
                .lean();
        }

        console.log(`Search complete. Found ${segments.length} results`);

        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (error) {
        console.error('Error searching segments:', error);
        return {
            success: false,
            error: (error as Error).message,
            data: [],
        };
    }
};

// 這支 book.actions.ts 把「書相關的一整套後端流程」串起來：
// 列表 / 搜尋：getAllBooks
// 單本書查詢：getBookBySlug
// 建立書＋方案限制：checkBookExists + createBook
// 書內容分段儲存：saveBookSegments
// 書內文字搜尋：searchBookSegments