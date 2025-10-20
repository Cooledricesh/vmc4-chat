"use client";

import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { createClient } from '@/lib/supabase/client';
import type { Message, MessageType } from '../lib/dto';
import { chatRoomReducer, initialChatRoomState } from './chatroom-reducer';
import type { ChatRoomState } from './chatroom-types';
import { ChatActionType } from './chatroom-types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuthStore } from '@/features/auth/stores/auth-store';

// Context Value Type
interface ChatRoomContextValue {
  state: ChatRoomState;
  actions: {
    // Message Actions
    sendMessage: (content: string, type?: MessageType) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;

    // Reaction Actions
    toggleReaction: (messageId: string) => Promise<void>;

    // Input Actions
    updateInput: (value: string) => void;
    setReplyTarget: (message: Message | null) => void;
    clearInput: () => void;

    // UI Actions
    toggleEmojiPicker: () => void;
    setAutoScroll: (value: boolean) => void;

    // Composition Actions
    setComposing: (value: boolean) => void;
  };
  refs: {
    messageListRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLTextAreaElement>;
  };
}

const ChatRoomContext = createContext<ChatRoomContextValue | null>(null);

export function useChatRoom() {
  const context = useContext(ChatRoomContext);
  if (!context) {
    throw new Error('useChatRoom must be used within ChatRoomProvider');
  }
  return context;
}

interface ChatRoomProviderProps {
  roomId: string;
  children: React.ReactNode;
}

