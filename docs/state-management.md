# 📋 채팅방 상태 관리 설계 문서
**Context + useReducer 아키텍처**

---

## 📊 아키텍처 개요

### 시스템 구조
```
┌─────────────────────────────────────────────────────────────┐
│                     ChatRoomProvider                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   useReducer                        │   │
│  │    - State Management                               │   │
│  │    - Action Dispatching                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Side Effects                      │   │
│  │    - WebSocket Connection                          │   │
│  │    - API Calls (React Query)                       │   │
│  │    - Local Storage Sync                            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Context Value                       │   │
│  │    - State                                         │   │
│  │    - Actions                                        │   │
│  │    - Computed Values                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │           Consumer Components          │
         │  - ChatHeader                          │
         │  - MessageList                         │
         │  - MessageItem                         │
         │  - ChatInput                           │
         │  - EmojiPicker                         │
         └────────────────────────────────────────┘
```

---

## 🔄 데이터 흐름 시각화

### 1. 초기 로드 플로우
```
[페이지 진입]
    ↓
[ChatRoomProvider 마운트]
    ↓
[인증 체크] ──❌──→ [로그인 페이지 리디렉션]
    ↓ ✅
[채팅방 유효성 검증] ──❌──→ [메인 페이지 리디렉션]
    ↓ ✅
[병렬 데이터 로드]
    ├─→ [채팅방 정보 조회]
    ├─→ [메시지 목록 조회]
    ├─→ [참여자 목록 조회]
    └─→ [WebSocket 연결]
    ↓
[State 초기화]
    ↓
[하위 컴포넌트 렌더링]
```

### 2. 메시지 전송 플로우
```
[사용자 입력]
    ↓
[전송 액션 디스패치]
    ↓
[낙관적 업데이트]
    ├─→ [임시 메시지 State 추가]
    └─→ [UI 즉시 업데이트]
    ↓
[API 호출]
    ├─✅→ [성공: 임시 메시지를 실제 메시지로 교체]
    └─❌→ [실패: 롤백 + 에러 표시 + 재시도 옵션]
    ↓
[WebSocket 브로드캐스트]
    ↓
[다른 사용자 수신]
```

### 3. 실시간 업데이트 플로우
```
[WebSocket 메시지 수신]
    ↓
[메시지 타입 분기]
    ├─→ [new_message]: 메시지 추가
    ├─→ [message_deleted]: 메시지 상태 업데이트
    ├─→ [reaction_added]: 리액션 업데이트
    ├─→ [user_joined]: 참여자 추가
    └─→ [user_left]: 참여자 제거
    ↓
[State 업데이트]
    ↓
[관련 컴포넌트 리렌더링]
```

---

## 💾 State 인터페이스

```typescript
// Core State Types
interface ChatRoomState {
  // Room Information
  room: {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: Date;
  } | null;

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
    reactions: Map<string, Reaction>;
  };

  // Participants
  participants: {
    list: Participant[];
    count: number;
    online: Set<string>;
  };

  // Input State
  input: {
    value: string;
    replyTarget: Message | null;
    isComposing: boolean;
  };

  // UI State
  ui: {
    scrollPosition: number;
    isAutoScroll: boolean;
    showEmojiPicker: boolean;
    hoveredMessageId: string | null;
    selectedMessageIds: Set<string>;
  };

  // Connection State
  connection: {
    status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
    reconnectAttempt: number;
    lastPing: Date | null;
  };

  // Queue for Offline Mode
  queue: {
    messages: QueuedMessage[];
    actions: QueuedAction[];
  };

  // Error State
  errors: {
    global: Error | null;
    messageErrors: Map<string, Error>;
  };
}

// Message Type
interface Message {
  id: string;
  roomId: string;
  userId: string;
  user?: User;
  content: string;
  type: 'text' | 'emoji' | 'system' | 'image' | 'file';
  parentMessageId: string | null;
  parentMessage?: Message;
  isDeleted: boolean;
  isEdited: boolean;
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Reaction Type
interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: Date;
}

// Participant Type
interface Participant {
  id: string;
  userId: string;
  user: User;
  joinedAt: Date;
  role: 'owner' | 'moderator' | 'member';
  isOnline: boolean;
  lastSeen: Date;
}

// User Type
interface User {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  status: 'online' | 'away' | 'offline';
}

// Queued Items
interface QueuedMessage {
  tempId: string;
  content: string;
  type: Message['type'];
  parentMessageId?: string;
  createdAt: Date;
  retryCount: number;
}

interface QueuedAction {
  id: string;
  type: 'like' | 'delete' | 'edit';
  payload: any;
  timestamp: Date;
}
```

