// 整個專案的 MongoDB 連線管理程式

import mongoose from 'mongoose';    // 載入 mongoose 套件，用來連線 MongoDB 和定義 Schema / Model。

const MONGODB_URI = process.env.MONGODB_URI;    // 從環境變數讀取 MongoDB 連線字串（通常在 .env 裡設定）。

if (!MONGODB_URI) throw new Error('Please define the MONGODB_URI environment variable');    // 若沒有設定 MONGODB_URI，在專案啟動時就直接丟錯。

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null    // 已經建立好的 mongoose 連線
        promise: Promise<typeof mongoose> | null
    }
}

let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });    // 之後會用來存連線資訊的快取物件。

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;    // cached.conn 不為 null 表示已經成功連過 MongoDB。

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        cached.conn = await cached.promise; // 等待連線完成
    } catch (e) {
        cached.promise = null;
        console.error('MongoDB connection error. Please make sure MongoDB is running. ' + e);
        throw e;
    }

    console.info('Connected to MongoDB');
    return cached.conn; // 回傳 mongoose 連線實例
}