export function ChatRoomProvider({ roomId, children }: ChatRoomProviderProps) {
  const [state, dispatch] = useReducer(chatRoomReducer, initialChatRoomState);
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // Refs
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  // 인증 상태 확인
  useEffect(() => {
    console.log('[ChatRoom] Authentication status:', { isAuthenticated, user });
    if (!isAuthenticated || !user) {
      console.warn('[ChatRoom] User is not authenticated, but middleware should have redirected');
    }
  }, [isAuthenticated, user]);

  // Load room info and messages on mount
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        // Load room info
        const roomResponse = await apiClient.get(`/api/chatroom/${roomId}`);
        dispatch({
          type: ChatActionType.INIT_ROOM,
          payload: { room: roomResponse.data.room },
        });

        // Join room
        await apiClient.post(`/api/chatroom/${roomId}/join`);

        // Load messages
        dispatch({ type: ChatActionType.LOAD_MESSAGES });
        const messagesResponse = await apiClient.get(`/api/chatroom/${roomId}/messages`);

        dispatch({
          type: ChatActionType.LOAD_MESSAGES_SUCCESS,
          payload: {
            messages: messagesResponse.data.messages,
            hasMore: messagesResponse.data.hasMore,
          },
        });

        // Load participants
        const participantsResponse = await apiClient.get(`/api/chatroom/${roomId}/participants`);
        dispatch({
          type: ChatActionType.SET_PARTICIPANTS,
          payload: participantsResponse.data.participants,
        });
      } catch (error) {
        const errorMessage = extractApiErrorMessage(error);
        console.error('Failed to load room data:', errorMessage);
        console.error('Full error object:', error);

        // Check if it's an axios error with response
        if ((error as any)?.response) {
          console.error('Error response status:', (error as any).response.status);
          console.error('Error response data:', (error as any).response.data);
        }

        // If room not found, redirect to main page
        if (errorMessage.includes('찾을 수 없습니다')) {
          router.push('/');
        }
      }
    };

    loadRoomData();
  }, [roomId, router]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    console.log('[ChatRoom] Setting up Realtime connection for room:', roomId);

    const supabase = supabaseRef.current;

    // Create channel for this room
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
        },
      },
    });

    console.log('[ChatRoom] Created channel:', channel);

    // Listen for new messages
    channel.on('broadcast', { event: 'new_message' }, (payload: { payload: Message }) => {
      dispatch({
        type: ChatActionType.ADD_MESSAGE,
        payload: payload.payload,
      });
    });

    // Listen for deleted messages
    channel.on('broadcast', { event: 'message_deleted' }, (payload: { payload: { messageId: string } }) => {
      dispatch({
        type: ChatActionType.DELETE_MESSAGE,
        payload: payload.payload.messageId,
      });
    });

    // Listen for reaction updates
    channel.on('broadcast', { event: 'reaction_updated' }, (payload: {
      payload: {
        messageId: string;
        isLiked: boolean;
        totalLikes: number;
      }
    }) => {
      dispatch({
        type: ChatActionType.UPDATE_REACTION,
        payload: payload.payload,
      });
    });

    // Listen for user joined
    channel.on('broadcast', { event: 'user_joined' }, (payload: {
      payload: {
        userId: string;
        nickname: string;
      }
    }) => {
      console.log(`${payload.payload.nickname}님이 입장했습니다.`);
      // Optionally add system message
    });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Connected to room: ${roomId}`);
        dispatch({
          type: ChatActionType.SET_CONNECTION_STATUS,
          payload: 'connected',
        });

        // Broadcast user joined event (optional)
        // Note: You might want to get user info from auth store
        // await channel.send({
        //   type: 'broadcast',
        //   event: 'user_joined',
        //   payload: {
        //     userId: 'current-user-id',
        //     nickname: 'current-user-nickname',
        //   },
        // });
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[ChatRoom] Channel error occurred');
        console.error('[ChatRoom] This usually means:');
        console.error('  1. Supabase Realtime is not enabled for your project');
        console.error('  2. Your Supabase URL or ANON key is incorrect');
        console.error('  3. Network connectivity issues');
        console.error('[ChatRoom] Please check your Supabase project settings');
        dispatch({
          type: ChatActionType.SET_CONNECTION_STATUS,
          payload: 'error',
        });
      } else if (status === 'TIMED_OUT') {
        console.error('[ChatRoom] Channel connection timed out');
        dispatch({
          type: ChatActionType.SET_CONNECTION_STATUS,
          payload: 'disconnected',
        });
      } else {
        console.log('[ChatRoom] Channel status changed to:', status);
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log(`Disconnecting from room: ${roomId}`);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  // Actions
  const actions = useMemo(() => ({
    sendMessage: async (content: string, type: MessageType = 'text') => {
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        roomId,
        userId: 'current-user', // Will be replaced by server
        content,
        type,
        parentMessageId: state.input.replyTarget?.id || null,
        isDeleted: false,
        reactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      dispatch({
        type: ChatActionType.ADD_OPTIMISTIC_MESSAGE,
        payload: { tempId, message: tempMessage },
      });

      try {
        const response = await apiClient.post(`/api/chatroom/${roomId}/messages`, {
          content,
          type,
          parentMessageId: state.input.replyTarget?.id,
        });

        // Confirm optimistic update
        dispatch({
          type: ChatActionType.CONFIRM_OPTIMISTIC_MESSAGE,
          payload: { tempId, message: response.data.message },
        });

        // Broadcast new message to other users
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'new_message',
            payload: response.data.message,
          });
        }

        // Clear input
        dispatch({ type: ChatActionType.CLEAR_INPUT });
      } catch (error) {
        // Revert optimistic update
        dispatch({
          type: ChatActionType.REVERT_OPTIMISTIC_MESSAGE,
          payload: tempId,
        });

        const errorMessage = extractApiErrorMessage(error);
        console.error('Failed to send message:', errorMessage);
        console.error('Full error object:', error);

        // Check if it's an axios error with response
        if ((error as any)?.response) {
          console.error('Error response status:', (error as any).response.status);
          console.error('Error response data:', (error as any).response.data);
        }

        alert(errorMessage);
      }
    },

    deleteMessage: async (messageId: string) => {
      try {
        await apiClient.delete(`/api/chatroom/${roomId}/messages/${messageId}`);

        dispatch({
          type: ChatActionType.DELETE_MESSAGE,
          payload: messageId,
        });

        // Broadcast message deletion to other users
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'message_deleted',
            payload: { messageId },
          });
        }
      } catch (error) {
        const errorMessage = extractApiErrorMessage(error);
        console.error('Failed to delete message:', errorMessage);
        alert(errorMessage);
      }
    },

    loadMoreMessages: async () => {
      if (state.messages.isLoading || !state.messages.hasMore) return;

      dispatch({ type: ChatActionType.LOAD_MORE_MESSAGES });

      try {
        const offset = state.messages.items.length;
        const response = await apiClient.get(`/api/chatroom/${roomId}/messages`, {
          params: { offset, limit: 50 },
        });

        dispatch({
          type: ChatActionType.LOAD_MORE_MESSAGES_SUCCESS,
          payload: {
            messages: response.data.messages,
            hasMore: response.data.hasMore,
          },
        });
      } catch (error) {
        const errorMessage = extractApiErrorMessage(error);
        console.error('Failed to load more messages:', errorMessage);
      }
    },

    toggleReaction: async (messageId: string) => {
      if (!user?.id) {
        console.error('User ID is required to toggle reaction');
        return;
      }

      try {
        const response = await apiClient.post(`/api/chatroom/${roomId}/messages/${messageId}/reactions`, {
          type: 'like',
        });

        const reactionPayload = {
          messageId,
          isLiked: response.data.isLiked,
          totalLikes: response.data.totalLikes,
          userId: user.id,
        };

        dispatch({
          type: ChatActionType.UPDATE_REACTION,
          payload: reactionPayload,
        });

        // Broadcast reaction update to other users
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'reaction_updated',
            payload: reactionPayload,
          });
        }
      } catch (error) {
        const errorMessage = extractApiErrorMessage(error);
        console.error('Failed to toggle reaction:', errorMessage);
        alert(errorMessage);
      }
    },

    updateInput: (value: string) => {
      dispatch({ type: ChatActionType.SET_INPUT_VALUE, payload: value });
    },

    setReplyTarget: (message: Message | null) => {
      dispatch({ type: ChatActionType.SET_REPLY_TARGET, payload: message });
    },

    clearInput: () => {
      dispatch({ type: ChatActionType.CLEAR_INPUT });
    },

    toggleEmojiPicker: () => {
      dispatch({ type: ChatActionType.TOGGLE_EMOJI_PICKER });
    },

    setAutoScroll: (value: boolean) => {
      dispatch({ type: ChatActionType.SET_AUTO_SCROLL, payload: value });
    },

    setComposing: (value: boolean) => {
      dispatch({ type: ChatActionType.SET_COMPOSING, payload: value });
    },
  }), [roomId, state.input.replyTarget, state.messages.isLoading, state.messages.hasMore, state.messages.items.length]);

  const value: ChatRoomContextValue = {
    state,
    actions,
    refs: {
      messageListRef,
      inputRef,
    },
  };

  return (
    <ChatRoomContext.Provider value={value}>
      {children}
    </ChatRoomContext.Provider>
  );
}
