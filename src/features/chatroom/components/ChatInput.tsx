"use client";

import React, { useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { useChatRoom } from '../context/chatroom-context';
import { cn } from '@/lib/utils';

export function ChatInput() {
  const { state, actions, refs } = useChatRoom();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 키로 전송 (Shift+Enter는 줄바꿈)
    if (e.key === 'Enter' && !e.shiftKey && !state.input.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => {
    actions.setComposing(true);
  };

  const handleCompositionEnd = () => {
    actions.setComposing(false);
  };

  const handleSend = () => {
    const content = state.input.value.trim();
    if (!content) return;

    actions.sendMessage(content);
  };

  // Auto-focus input on mount
  useEffect(() => {
    refs.inputRef.current?.focus();
  }, [refs.inputRef]);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Reply Preview */}
      {state.input.replyTarget && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500">
              {state.input.replyTarget.user?.nickname || '알 수 없음'}에게 답장
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {state.input.replyTarget.content}
            </p>
          </div>
          <button
            onClick={() => actions.setReplyTarget(null)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            title="답장 취소"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            ref={refs.inputRef}
            value={state.input.value}
            onChange={(e) => actions.updateInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="메시지를 입력하세요..."
            className="max-h-32 min-h-[44px] w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={1}
            style={{
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!state.input.value.trim()}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg transition-colors',
            state.input.value.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
          title="전송"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-400">
        Enter로 전송, Shift+Enter로 줄바꿈
      </p>
    </div>
  );
}