---

## 🎬 Action 인터페이스

```typescript
// Action Types Enum
enum ChatActionType {
  // Initialization
  INIT_ROOM = 'INIT_ROOM',
  RESET_STATE = 'RESET_STATE',

  // Messages - CRUD
  LOAD_MESSAGES = 'LOAD_MESSAGES',
  LOAD_MESSAGES_SUCCESS = 'LOAD_MESSAGES_SUCCESS',
  LOAD_MESSAGES_ERROR = 'LOAD_MESSAGES_ERROR',
  LOAD_MORE_MESSAGES = 'LOAD_MORE_MESSAGES',

  ADD_MESSAGE = 'ADD_MESSAGE',
  UPDATE_MESSAGE = 'UPDATE_MESSAGE',
  DELETE_MESSAGE = 'DELETE_MESSAGE',

  // Optimistic Updates
  ADD_OPTIMISTIC_MESSAGE = 'ADD_OPTIMISTIC_MESSAGE',
  CONFIRM_OPTIMISTIC_MESSAGE = 'CONFIRM_OPTIMISTIC_MESSAGE',
  REVERT_OPTIMISTIC_MESSAGE = 'REVERT_OPTIMISTIC_MESSAGE',

  // Reactions
  ADD_REACTION = 'ADD_REACTION',
  REMOVE_REACTION = 'REMOVE_REACTION',

  // Input Management
  SET_INPUT_VALUE = 'SET_INPUT_VALUE',
  SET_REPLY_TARGET = 'SET_REPLY_TARGET',
  CLEAR_REPLY_TARGET = 'CLEAR_REPLY_TARGET',
  SET_COMPOSING = 'SET_COMPOSING',

  // UI State
  SET_SCROLL_POSITION = 'SET_SCROLL_POSITION',
  SET_AUTO_SCROLL = 'SET_AUTO_SCROLL',
  TOGGLE_EMOJI_PICKER = 'TOGGLE_EMOJI_PICKER',
  SET_HOVERED_MESSAGE = 'SET_HOVERED_MESSAGE',
  TOGGLE_MESSAGE_SELECTION = 'TOGGLE_MESSAGE_SELECTION',

  // Participants
  SET_PARTICIPANTS = 'SET_PARTICIPANTS',
  ADD_PARTICIPANT = 'ADD_PARTICIPANT',
  REMOVE_PARTICIPANT = 'REMOVE_PARTICIPANT',
  UPDATE_PARTICIPANT_STATUS = 'UPDATE_PARTICIPANT_STATUS',

  // Connection
  SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS',
  INCREMENT_RECONNECT_ATTEMPT = 'INCREMENT_RECONNECT_ATTEMPT',
  UPDATE_LAST_PING = 'UPDATE_LAST_PING',

  // Queue Management
  ENQUEUE_MESSAGE = 'ENQUEUE_MESSAGE',
  DEQUEUE_MESSAGE = 'DEQUEUE_MESSAGE',
  ENQUEUE_ACTION = 'ENQUEUE_ACTION',
  FLUSH_QUEUE = 'FLUSH_QUEUE',

  // Error Handling
  SET_GLOBAL_ERROR = 'SET_GLOBAL_ERROR',
  CLEAR_GLOBAL_ERROR = 'CLEAR_GLOBAL_ERROR',
  SET_MESSAGE_ERROR = 'SET_MESSAGE_ERROR',
  CLEAR_MESSAGE_ERROR = 'CLEAR_MESSAGE_ERROR',
}

// Action Union Type
type ChatAction =
  | { type: ChatActionType.INIT_ROOM; payload: { roomId: string; roomInfo: Room } }
  | { type: ChatActionType.RESET_STATE }
  | { type: ChatActionType.LOAD_MESSAGES }
  | { type: ChatActionType.LOAD_MESSAGES_SUCCESS; payload: { messages: Message[]; hasMore: boolean } }
  | { type: ChatActionType.LOAD_MESSAGES_ERROR; payload: Error }
  | { type: ChatActionType.ADD_MESSAGE; payload: Message }
  | { type: ChatActionType.UPDATE_MESSAGE; payload: { id: string; updates: Partial<Message> } }
  | { type: ChatActionType.DELETE_MESSAGE; payload: string }
  | { type: ChatActionType.ADD_OPTIMISTIC_MESSAGE; payload: { tempId: string; message: Message } }
  | { type: ChatActionType.CONFIRM_OPTIMISTIC_MESSAGE; payload: { tempId: string; message: Message } }
  | { type: ChatActionType.REVERT_OPTIMISTIC_MESSAGE; payload: string }
  | { type: ChatActionType.ADD_REACTION; payload: { messageId: string; reaction: Reaction } }
  | { type: ChatActionType.REMOVE_REACTION; payload: { messageId: string; reactionId: string } }
  | { type: ChatActionType.SET_INPUT_VALUE; payload: string }
  | { type: ChatActionType.SET_REPLY_TARGET; payload: Message | null }
  | { type: ChatActionType.SET_COMPOSING; payload: boolean }
  | { type: ChatActionType.SET_SCROLL_POSITION; payload: number }
  | { type: ChatActionType.SET_AUTO_SCROLL; payload: boolean }
  | { type: ChatActionType.TOGGLE_EMOJI_PICKER }
  | { type: ChatActionType.SET_HOVERED_MESSAGE; payload: string | null }
  | { type: ChatActionType.SET_PARTICIPANTS; payload: Participant[] }
  | { type: ChatActionType.ADD_PARTICIPANT; payload: Participant }
  | { type: ChatActionType.REMOVE_PARTICIPANT; payload: string }
  | { type: ChatActionType.SET_CONNECTION_STATUS; payload: ConnectionStatus }
  | { type: ChatActionType.ENQUEUE_MESSAGE; payload: QueuedMessage }
  | { type: ChatActionType.FLUSH_QUEUE }
  | { type: ChatActionType.SET_GLOBAL_ERROR; payload: Error | null }
  | { type: ChatActionType.SET_MESSAGE_ERROR; payload: { messageId: string; error: Error } };
```

