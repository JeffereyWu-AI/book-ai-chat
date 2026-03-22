// 這個專案的「共用工具函式」集合

import { TextSegment } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DEFAULT_VOICE, voiceOptions } from './constants';

// 把多個條件式的 class 串成一個字串，並且用 tailwind-merge 幫你「去除衝突的 Tailwind 類別」。
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// twMerge(...)：例如同時有 p-2 和 p-4 時，自動保留最後的 p-4。

// Serialize Mongoose documents to plain JSON objects (strips ObjectId, Date, etc.)
// 把 Mongoose 資料轉成純 JSON
export const serializeData = <T>(data: T): T => JSON.parse(JSON.stringify(data));
// JSON.stringify → 變成 JSON 字串
// JSON.parse → 再變回普通 JS 物件。


// Auto generate slug
// 把書名或檔名變成路由可用的 slug，例如："Rich Dad Poor Dad.pdf" → "rich-dad-poor-dad"
export function generateSlug(text: string): string {
  return text
      .replace(/\.[^/.]+$/, '') // Remove file extension (.pdf, .txt, etc.)
      .toLowerCase() // Convert to lowercase
      .trim() // Remove whitespace from both ends
      .replace(/[^\w\s-]/g, '') // Remove special characters (keep letters, numbers, spaces, hyphens)
      .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Escape regex special characters to prevent ReDoS attacks
// 使用者輸入的搜尋字串如果直接放進正則表達式，可能會壞掉或造成安全問題。
// 這個函式會把像 .、*、? 等特殊符號前面加 \，變成純文字匹配。
export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};


// Splits text content into segments for MongoDB storage and search
// 把整本書的全文拆成一段段小文字，方便存到 BookSegment、也方便搜尋。
export const splitIntoSegments = (
    text: string,
    segmentSize: number = 500, // Maximum words per segment
    overlapSize: number = 50, // Words to overlap between segments for context
): TextSegment[] => {
  // Validate parameters to prevent infinite loops
  if (segmentSize <= 0) {
    throw new Error('segmentSize must be greater than 0');
  }
  if (overlapSize < 0 || overlapSize >= segmentSize) {
    throw new Error('overlapSize must be >= 0 and < segmentSize');
  }

  // text.split(/\s+/) 分成一個個字。
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const segments: TextSegment[] = [];

  let segmentIndex = 0;
  let startIndex = 0;

  // 每次取最多 500 個字組成一段，記錄 segmentIndex 和 wordCount。
  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + segmentSize, words.length);
    const segmentWords = words.slice(startIndex, endIndex);
    const segmentText = segmentWords.join(' ');

    segments.push({
      text: segmentText,
      segmentIndex,
      wordCount: segmentWords.length,
    });

    segmentIndex++;

    if (endIndex >= words.length) break;
    startIndex = endIndex - overlapSize;  // 下一段從 endIndex - overlapSize 開始，讓前後段有重疊。
  }

  return segments;
};

// Get voice data by persona key or voice ID
// 根據 persona 或聲音 ID 找對應 voice 設定
export const getVoice = (persona?: string) => {
  if (!persona) return voiceOptions[DEFAULT_VOICE];

  // Find by voice ID
  // 先用 id 找（v.id === persona）。
  const voiceEntry = Object.values(voiceOptions).find((v) => v.id === persona);
  if (voiceEntry) return voiceEntry;

  // Find by key
  const voiceByKey = voiceOptions[persona as keyof typeof voiceOptions];
  if (voiceByKey) return voiceByKey;

  // Default fallback
  return voiceOptions[DEFAULT_VOICE];
};


// Format duration in seconds to MM:SS format 把秒數轉成 MM:SS
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);  // 分鐘 = seconds / 60 取整。
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 這是整個「上傳書本流程」的重要一環，UploadForm 用它來解析 PDF。
export async function parsePDFFile(file: File) {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
      ).toString();
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;

    // Render first page as cover image
    // 生成封面圖
    const firstPage = await pdfDocument.getPage(1);
    const viewport = firstPage.getViewport({ scale: 2 }); // 2x scale for better quality

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    await firstPage.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to data URL
    const coverDataURL = canvas.toDataURL('image/png');
    // 之後 UploadForm 會把這個「從 PDF 產生出來的封面圖」上傳到 Blob。

    // Extract text from all pages
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();  // 所有文字片段。
      const pageText = textContent.items
          .filter((item) => 'str' in item)
          .map((item) => (item as { str: string }).str)
          .join(' ');
      fullText += pageText + '\n';
    }

    // Split text into segments for search
    // 用前面的 splitIntoSegments(fullText) 切成 TextSegment[]。
    const segments = splitIntoSegments(fullText);

    // Clean up PDF document resources
    await pdfDocument.destroy();

    return {
      content: segments,  // 用來存 BookSegment
      cover: coverDataURL,  // 用來當書封來源
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
