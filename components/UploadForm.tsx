// 整個新增書本流程的前端控制中心

'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, ImageIcon } from 'lucide-react';
import { UploadSchema } from '@/lib/zod';
import { BookUploadFormValues } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ACCEPTED_PDF_TYPES, ACCEPTED_IMAGE_TYPES, DEFAULT_VOICE } from '@/lib/constants';
import FileUploader from './FileUploader';
import VoiceSelector from './VoiceSelector';
import LoadingOverlay from './LoadingOverlay';
import {useAuth, useUser} from "@clerk/nextjs";
import { toast } from 'sonner';
import {checkBookExists, createBook, saveBookSegments} from "@/lib/actions/book.actions";   // Server Actions，和資料庫互動。
import {useRouter} from "next/navigation";
import {parsePDFFile} from "@/lib/utils";
import {upload} from "@vercel/blob/client"; // 上傳檔案到 Vercel Blob Storage

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { userId } = useAuth();   // 從 Clerk 取得目前登入使用者的 ID
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const form = useForm<BookUploadFormValues>({
        resolver: zodResolver(UploadSchema),    // 表單驗證交給 UploadSchema。
        defaultValues: {
            title: '',
            author: '',
            persona: '',
            pdfFile: undefined,
            coverImage: undefined,
        },
    });

    const onSubmit = async (data: BookUploadFormValues) => {
        if(!userId) {
           return toast.error("Please login to upload books");
        }   // 若 userId 不存在，顯示錯誤 Please login to upload books，直接 return，不會繼續上傳流程。

        setIsSubmitting(true);  // 讓 UI 顯示 loading，避免重複提交。

        // PostHog -> Track Book Uploads...

        try {
            const existsCheck = await checkBookExists(data.title);

            if(existsCheck.exists && existsCheck.book) {
                toast.info("Book with same title already exists.");
                form.reset()
                router.push(`/books/${existsCheck.book.slug}`)
                return;
            }
            // 若已存在：
            // 顯示提示 toast。
            // 重設表單。
            // 導到那本書的詳細頁 /books/[slug]。
            // 中止流程。

            const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase();    // 把書名變成適合檔名／slug 的形式（空白變 -，轉小寫）
            const pdfFile = data.pdfFile;

            const parsedPDF = await parsePDFFile(pdfFile);  // 解析 PDF，回傳內容與封面資訊（parsedPDF.content, parsedPDF.cover）。

            if(parsedPDF.content.length === 0) {    // 若解析後 content 是空的，視為失敗
                toast.error("Failed to parse PDF. Please try again with a different file.");
                return;
            }

            const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
                access: 'public',
                handleUploadUrl: '/api/upload',
                contentType: 'application/pdf'
            });

            let coverUrl: string;

            // 若使用者有上傳 coverImage
            // 直接把這個檔案上傳到 Blob。
            if(data.coverImage) {
                const coverFile = data.coverImage;
                const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, coverFile, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                    contentType: coverFile.type
                });
                coverUrl = uploadedCoverBlob.url;
            } else {    // 若沒有上傳封面
                const response = await fetch(parsedPDF.cover)   // 用 parsedPDF.cover 提供的 URL 抓一張封面圖（例如從 PDF 第一頁產生的圖）。
                const blob = await response.blob(); // 將抓回來的 blob 再上傳到 Blob Storage。

                const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
                    access: 'public',
                    handleUploadUrl: '/api/upload',
                    contentType: 'image/png'
                });
                coverUrl = uploadedCoverBlob.url;
            }

            // 在資料庫建立 Book 記錄
            const book = await createBook({
                clerkId: userId,
                title: data.title,
                author: data.author,
                persona: data.persona,
                fileURL: uploadedPdfBlob.url,
                fileBlobKey: uploadedPdfBlob.pathname,
                coverURL: coverUrl,
                fileSize: pdfFile.size,
            });

            if(!book.success) {
                toast.error(book.error as string || "Failed to create book");
                if (book.isBillingError) {  // 若 isBillingError 為 true，代表方案限制或計費問題，導到 /subscriptions。
                    router.push("/subscriptions");
                }
                return;
            }

            // 這裡多一層檢查，是因為 createBook 內部也可能再次判斷是否重複。
            if(book.alreadyExists) {
                toast.info("Book with same title already exists.");
                form.reset()
                router.push(`/books/${book.data.slug}`)
                return;
            }

            const segments = await saveBookSegments(book.data._id, userId, parsedPDF.content);

            if(!segments.success) {
                toast.error("Failed to save book segments");
                throw new Error("Failed to save book segments");
            }

            form.reset();
            router.push('/');
        } catch (error) {
            console.error(error);

            toast.error("Failed to upload book. Please try again later.");
        } finally {
            setIsSubmitting(false); // 不論成功或失敗，都把 isSubmitting 設回 false。
        }
    };

    if (!isMounted) return null;

    return (
        <>
            {isSubmitting && <LoadingOverlay />}

            <div className="new-book-wrapper">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* 1. PDF File Upload */}
                        <FileUploader
                            control={form.control}
                            name="pdfFile"
                            label="Book PDF File"
                            acceptTypes={ACCEPTED_PDF_TYPES}    // 限制檔案類型為 ACCEPTED_PDF_TYPES（只允許 PDF）。
                            icon={Upload}
                            placeholder="Click to upload PDF"
                            hint="PDF file (max 50MB)"
                            disabled={isSubmitting}
                        />

                        {/* 2. Cover Image Upload */}
                        <FileUploader
                            control={form.control}
                            name="coverImage"
                            label="Cover Image (Optional)"
                            acceptTypes={ACCEPTED_IMAGE_TYPES}
                            icon={ImageIcon}
                            placeholder="Click to upload cover image"
                            hint="Leave empty to auto-generate from PDF"
                            disabled={isSubmitting}
                        />

                        {/* 3. Title Input */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            className="form-input"
                                            placeholder="ex: Rich Dad Poor Dad"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 4. Author Input */}
                        <FormField
                            control={form.control}
                            name="author"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Author Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            className="form-input"
                                            placeholder="ex: Robert Kiyosaki"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 5. Voice Selector */}
                        <FormField
                            control={form.control}
                            name="persona"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                                    <FormControl>
                                    {/* 使用 VoiceSelector 元件，讓使用者選擇 AI 聲音 */}
                                        <VoiceSelector
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 6. Submit Button */}
                        {/* 按下後觸發 handleSubmit(onSubmit)。 */}
                        <Button type="submit" className="form-btn" disabled={isSubmitting}>
                            Begin Synthesis
                        </Button>
                    </form>
                </Form>
            </div>
        </>
    );
};

export default UploadForm;

// 總結流程（從使用者角度）
// 1. 進到 /books/new，看到這個表單（UploadForm）。
// 2. 選擇 PDF → （可選）上傳封面 → 填書名、作者 → 選擇 AI 聲音 → 點「Begin Synthesis」。
// 3. 前端：
    // 驗證欄位（zod）。
    // 檢查是否登入。
    // 檢查同名書是否存在。
    // 解析 PDF → 上傳 PDF & 封面到 Blob。
    // 呼叫 createBook 建立書本。
    // 呼叫 saveBookSegments 儲存分段內容。
// 4. 成功 → 表單清空 → 回到首頁；失敗 → 顯示對應錯誤或導向訂閱頁。