---

## 🎯 Context Value 인터페이스

```typescript
// Context Value Type
interface ChatRoomContextValue {
  // State
  state: ChatRoomState;

  // Computed Values
  computed: {
    // Message Helpers
    sortedMessages: Message[];
    groupedMessages: GroupedMessage[];
    unreadCount: number;
    mentionCount: number;

    // Input Helpers
    canSend: boolean;
    inputRows: number;

    // Connection Helpers
    isOnline: boolean;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';

    // UI Helpers
    shouldAutoScroll: boolean;
    hasSelection: boolean;
    selectedMessages: Message[];
  };

  // Actions
  actions: {
    // Message Actions
    sendMessage: (content: string, type?: MessageType) => Promise<void>;
    editMessage: (messageId: string, content: string) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    retryMessage: (tempId: string) => Promise<void>;

    // Reaction Actions
    toggleReaction: (messageId: string, type: ReactionType) => Promise<void>;

    // Input Actions
    updateInput: (value: string) => void;
    setReplyTarget: (message: Message | null) => void;
    clearInput: () => void;
    insertEmoji: (emoji: string) => void;

    // UI Actions
    scrollToBottom: () => void;
    scrollToMessage: (messageId: string) => void;
    toggleEmojiPicker: () => void;
    setHoveredMessage: (messageId: string | null) => void;
    selectMessage: (messageId: string) => void;
    clearSelection: () => void;

    // Connection Actions
    reconnect: () => void;
    disconnect: () => void;

    // Participant Actions
    loadParticipants: () => Promise<void>;

    // Error Actions
    clearError: () => void;
    retryFailedAction: (actionId: string) => void;
  };

  // Refs (for imperative actions)
  refs: {
    messageListRef: React.RefObject<HTMLDivElement>;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    webSocketRef: React.MutableRefObject<WebSocket | null>;
  };

  // Subscriptions
  subscriptions: {
    onMessage: (callback: (message: Message) => void) => () => void;
    onTyping: (callback: (userId: string) => void) => () => void;
    onPresence: (callback: (participants: Participant[]) => void) => () => void;
  };
}

// Grouped Message Type for UI
interface GroupedMessage {
  date: Date;
  messages: {
    hour: number;
    items: Message[];
  }[];
}
```

---

