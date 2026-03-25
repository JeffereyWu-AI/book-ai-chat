// 安全地處理檔案上傳（upload）到 Vercel Blob storage，並結合使用者驗證（Clerk）來限制誰可以上傳。

// 接收前端的 upload 請求
// 驗證使用者是否登入（Clerk）
// 限制檔案類型 + 大小
// 幫你把檔案安全上傳到 Vercel Blob Storage

import {NextResponse} from "next/server";
import {handleUpload, HandleUploadBody} from "@vercel/blob/client";
import {auth} from "@clerk/nextjs/server";
import {MAX_FILE_SIZE} from "@/lib/constants";

export async function POST(request: Request): Promise<NextResponse> {
    try {
        // 把前端傳來的 JSON 解析出來
        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            token: process.env.BLOB_READ_WRITE_TOKEN,
            body,
            request,
            onBeforeGenerateToken: async () => {
                const { userId } = await auth();

                if(!userId) {
                    throw new Error('Unauthorized: User not authenticated');
                }   // 如果沒登入 → 直接拒絕

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                    addRandomSuffix: true,
                    maximumSizeInBytes: MAX_FILE_SIZE,
                    tokenPayload: JSON.stringify({ userId })    // 之後 upload 完你可以知道：「這個檔案是誰上傳的」
                }
        } ,
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('File uploaded to blob: ', blob.url)    // 印出檔案 URL

                const payload = tokenPayload ? JSON.parse(tokenPayload): null
                const userId = payload?.userId;

                // TODO: PostHog
            }
        });

        return NextResponse.json(jsonResponse)  // 回傳給前端 upload 結果
    } catch (e) {
        const message = e instanceof Error ? e.message : "An unknown error occurred";
        const status = message.includes('Unauthorized') ? 401 : 500;
        console.error('Upload error', e);
        const clientMessage = status === 401 ? 'Unauthorized' : 'Upload failed';
        return NextResponse.json({ error: clientMessage }, { status });
    }
}
