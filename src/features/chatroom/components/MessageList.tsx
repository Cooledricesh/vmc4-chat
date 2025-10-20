"use client";

import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { useChatRoom } from '../context/chatroom-context';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export function MessageList() {
  const { state, actions, refs } = useChatRoom();
  const { user: currentUser } = useCurrentUser();
  const { ref: loadMoreRef, inView } = useInView();
  const prevScrollHeightRef = useRef(0);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (state.ui.isAutoScroll && refs.messageListRef.current) {
      refs.messageListRef.current.scrollTop = refs.messageListRef.current.scrollHeight;
    }
  }, [state.messages.items, state.ui.isAutoScroll, refs.messageListRef]);

  // Load more messages when scroll to top
  useEffect(() => {
    if (inView && state.messages.hasMore && !state.messages.isLoading) {
      const currentScrollHeight = refs.messageListRef.current?.scrollHeight || 0;
      prevScrollHeightRef.current = currentScrollHeight;

      actions.loadMoreMessages().then(() => {
        // Maintain scroll position after loading more messages
        if (refs.messageListRef.current) {
          const newScrollHeight = refs.messageListRef.current.scrollHeight;
          const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
          refs.messageListRef.current.scrollTop = scrollDiff;
        }
      });
    }
  }, [inView, state.messages.hasMore, state.messages.isLoading, actions, refs.messageListRef]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (!refs.messageListRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = refs.messageListRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    actions.setAutoScroll(isAtBottom);
  };

  if (state.messages.error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">메시지를 불러오는데 실패했습니다</p>
          <p className="mt-2 text-sm text-gray-500">{state.messages.error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={refs.messageListRef}
      onScroll={handleScroll}
      className="flex flex-1 flex-col-reverse overflow-y-auto"
    >
      {/* Messages (reversed order for flex-col-reverse) */}
      {state.messages.items.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwnMessage={message.userId === currentUser?.id}
          onReply={actions.setReplyTarget}
          onDelete={actions.deleteMessage}
          onLike={actions.toggleReaction}
          currentUserId={currentUser?.id}
        />
      ))}

      {/* Load More Trigger */}
      {state.messages.hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {state.messages.isLoading && <Loader2 className="h-6 w-6 animate-spin text-gray-400" />}
        </div>
      )}

      {/* Empty State */}
      {state.messages.items.length === 0 && !state.messages.isLoading && (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400">아직 메시지가 없습니다. 첫 메시지를 보내보세요!</p>
        </div>
      )}
    </div>
  );
}