## 🧩 컴포넌트 인터페이스

### Provider Component
```typescript
interface ChatRoomProviderProps {
  roomId: string;
  children: React.ReactNode;
  config?: {
    messagePageSize?: number;
    reconnectInterval?: number;
    maxRetries?: number;
    enableOfflineQueue?: boolean;
    enableOptimisticUpdates?: boolean;
  };
}
```

### Consumer Hooks
```typescript
// Main hook
function useChatRoom(): ChatRoomContextValue;

// Granular hooks for optimization
function useChatRoomState<T>(selector: (state: ChatRoomState) => T): T;
function useChatRoomActions(): ChatRoomContextValue['actions'];
function useChatRoomComputed(): ChatRoomContextValue['computed'];
function useMessage(messageId: string): Message | undefined;
function useParticipant(userId: string): Participant | undefined;
```

---

## 🔌 하위 컴포넌트 노출 인터페이스

### 1. ChatHeader Component
```typescript
interface ChatHeaderProps {
  // From Context
  roomName: string;
  participantCount: number;
  connectionStatus: ConnectionStatus;
  isTyping: boolean;
  typingUsers: User[];

  // Actions
  onBack: () => void;
  onParticipantsClick: () => void;
  onSettingsClick: () => void;
}
```

### 2. MessageList Component
```typescript
interface MessageListProps {
  // From Context
  messages: GroupedMessage[];
  hasMore: boolean;
  isLoading: boolean;
  hoveredMessageId: string | null;
  selectedMessageIds: Set<string>;
  currentUserId: string;

  // Actions
  onLoadMore: () => void;
  onMessageHover: (messageId: string | null) => void;
  onMessageSelect: (messageId: string) => void;
  onReaction: (messageId: string, type: ReactionType) => void;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string) => void;

  // Refs
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}
```

### 3. MessageItem Component
```typescript
interface MessageItemProps {
  // Data
  message: Message;
  isOwnMessage: boolean;
  isHovered: boolean;
  isSelected: boolean;
  showActions: boolean;
  isGrouped: boolean;

  // Actions
  onHover: () => void;
  onSelect: () => void;
  onReaction: (type: ReactionType) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUserClick: (userId: string) => void;
  onImageClick: (imageUrl: string) => void;
}
```

### 4. ChatInput Component
```typescript
interface ChatInputProps {
  // From Context
  value: string;
  replyTarget: Message | null;
  isComposing: boolean;
  canSend: boolean;
  showEmojiPicker: boolean;
  isOffline: boolean;

  // Actions
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onEmojiToggle: () => void;
  onEmojiSelect: (emoji: string) => void;
  onCancelReply: () => void;
  onFileSelect: (files: File[]) => void;

  // Refs
  inputRef: React.RefObject<HTMLTextAreaElement>;
}
```

### 5. EmojiPicker Component
```typescript
interface EmojiPickerProps {
  // State
  isOpen: boolean;
  position: 'top' | 'bottom';
  recentEmojis: string[];

  // Actions
  onSelect: (emoji: string) => void;
  onClose: () => void;
}
```

### 6. ReplyPreview Component
```typescript
interface ReplyPreviewProps {
  // Data
  targetMessage: Message;

  // Actions
  onCancel: () => void;
  onJumpToMessage: () => void;
}
```

### 7. ConnectionStatus Component
```typescript
interface ConnectionStatusProps {
  // From Context
  status: ConnectionStatus;
  reconnectAttempt: number;
  queuedMessageCount: number;

  // Actions
  onReconnect: () => void;
  onViewQueue: () => void;
}
```

---

## 🚀 성능 최적화 전략

### 1. Context 분리
```typescript
// 자주 변경되는 상태와 정적 상태 분리
const ChatRoomStateContext = React.createContext<ChatRoomState>();
const ChatRoomActionsContext = React.createContext<Actions>();
const ChatRoomComputedContext = React.createContext<ComputedValues>();
```

### 2. Memoization 전략
```typescript
// Selector 패턴 활용
const messageSelector = (state: ChatRoomState) => state.messages.items;
const participantsSelector = (state: ChatRoomState) => state.participants.list;

// Computed values memoization
const groupedMessages = useMemo(() =>
  groupMessagesByTime(messages), [messages]
);
```

