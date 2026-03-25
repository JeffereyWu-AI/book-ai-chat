// 這個文件是一個 Next.js App Router 的 API 路由，專門用來作為 Vapi（語音 AI 平台）的 Function Calling 端點。簡單說，當使用者透過語音跟 AI 助手對話時，AI 可以呼叫這個 API 來搜尋書籍內的段落，然後把搜尋結果回傳給使用者。

import { NextResponse } from 'next/server';

import { searchBookSegments } from '@/lib/actions/book.actions';

// Helper function to process book search logic
async function processBookSearch(bookId: unknown, query: unknown) {
    // Validate inputs before conversion to prevent null/undefined becoming "null"/"undefined" strings
    if (bookId == null || query == null || query === '') {
        return { result: 'Missing bookId or query' };
    }

    // Convert bookId to string
    const bookIdStr = String(bookId);
    const queryStr = String(query).trim();

    // 轉成字串後再檢查是否為 "null"、"undefined" 字串（防止某些情況下 null 被序列化成字串 "null"）

    // Additional validation after conversion
    if (!bookIdStr || bookIdStr === 'null' || bookIdStr === 'undefined' || !queryStr) {
        return { result: 'Missing bookId or query' };
    }

    // Execute search
    const searchResult = await searchBookSegments(bookIdStr, queryStr, 3);

    // Return results
    // 搜尋失敗或無結果
    if (!searchResult.success || !searchResult.data?.length) {
        return { result: 'No information found about this topic in the book.' };
    }

    const combinedText = searchResult.data
        .map((segment) => (segment as { content: string }).content)
        .join('\n\n');
    
    // 有結果 → 把所有段落的 content 用 \n\n 連接成一段文字回傳

    return { result: combinedText };
}

export async function GET() {
    return NextResponse.json({ status: 'ok' });
}
// 一個簡單的健康檢查（health check），直接回傳 { status: 'ok' }。可以用來確認這個 API 端點是否正常運作。

// Parse tool arguments that may arrive as a JSON string or an object
function parseArgs(args: unknown): Record<string, unknown> {
    if (!args) return {};
    if (typeof args === 'string') {
        try { return JSON.parse(args); } catch { return {}; }
    }   // 一個 JSON 字串 → 需要 JSON.parse()
    return args as Record<string, unknown>;
}

// 收到 POST 請求
//     ↓
// 解析 body → 找 functionCall 或 toolCallList
//     ↓
// functionCall 存在？
//     ├── 是 → 檢查 name 是否為 "searchBook"
//     │       ├── 是 → 呼叫 processBookSearch → 回傳結果
//     │       └── 否 → 回傳 "Unknown function"
//     │
//     └── 否 → 檢查 toolCallList
//             ├── 空或不存在 → 回傳 "No tool calls found"
//             └── 有內容 → 逐一處理每個 toolCall
//                         ├── name === "searchBook" → 搜尋
//                         └── 其他 → "Unknown function"


export async function POST(request: Request) {
    try {
        const body = await request.json();

        console.log('Vapi search-book request:', JSON.stringify(body, null, 2));

        // Support multiple Vapi formats
        // 單一呼叫
        const functionCall = body?.message?.functionCall;
        // 批次呼叫，支援多個工具同時呼叫
        const toolCallList = body?.message?.toolCallList || body?.message?.toolCalls;

        // Handle single functionCall format
        if (functionCall) {
            const { name, parameters } = functionCall;
            const parsed = parseArgs(parameters);

            if (name === 'searchBook') {
                const result = await processBookSearch(parsed.bookId, parsed.query);
                return NextResponse.json(result);
            }

            return NextResponse.json({ result: `Unknown function: ${name}` });
        }

        // Handle toolCallList format (array of calls)
        if (!toolCallList || toolCallList.length === 0) {
            return NextResponse.json({
                results: [{ result: 'No tool calls found' }],
            });
        }

        const results = [];

        for (const toolCall of toolCallList) {
            const { id, function: func } = toolCall;
            const name = func?.name;
            const args = parseArgs(func?.arguments);

            if (name === 'searchBook') {
                const searchResult = await processBookSearch(args.bookId, args.query);
                results.push({ toolCallId: id, ...searchResult });
            } else {
                results.push({ toolCallId: id, result: `Unknown function: ${name}` });
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Vapi search-book error:', error);
        return NextResponse.json({
            results: [{ result: 'Error processing request' }],
        });
        // 任何未預期的錯誤都會被捕獲，回傳通用錯誤訊息，避免暴露內部細節。
    }
}

// 使用者語音對話 (Vapi)
//         │
//         ▼
//   Vapi AI 判斷需要搜尋書籍
//         │
//         ▼
//   POST /api/vapi/search-book
//         │
//         ▼
//   解析請求格式 (functionCall / toolCallList)
//         │
//         ▼
//   processBookSearch(bookId, query)
//         │
//         ▼
//   searchBookSegments() ← 查詢資料庫/索引
//         │
//         ▼
//   回傳搜尋結果給 Vapi → AI 用結果回答使用者
