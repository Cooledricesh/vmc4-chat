"use client";

import type { ChatRoomState, ChatAction } from './chatroom-types';
import { ChatActionType } from './chatroom-types';

export const initialChatRoomState: ChatRoomState = {
  room: null,
  messages: {
    items: [],
    hasMore: false,
    isLoading: false,
    error: null,
  },
  optimistic: {
    messages: new Map(),
  },
  participants: {
    list: [],
    count: 0,
  },
  input: {
    value: '',
    replyTarget: null,
    isComposing: false,
  },
  ui: {
    isAutoScroll: true,
    showEmojiPicker: false,
  },
  connection: {
    status: 'idle',
    reconnectAttempt: 0,
  },
};

export function chatRoomReducer(state: ChatRoomState, action: ChatAction): ChatRoomState {
  switch (action.type) {
    case ChatActionType.INIT_ROOM:
      return {
        ...state,
        room: action.payload.room,
      };

    case ChatActionType.RESET_STATE:
      return initialChatRoomState;

    case ChatActionType.LOAD_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          isLoading: true,
          error: null,
        },
      };

    case ChatActionType.LOAD_MESSAGES_SUCCESS:
      return {
        ...state,
        messages: {
          items: action.payload.messages,
          hasMore: action.payload.hasMore,
          isLoading: false,
          error: null,
        },
      };

    case ChatActionType.LOAD_MESSAGES_ERROR:
      return {
        ...state,
        messages: {
          ...state.messages,
          isLoading: false,
          error: action.payload,
        },
      };

    case ChatActionType.LOAD_MORE_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          isLoading: true,
        },
      };

    case ChatActionType.LOAD_MORE_MESSAGES_SUCCESS:
      return {
        ...state,
        messages: {
          items: [...state.messages.items, ...action.payload.messages],
          hasMore: action.payload.hasMore,
          isLoading: false,
          error: null,
        },
      };

    case ChatActionType.ADD_MESSAGE: {
      // 중복 메시지 방지
      const exists = state.messages.items.some((m) => m.id === action.payload.id);
      if (exists) return state;

      return {
        ...state,
        messages: {
          ...state.messages,
          items: [action.payload, ...state.messages.items],
        },
      };
    }

    case ChatActionType.UPDATE_MESSAGE: {
      return {
        ...state,
        messages: {
          ...state.messages,
          items: state.messages.items.map((msg) =>
            msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
          ),
        },
      };
    }

    case ChatActionType.DELETE_MESSAGE: {
      return {
        ...state,
        messages: {
          ...state.messages,
          items: state.messages.items.map((msg) =>
            msg.id === action.payload ? { ...msg, isDeleted: true } : msg
          ),
        },
      };
    }

    case ChatActionType.ADD_OPTIMISTIC_MESSAGE: {
      const newOptimistic = new Map(state.optimistic.messages);
      newOptimistic.set(action.payload.tempId, action.payload.message);

      return {
        ...state,
        messages: {
          ...state.messages,
          items: [action.payload.message, ...state.messages.items],
        },
        optimistic: {
          messages: newOptimistic,
        },
      };
    }

    case ChatActionType.CONFIRM_OPTIMISTIC_MESSAGE: {
      const newOptimistic = new Map(state.optimistic.messages);
      newOptimistic.delete(action.payload.tempId);

      return {
        ...state,
        messages: {
          ...state.messages,
          items: state.messages.items.map((msg) =>
            msg.id === action.payload.tempId ? action.payload.message : msg
          ),
        },
        optimistic: {
          messages: newOptimistic,
        },
      };
    }

    case ChatActionType.REVERT_OPTIMISTIC_MESSAGE: {
      const newOptimistic = new Map(state.optimistic.messages);
      newOptimistic.delete(action.payload);

      return {
        ...state,
        messages: {
          ...state.messages,
          items: state.messages.items.filter((msg) => msg.id !== action.payload),
        },
        optimistic: {
          messages: newOptimistic,
        },
      };
    }

    case ChatActionType.UPDATE_REACTION: {
      return {
        ...state,
        messages: {
          ...state.messages,
          items: state.messages.items.map((msg) => {
            if (msg.id === action.payload.messageId) {
              // reactions 배열 업데이트 로직은 서버에서 받아온 totalLikes로 대체
              return { ...msg };
            }
            return msg;
          }),
        },
      };
    }

    case ChatActionType.SET_INPUT_VALUE:
      return {
        ...state,
        input: {
          ...state.input,
          value: action.payload,
        },
      };

    case ChatActionType.SET_REPLY_TARGET:
      return {
        ...state,
        input: {
          ...state.input,
          replyTarget: action.payload,
        },
      };

    case ChatActionType.CLEAR_REPLY_TARGET:
      return {
        ...state,
        input: {
          ...state.input,
          replyTarget: null,
        },
      };

    case ChatActionType.SET_COMPOSING:
      return {
        ...state,
        input: {
          ...state.input,
          isComposing: action.payload,
        },
      };

    case ChatActionType.CLEAR_INPUT:
      return {
        ...state,
        input: {
          ...state.input,
          value: '',
          replyTarget: null,
        },
      };

    case ChatActionType.SET_AUTO_SCROLL:
      return {
        ...state,
        ui: {
          ...state.ui,
          isAutoScroll: action.payload,
        },
      };

    case ChatActionType.TOGGLE_EMOJI_PICKER:
      return {
        ...state,
        ui: {
          ...state.ui,
          showEmojiPicker: !state.ui.showEmojiPicker,
        },
      };

    case ChatActionType.SET_PARTICIPANTS:
      return {
        ...state,
        participants: {
          list: action.payload,
          count: action.payload.length,
        },
      };

    case ChatActionType.SET_CONNECTION_STATUS:
      return {
        ...state,
        connection: {
          ...state.connection,
          status: action.payload,
        },
      };

    case ChatActionType.INCREMENT_RECONNECT_ATTEMPT:
      return {
        ...state,
        connection: {
          ...state.connection,
          reconnectAttempt: state.connection.reconnectAttempt + 1,
        },
      };

    case ChatActionType.RESET_RECONNECT_ATTEMPT:
      return {
        ...state,
        connection: {
          ...state.connection,
          reconnectAttempt: 0,
        },
      };

    default:
      return state;
  }
}
