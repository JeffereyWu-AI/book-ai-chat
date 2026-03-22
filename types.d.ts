// 把「資料長什麼樣子」「元件要哪些 props」用 TypeScript 定義清楚，讓整個專案在編譯時就能檢查型別錯誤。

import { Document, Types } from 'mongoose';
import { ReactNode } from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';
import z from 'zod';
import { UploadSchema } from '@/lib/zod';

// ============================================
// DATABASE MODELS
// ============================================

export interface IBook extends Document {
    _id: string;
    clerkId: string;
    title: string;
    slug: string;
    author: string;
    persona?: string;   // 可選，這本書對話時使用的 AI 人格設定
    fileURL: string;
    fileBlobKey: string;
    coverURL: string;
    coverBlobKey?: string;
    fileSize: number;
    totalSegments: number;  // 被切成幾段用來處理
    createdAt: Date;
    updatedAt: Date;
}

// 把一本書拆成多段儲存
export interface IBookSegment extends Document {
    clerkId: string;
    bookId: Types.ObjectId;
    content: string;
    segmentIndex: number;   // 這一段是第幾段
    pageNumber?: number;
    wordCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// 用來記錄「使用者跟某本書語音聊天的一次 session」
export interface IVoiceSession extends Document {
    _id: string;
    clerkId: string;
    bookId: Types.ObjectId;
    startedAt: Date;
    endedAt?: Date;
    durationSeconds: number;
    billingPeriodStart: Date;   // 計費週期起始，用來做方案限制與統計
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// FORM & INPUT TYPES
// ============================================

export type BookUploadFormValues = z.infer<typeof UploadSchema>;

// 在「新增書本」流程，準備要寫進資料庫的 payload。
export interface CreateBook {
    clerkId: string;
    title: string;
    author: string;
    persona?: string;
    fileURL: string;
    fileBlobKey: string;
    coverURL?: string;
    coverBlobKey?: string;
    fileSize: number;
}

export interface TextSegment {
    text: string;
    segmentIndex: number;
    pageNumber?: number;
    wordCount: number;
}

// 決定 BookCard 元件需要哪四項資料才能渲染。
export interface BookCardProps {
    title: string;
    author: string;
    coverURL: string;
    slug: string;
}

export interface Messages {
    role: string;
    content: string;
}

export interface ShadowBoxProps {
    children: ReactNode;
    className?: string; // 額外加的樣式
}

// 給「語音選擇下拉 / 切換按鈕」元件用
export interface VoiceSelectorProps {
    disabled?: boolean;
    className?: string;
    value?: string; // 目前選中的 voice ID
    onChange: (voiceId: string) => void;    // 當選項改變時要執行的 callback
}

export interface InputFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    placeholder?: string;
    disabled?: boolean;
}

export interface FileUploadFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    acceptTypes: string[];  // 允許的檔案類型
    disabled?: boolean;
    icon: LucideIcon;
    placeholder: string;
    hint: string;
}
import {PLANS, PlanType} from "@/lib/subscription-constants";

// 檢查「使用者是否還可以開啟語音會話」時的回傳結果
export interface SessionCheckResult {
    allowed: boolean;
    currentCount: number;
    limit: number;  // 方案上限
    plan: PlanType; // 使用者目前方案類型（免費／付費等）
    maxDurationMinutes: number; // 此次 session 允許的最長分鐘數
    error?: string;
}

// 開始語音 session API 的回傳格式
export interface StartSessionResult {
    success: boolean;
    sessionId?: string;
    maxDurationMinutes?: number;
    error?: string;
    isBillingError?: boolean;
}

// 結束語音 session API 的回傳格式，簡單成功/失敗。
export interface EndSessionResult {
    success: boolean;
    error?: string;
}
