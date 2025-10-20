"use client";

import React, { useEffect, useState } from 'react';
import { Send, X, Smile } from 'lucide-react';
import { useChatRoom } from '../context/chatroom-context';
import { cn } from '@/lib/utils';

// 자주 사용하는 이모지 목록
const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
  '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
  '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
  '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
  '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️',
  '🤞', '🤟', '🤘', '👌', '👈', '👉', '👆', '👇',
  '❤️', '💕', '💖', '💗', '💓', '💞', '💝', '💘',
  '🔥', '✨', '💯', '⭐', '🌟', '💫', '🎉', '🎊',
];

export function ChatInput() {
  const { state, actions, refs } = useChatRoom();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const handleEmojiSelect = (emoji: string) => {
    actions.updateInput(state.input.value + emoji);
    setShowEmojiPicker(false);
    refs.inputRef.current?.focus();
  };

  // Auto-focus input on mount
  useEffect(() => {
    refs.inputRef.current?.focus();
  }, [refs.inputRef]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

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
        <div className="relative flex-1">
          <textarea
            ref={refs.inputRef}
            value={state.input.value}
            onChange={(e) => actions.updateInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="메시지를 입력하세요..."
            className="max-h-32 min-h-[44px] w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

          {/* Emoji Button */}
          <div className="emoji-picker-container absolute bottom-2 right-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="이모지 선택"
              type="button"
            >
              <Smile className="h-5 w-5" />
            </button>

            {/* Emoji Picker Dropdown */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <div className="mb-2 text-sm font-medium text-gray-700">이모지 선택</div>
                <div className="grid max-h-60 grid-cols-8 gap-1 overflow-y-auto">
                  {COMMON_EMOJIS.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="flex h-10 w-10 items-center justify-center rounded transition-colors hover:bg-gray-100"
                      type="button"
                    >
                      <span className="text-xl">{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
