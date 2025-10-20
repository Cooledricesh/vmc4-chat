"use client";

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Heart, Reply, Trash2 } from 'lucide-react';
import type { Message } from '../lib/dto';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  isLiked?: boolean;
  currentUserId?: string;
}

export function MessageItem({
  message,
  isOwnMessage,
  onReply,
  onDelete,
  onLike,
  isLiked,
  currentUserId,
}: MessageItemProps) {
  const likeCount = message.reactions.filter((r) => r.type === 'like').length;
  const userHasLiked = currentUserId
    ? message.reactions.some((r) => r.userId === currentUserId && r.type === 'like')
    : false;

  return (
    <div
      className={cn(
        'group flex flex-col gap-1 px-4 py-2 hover:bg-gray-50',
        isOwnMessage && 'items-end'
      )}
    >
      {/* Author and Time */}
      <div className={cn('flex items-center gap-2 text-xs', isOwnMessage && 'flex-row-reverse')}>
        <span className="font-medium text-gray-700">
          {message.user?.nickname || '알 수 없음'}
        </span>
        <span className="text-gray-400">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: ko })}
        </span>
      </div>

      {/* Reply Preview */}
      {message.parentMessage && (
        <div
          className={cn(
            'rounded-lg border-l-2 border-gray-300 bg-gray-50 px-3 py-2 text-sm',
            isOwnMessage && 'border-r-2 border-l-0'
          )}
        >
          <p className="text-xs font-medium text-gray-500">
            {message.parentMessage.user?.nickname || '알 수 없음'}
          </p>
          <p className="text-gray-600">
            {message.parentMessage.isDeleted
              ? '삭제된 메시지'
              : message.parentMessage.content}
          </p>
        </div>
      )}

      {/* Message Content */}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'max-w-md rounded-lg px-4 py-2',
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-900',
            message.isDeleted && 'bg-gray-100 text-gray-400 italic'
          )}
        >
          {message.isDeleted ? '삭제된 메시지입니다' : message.content}
        </div>

        {/* Actions (visible on hover) */}
        {!message.isDeleted && (
          <div className="invisible flex items-center gap-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            {/* Like Button */}
            {!isOwnMessage && onLike && (
              <button
                onClick={() => onLike(message.id)}
                className={cn(
                  'rounded p-1 transition-colors hover:bg-gray-200',
                  userHasLiked && 'text-red-500'
                )}
                title="좋아요"
              >
                <Heart className={cn('h-4 w-4', userHasLiked && 'fill-current')} />
              </button>
            )}

            {/* Reply Button */}
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="rounded p-1 transition-colors hover:bg-gray-200"
                title="답장"
              >
                <Reply className="h-4 w-4" />
              </button>
            )}

            {/* Delete Button (only for own messages) */}
            {isOwnMessage && onDelete && (
              <button
                onClick={() => {
                  if (confirm('메시지를 삭제하시겠습니까?')) {
                    onDelete(message.id);
                  }
                }}
                className="rounded p-1 text-red-500 transition-colors hover:bg-red-50"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reactions Display */}
      {likeCount > 0 && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs text-gray-500',
            isOwnMessage && 'self-end'
          )}
        >
          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          <span>{likeCount}</span>
        </div>
      )}
    </div>
  );
}
