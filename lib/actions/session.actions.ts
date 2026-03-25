// 管理「語音對話 session」的開始與結束，並同時處理訂閱限制（subscription / billing）

// Frontend (VapiControls)
//         ↓
// useVapi (呼叫 start / end)
//         ↓
// session.actions.ts 
//         ↓
// MongoDB（VoiceSession collection）

'use server';   // 只能在 Server side 執行

import {EndSessionResult, StartSessionResult} from "@/types";
import {connectToDatabase} from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import {getCurrentBillingPeriodStart} from "@/lib/subscription-constants";

// 開始一個語音 session（並檢查是否允許）
// 流程總覽
// 1. 連接 DB
// 2. 取得用戶訂閱 plan
// 3. 計算當月使用量
// 4. 檢查是否超過限制
// 5. 如果 OK → 建立 session
// 6. 回傳 sessionId

export const startVoiceSession = async (clerkId: string, bookId: string): Promise<StartSessionResult> => {
    try {
        await connectToDatabase();

        // Limits/Plan to see whether a session is allowed.
        const { getUserPlan } = await import("@/lib/subscription.server");
        const { PLAN_LIMITS, getCurrentBillingPeriodStart } = await import("@/lib/subscription-constants");

        // 取得訂閱資訊
        const plan = await getUserPlan();
        const limits = PLAN_LIMITS[plan];
        const billingPeriodStart = getCurrentBillingPeriodStart();
        // 每個月重新計算 usage

        const sessionCount = await VoiceSession.countDocuments({
            clerkId,
            billingPeriodStart
        }); // 查：「這個 user 在這個月用了幾次」

        if (sessionCount >= limits.maxSessionsPerMonth) {
            const { revalidatePath } = await import("next/cache");
            revalidatePath("/");

            return {
                success: false,
                error: `You have reached the monthly session limit for your ${plan} plan (${limits.maxSessionsPerMonth}). Please upgrade for more sessions.`,
                isBillingError: true,
            };
        }

        const session = await VoiceSession.create({
            clerkId,
            bookId,
            startedAt: new Date(),
            billingPeriodStart,
            durationSeconds: 0,
        });

        return {
            success: true,
            sessionId: session._id.toString(),
            maxDurationMinutes: limits.maxDurationPerSession,
        }
    } catch (e) {
        console.error('Error starting voice session', e);
        return { success: false, error: 'Failed to start voice session. Please try again later.' }
    }
}

// 結束 session + 記錄使用時間
export const endVoiceSession = async (sessionId: string, durationSeconds: number): Promise<EndSessionResult> => {
    try {
        await connectToDatabase();

        const result = await VoiceSession.findByIdAndUpdate(sessionId, {
            endedAt: new Date(),
            durationSeconds,
        }); // 存：結束時間, 使用秒數

        if(!result) return { success: false, error: 'Voice session not found.' }

        return { success: true }
    } catch (e) {
        console.error('Error ending voice session', e);
        return { success: false, error: 'Failed to end voice session. Please try again later.' }
    }
}

// 這個 session.actions.ts 是整個語音系統的「後端控制中心」，負責 session 建立、結束與用量限制，並支撐 SaaS 計費邏輯。