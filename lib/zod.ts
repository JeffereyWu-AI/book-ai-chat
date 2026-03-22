// 表單驗證規則 的集中定義檔
import { z } from 'zod';
import {MAX_FILE_SIZE, ACCEPTED_PDF_TYPES, ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE} from './constants';

export const UploadSchema = z.object({
    // 必須是字串。至少 1 個字，不能是空字串。最多 100 個字，避免書名過長。
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    author: z.string().min(1, "Author name is required").max(100, "Author name is too long"),

    // 必須是非空字串。用來存像 rachel, dave 等 voice id。
    persona: z.string().min(1, "Please select a voice"),

    // 確認這個欄位存在且真的是一個 File 物件。自訂條件：檔案大小 ≤ MAX_FILE_SIZE（50MB）。檢查 file.type 是否在 ACCEPTED_PDF_TYPES 裡（通常只含 application/pdf）。
    pdfFile: z.instanceof(File, { message: "PDF file is required" })
        .refine((file) => file.size <= MAX_FILE_SIZE, "File size must be less than 50MB")
        .refine((file) => ACCEPTED_PDF_TYPES.includes(file.type), "Only PDF files are accepted"),

    // 使用者沒選檔案時會是 undefined，不會報錯。若沒有檔案（!file），直接通過驗證。
    coverImage: z.instanceof(File).optional()
        .refine((file) => !file || file.size <= MAX_IMAGE_SIZE, "Image size must be less than 10MB")
        .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), "Only .jpg, .jpeg, .png and .webp formats are supported"),
});
