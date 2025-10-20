"use client";

import type { Message, Participant, RoomInfo } from '../lib/dto';

// Connection Status
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// ChatRoom State
export interface ChatRoomState {
  // Room Information
  room: RoomInfo | null;

  // Messages
  messages: {
    items: Message[];
    hasMore: boolean;
    isLoading: boolean;
    error: Error | null;
  };

  // Optimistic Updates
  optimistic: {
    messages: Map<string, Message>;
  };

  // Participants
  participants: {
    list: Participant[];
    count: number;
  };

  // Input State
  input: {
    value: string;
    replyTarget: Message | null;
    isComposing: boolean;
  };

  // UI State
  ui: {
    isAutoScroll: boolean;
    showEmojiPicker: boolean;
  };

  // Connection State
  connection: {
    status: ConnectionStatus;
    reconnectAttempt: number;
  };
}

// Action Types
export enum ChatActionType {
  // Initialization
  INIT_ROOM = 'INIT_ROOM',
  RESET_STATE = 'RESET_STATE',

  // Messages
  LOAD_MESSAGES = 'LOAD_MESSAGES',
  LOAD_MESSAGES_SUCCESS = 'LOAD_MESSAGES_SUCCESS',
  LOAD_MESSAGES_ERROR = 'LOAD_MESSAGES_ERROR',
  LOAD_MORE_MESSAGES = 'LOAD_MORE_MESSAGES',
  LOAD_MORE_MESSAGES_SUCCESS = 'LOAD_MORE_MESSAGES_SUCCESS',

  ADD_MESSAGE = 'ADD_MESSAGE',
  UPDATE_MESSAGE = 'UPDATE_MESSAGE',
  DELETE_MESSAGE = 'DELETE_MESSAGE',

  // Optimistic Updates
  ADD_OPTIMISTIC_MESSAGE = 'ADD_OPTIMISTIC_MESSAGE',
  CONFIRM_OPTIMISTIC_MESSAGE = 'CONFIRM_OPTIMISTIC_MESSAGE',
  REVERT_OPTIMISTIC_MESSAGE = 'REVERT_OPTIMISTIC_MESSAGE',

  // Reactions
  UPDATE_REACTION = 'UPDATE_REACTION',

  // Input Management
  SET_INPUT_VALUE = 'SET_INPUT_VALUE',
  SET_REPLY_TARGET = 'SET_REPLY_TARGET',
  CLEAR_REPLY_TARGET = 'CLEAR_REPLY_TARGET',
  SET_COMPOSING = 'SET_COMPOSING',
  CLEAR_INPUT = 'CLEAR_INPUT',

  // UI State
  SET_AUTO_SCROLL = 'SET_AUTO_SCROLL',
  TOGGLE_EMOJI_PICKER = 'TOGGLE_EMOJI_PICKER',

  // Participants
  SET_PARTICIPANTS = 'SET_PARTICIPANTS',

  // Connection
  SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS',
  INCREMENT_RECONNECT_ATTEMPT = 'INCREMENT_RECONNECT_ATTEMPT',
  RESET_RECONNECT_ATTEMPT = 'RESET_RECONNECT_ATTEMPT',
}

// Action Union Type
export type ChatAction =
  | { type: ChatActionType.INIT_ROOM; payload: { room: RoomInfo } }
  | { type: ChatActionType.RESET_STATE }
  | { type: ChatActionType.LOAD_MESSAGES }
  | { type: ChatActionType.LOAD_MESSAGES_SUCCESS; payload: { messages: Message[]; hasMore: boolean } }
  | { type: ChatActionType.LOAD_MESSAGES_ERROR; payload: Error }
  | { type: ChatActionType.LOAD_MORE_MESSAGES }
  | { type: ChatActionType.LOAD_MORE_MESSAGES_SUCCESS; payload: { messages: Message[]; hasMore: boolean } }
  | { type: ChatActionType.ADD_MESSAGE; payload: Message }
  | { type: ChatActionType.UPDATE_MESSAGE; payload: { id: string; updates: Partial<Message> } }
  | { type: ChatActionType.DELETE_MESSAGE; payload: string }
  | { type: ChatActionType.ADD_OPTIMISTIC_MESSAGE; payload: { tempId: string; message: Message } }
  | { type: ChatActionType.CONFIRM_OPTIMISTIC_MESSAGE; payload: { tempId: string; message: Message } }
  | { type: ChatActionType.REVERT_OPTIMISTIC_MESSAGE; payload: string }
  | { type: ChatActionType.UPDATE_REACTION; payload: { messageId: string; isLiked: boolean; totalLikes: number; userId: string } }
  | { type: ChatActionType.SET_INPUT_VALUE; payload: string }
  | { type: ChatActionType.SET_REPLY_TARGET; payload: Message | null }
  | { type: ChatActionType.CLEAR_REPLY_TARGET }
  | { type: ChatActionType.SET_COMPOSING; payload: boolean }
  | { type: ChatActionType.CLEAR_INPUT }
  | { type: ChatActionType.SET_AUTO_SCROLL; payload: boolean }
  | { type: ChatActionType.TOGGLE_EMOJI_PICKER }
  | { type: ChatActionType.SET_PARTICIPANTS; payload: Participant[] }
  | { type: ChatActionType.SET_CONNECTION_STATUS; payload: ConnectionStatus }
  | { type: ChatActionType.INCREMENT_RECONNECT_ATTEMPT }
  | { type: ChatActionType.RESET_RECONNECT_ATTEMPT };