### 3. 구독 패턴
```typescript
// 특정 이벤트만 구독
const useMessageSubscription = (callback: (msg: Message) => void) => {
  const { subscriptions } = useChatRoom();

  useEffect(() => {
    return subscriptions.onMessage(callback);
  }, [callback]);
};
```

---

## 📝 사용 예시

### Provider 설정
```typescript
function ChatRoomPage() {
  const { roomId } = useParams();

  return (
    <ChatRoomProvider
      roomId={roomId}
      config={{
        messagePageSize: 50,
        reconnectInterval: 3000,
        maxRetries: 5,
        enableOfflineQueue: true,
        enableOptimisticUpdates: true,
      }}
    >
      <ChatRoom />
    </ChatRoomProvider>
  );
}
```

### 컴포넌트에서 사용
```typescript
function MessageComposer() {
  const { state, actions, computed } = useChatRoom();

  const handleSend = useCallback(() => {
    if (computed.canSend) {
      actions.sendMessage(state.input.value);
    }
  }, [state.input.value, computed.canSend, actions]);

  return (
    <div className="message-composer">
      <textarea
        value={state.input.value}
        onChange={(e) => actions.updateInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !state.input.isComposing) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        onClick={handleSend}
        disabled={!computed.canSend}
      >
        전송
      </button>
    </div>
  );
}
```

### Selective Subscribe
```typescript
function UnreadCounter() {
  // 특정 computed value만 구독
  const unreadCount = useChatRoomState(
    state => state.messages.items.filter(m => !m.isRead).length
  );

  return <span className="badge">{unreadCount}</span>;
}
```

---

## 🧪 테스트 전략

### 1. Reducer 테스트
```typescript
describe('chatRoomReducer', () => {
  it('should add message optimistically', () => {
    const action = {
      type: ChatActionType.ADD_OPTIMISTIC_MESSAGE,
      payload: { tempId: 'temp-1', message: mockMessage }
    };

    const newState = chatRoomReducer(initialState, action);

    expect(newState.optimistic.messages.has('temp-1')).toBe(true);
    expect(newState.messages.items).toContainEqual(mockMessage);
  });
});
```

### 2. Context 테스트
```typescript
const renderWithChatRoom = (ui: ReactElement, roomId = 'test-room') => {
  return render(
    <ChatRoomProvider roomId={roomId}>
      {ui}
    </ChatRoomProvider>
  );
};
```

### 3. Hook 테스트
```typescript
describe('useChatRoom', () => {
  it('should send message and update state', async () => {
    const { result } = renderHook(() => useChatRoom(), {
      wrapper: ChatRoomProvider,
    });

    await act(async () => {
      await result.current.actions.sendMessage('Hello');
    });

    expect(result.current.state.messages.items).toHaveLength(1);
  });
});
```

---

## 🔒 에러 처리 전략

### 1. 에러 바운더리
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ChatRoomErrorBoundary extends React.Component {
  // 채팅방 전체 에러 처리
}
```

### 2. 액션 레벨 에러 처리
```typescript
const handleMessageError = (error: Error, tempId: string) => {
  dispatch({
    type: ChatActionType.SET_MESSAGE_ERROR,
    payload: { messageId: tempId, error }
  });

  // 재시도 로직
  if (error.code === 'NETWORK_ERROR') {
    dispatch({
      type: ChatActionType.ENQUEUE_MESSAGE,
      payload: { tempId, ... }
    });
  }
};
```

---

## 📈 모니터링 및 디버깅

### 1. Redux DevTools 통합
```typescript
const [state, dispatch] = useReducer(
  chatRoomReducer,
  initialState,
  // Redux DevTools 통합
  process.env.NODE_ENV === 'development'
    ? window.__REDUX_DEVTOOLS_EXTENSION__?.()
    : undefined
);
```

### 2. 로깅 미들웨어
```typescript
const loggingMiddleware = (action: ChatAction) => {
  console.group(`[ChatRoom] ${action.type}`);
  console.log('Payload:', action.payload);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};
```

---

## 📚 참고 문서

- [Product Requirement Document (PRD)](./prd.md)
- [User Flow Document](./userflow.md)
- [Requirements Document](./requirements.md)
- [Database Schema](./database.md)

---

## 🔄 버전 이력

| 버전 | 날짜 | 변경사항 | 작성자 |
|-----|-----|---------|--------|
| v1.0 | 2025-01-19 | 초기 설계 문서 작성 | System |