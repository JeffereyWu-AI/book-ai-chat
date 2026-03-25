// 根據當前登入用戶（Clerk），判斷其訂閱方案（free / standard / pro），並提供對應的使用限制

import {auth} from "@clerk/nextjs/server";
import {PLANS, PLAN_LIMITS, PlanType} from "@/lib/subscription-constants";

// 判斷使用者屬於哪個訂閱方案
// 執行流程
// 1. 取得 auth 資訊
// 2. 如果沒登入 → FREE
// 3. 檢查是否 PRO
// 4. 檢查是否 STANDARD
// 5. 否則 → FREE
export const getUserPlan = async (): Promise<PlanType> => {
    const { has, userId } = await auth();

    if (!userId) return PLANS.FREE; // 未登入使用者自動歸為 free tier

    if (has({ plan: "pro" })) return PLANS.PRO;
    if (has({ plan: "standard" })) return PLANS.STANDARD;

    return PLANS.FREE;
}
// 直接取得「當前用戶的限制」
export const getPlanLimits = async () => {
    const plan = await getUserPlan();
    return PLAN_LIMITS[plan];
}
