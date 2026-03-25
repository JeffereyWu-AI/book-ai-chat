// 顯示語音對話的「逐字稿（transcript）」，包含歷史訊息 + 即時輸入 + AI 即時回應
'use client';

import { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { Messages } from '@/types';

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

const Transcript = ({ messages, currentMessage, currentUserMessage }: TranscriptProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };
  // 每次有新訊息 → 自動滾到底

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessage, currentUserMessage]);
  // 只要以下任一變化：新 message, AI 輸出更新, 使用者輸入更新, 就滾到底

  const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="transcript-empty">
        <Mic className="size-12 text-[#212a3b] mb-4" />
        <h2 className="transcript-empty-text"><b>No conversation yet</b></h2>
        <p className="transcript-empty-hint">
          Click the mic button above to start talking
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="transcript-messages overflow-y-auto pr-2 flex-1">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`transcript-message ${
            message.role === 'user' ? 'transcript-message-user' : 'transcript-message-assistant'
          }`}
        >
          <div
            className={`transcript-bubble ${
              message.role === 'user' ? 'transcript-bubble-user' : 'transcript-bubble-assistant'
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}

      {/* User Streaming Message */}
      {/* 即時使用者輸入 */}
      {currentUserMessage && (
        <div className="transcript-message transcript-message-user">
          <div className="transcript-bubble transcript-bubble-user">
            {currentUserMessage}
            <span className="transcript-cursor" />
          </div>
        </div>
      )}

      {/* Assistant Streaming Message */}
      {/* 即時 AI 回應 */}
      {currentMessage && (
        <div className="transcript-message transcript-message-assistant">
          <div className="transcript-bubble transcript-bubble-assistant">
            {currentMessage}
            <span className="transcript-cursor" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcript;
