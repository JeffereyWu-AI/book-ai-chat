// 一個「集中放常數設定」的檔案，用來存放：

// 品牌顏色（JS 裡要用的版本）
// 首頁展示用的範例書籍資料
// 上傳檔案的限制（檔案大小、允許的格式）
// AI 助理（VAPI）相關的設定（assistant ID、語音選項、語音參數）
// Clerk 登入介面的客製化樣式

// Brand color - used in JS files where CSS variables aren't available
export const BRAND_COLOR = '#212a3b'; // Dark blue-gray
export const BRAND_COLOR_HOVER = '#3d485e'; // Medium blue-gray

// Sample books for the homepage (using Open Library covers)
// 每本書的欄位：
// _id：字串型 ID（方便在 React 裡當 key 用）
// title：書名
// author：作者
// slug：用來組 URL 的簡短字串，例如 /books/clean-code
// coverURL：書封圖片網址，使用 Open Library 的封面服務
// coverColor：卡片背景色，用來搭配封面（較柔和的米色）
export const sampleBooks = [
    {
        _id: '1',
        title: 'Clean Code',
        author: 'Robert Cecil Martin',
        slug: 'clean-code',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '2',
        title: 'JavaScript: The Definitive Guide',
        author: 'David Flanagan',
        slug: 'javascript-the-definitive-guide',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780596805524-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '3',
        title: 'Brave New World',
        author: 'Aldous Huxley',
        slug: 'brave-new-world',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '4',
        title: 'Rich Dad Poor Dad',
        author: 'Robert Kiyosaki',
        slug: 'rich-dad-poor-dad',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '5',
        title: 'Deep Work',
        author: 'Cal Newport',
        slug: 'deep-work',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '6',
        title: 'How to Win Friends and Influence People',
        author: 'Dale Carnegie',
        slug: 'how-to-win-friends-and-influence-people',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '7',
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        slug: 'the-power-of-habit',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781400069286-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '8',
        title: 'Atomic Habits',
        author: 'James Clear',
        slug: 'atomic-habits',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '9',
        title: 'The Courage to Be Disliked',
        author: 'Fumitake Koga & Ichiro Kishimi',
        slug: 'the-courage-to-be-disliked',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781501197274-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '10',
        title: '1984',
        author: 'George Orwell',
        slug: '1984',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
        coverColor: '#f8f4e9',
    },
];

// File validation helpers
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ACCEPTED_PDF_TYPES = ['application/pdf'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Pre-configured VAPI assistant ID (hardcoded for this app)
// 在呼叫 VAPI 或某個 SDK 時，會用到這個 ASSISTANT_ID 來指定是哪個 AI 助理。
export const ASSISTANT_ID = process.env.NEXT_PUBLIC_ASSISTANT_ID!;

// 11Labs Voice IDs - Optimized for conversational AI
// Voices selected for natural, engaging book conversations
// id：ElevenLabs 中對應的 voice ID（發 API 時要用的）
// name：顯示給使用者看的名稱
// description：描述聲音的特性（男女、口音、風格等等）
export const voiceOptions = {
    // Male voices
    dave: { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave', description: 'Young male, British-Essex, casual & conversational' },
    daniel: { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Middle-aged male, British, authoritative but warm' },
    chris: { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', description: 'Male, casual & easy-going' },
    // Female voices
    rachel: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Young female, American, calm & clear' },
    sarah: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Young female, American, soft & approachable' },
};

// Voice categories for the selector UI
export const voiceCategories = {
    male: ['dave', 'daniel', 'chris'],
    female: ['rachel', 'sarah'],
};

// Default voice
// 預設使用 rachel 這個 voice 作為初始選項。
export const DEFAULT_VOICE = 'rachel';

// ElevenLabs voice settings optimized for conversational AI
// stability：
// 越低越有變化、較有情緒；
// 0.30–0.50 聽起來比較自然。
// similarityBoost：
// 提高聲音跟原始樣本相似度，同時保持清晰。
// style：
// 控制風格強度，0 是最自然、延遲較低、穩定。
// useSpeakerBoost：
// 打開一些強化聲音品質的功能。
// speed：
// 語速，1.0 是正常對話速度。
export const VOICE_SETTINGS = {
    stability: 0.45, // Lower for more emotional, dynamic delivery (0.30-0.50 is natural)
    similarityBoost: 0.75, // Enhances clarity without distortion
    style: 0, // Keep at 0 for conversational AI (higher = more latency, less stable)
    useSpeakerBoost: true, // Improves voice quality
    speed: 1.0, // Natural conversation speed
};

// VAPI configuration for natural conversation
// NOTE: These settings should be configured in the VAPI Dashboard for the assistant
// They are kept here for reference and documentation purposes
export const VAPI_DASHBOARD_CONFIG = {
    // Turn-taking settings
    startSpeakingPlan: {
        smartEndpointingEnabled: true,
        waitSeconds: 0.4,   // 等待 0.4 秒再開始
    },
    stopSpeakingPlan: {
        numWords: 2,
        voiceSeconds: 0.2,
        backoffSeconds: 1.0,
    },
    // Timing settings
    silenceTimeoutSeconds: 30,  // 沉默多久後視為對話結束（30 秒）。
    responseDelaySeconds: 0.4,  // 回應前延遲 0.4 秒，讓感覺自然。
    llmRequestDelaySeconds: 0.1,    // 往 LLM 發請求前的延遲。
    // Conversation features
    backgroundDenoisingEnabled: true,   // 背景降噪。
    backchannelingEnabled: true,    // 回饋聲（例如「嗯嗯」「我懂」那種短語或聲音）。
    fillerInjectionEnabled: false,  // 是否加入填充詞（這裡關閉）。
};

// Clerk appearance overrides - Warm Literary Style
// Note: Tailwind requires static class names at build time, so we hardcode color values here
export const CLERK_AUTH_APPEARANCE_OVERRIDE = {
    rootBox: 'mx-auto',
    card: 'shadow-none border-none rounded-xl bg-transparent',
    headerTitle: '!text-2xl font-bold text-[#212a3b]',
    headerSubtitle: '!mt-3 !text-sm text-[#3d485e]',    // 標題與副標題的字體大小、顏色。
    socialButtonsBlockButton:
        '!border border-[rgba(33,42,59,0.12)] hover:bg-[#212a3b]/10 transition-all h-12 text-lg !rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.08)]',
    socialButtonsBlockButtonText: 'font-medium !text-[#212a3b] !text-lg',
    formButtonPrimary:
        'bg-[#212a3b] hover:bg-[#3d485e] text-white font-medium !border-0 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.08)] normal-case !h-12 !text-lg !rounded-xl',
    formFieldInput:
        '!border !border-[rgba(33,42,59,0.12)] !rounded-xl focus:ring-[#212a3b] focus:border-[#212a3b] !h-12 !min-h-12 !text-lg !bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]',
    formFieldLabel: 'text-[#212a3b] font-medium text-lg',
    footerActionLink: 'text-[#212a3b] hover:text-[#3d485e] text-base font-medium',
};


