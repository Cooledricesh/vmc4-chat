"use client";

import React, { use } from 'react';
import { ChatRoomProvider } from '@/features/chatroom/context/chatroom-context';
import { ChatHeader } from '@/features/chatroom/components/ChatHeader';
import { MessageList } from '@/features/chatroom/components/MessageList';
import { ChatInput } from '@/features/chatroom/components/ChatInput';

interface ChatRoomPageProps {
  params: Promise<{
    id: string;
  }>;
}

function ChatRoomContent() {
  return (
    <div className="flex h-screen flex-col">
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </div>
  );
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  return (
    <ChatRoomProvider roomId={roomId}>
      <ChatRoomContent />
    </ChatRoomProvider>
  );
}
