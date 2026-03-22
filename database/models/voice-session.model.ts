// 「語音對話 Session」的 Mongoose Model 定義檔。

import { model, Schema, models } from "mongoose";
import { IVoiceSession } from "@/types";

const VoiceSessionSchema = new Schema<IVoiceSession>({
    clerkId: { type: String, required: true, index: true }, // 這次語音 session 是哪個使用者的（Clerk user ID）。
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },   // 跟哪一本書聊天：指向 Book collection 的 _id。
    startedAt: { type: Date, required: true, default: Date.now },   // 這次語音對話開始時間。
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0, required: true },  // 這次對話總共持續了多少秒。
    billingPeriodStart: { type: Date, required: true, index:  true },   // 這次語音 session 所屬的「計費期間開始時間」。
}, { timestamps: true });

VoiceSessionSchema.index({ clerkId: 1, billingPeriodStart: 1 });    // 比如要計算「這個使用者在這個計費期間用了多少語音時間」時，可以高效查詢

const VoiceSession = models.VoiceSession || model<IVoiceSession>('VoiceSession', VoiceSessionSchema);

export default VoiceSession;
