# 채팅방 페이지 구현 계획

**페이지명:** 채팅방 페이지 (Chatroom Page)
**경로:** `/room/:id`
**우선순위:** 4 (핵심 페이지 - 최우선)
**작성일:** 2025-10-19
**관련 유즈케이스:** UC-004 (채팅방 입장), UC-005 (메시지 전송), UC-006 (메시지 좋아요), UC-007 (메시지 답장), UC-008 (메시지 삭제)
**선행 페이지:** 01_login_page.md, 02_register_page.md, 03_main_page.md

---

## 1. 페이지 개요

채팅방에 입장한 사용자가 실시간으로 메시지를 주고받으며, 좋아요/답장/삭제 등의 인터랙션을 수행하는 핵심 페이지입니다. Context + useReducer 패턴으로 상태를 관리하고, WebSocket을 통해 실시간 통신을 구현합니다.

### 핵심 기능
- 채팅방 정보 표시 (이름, 참여자 수)
- 메시지 히스토리 로드 및 무한 스크롤
- 실시간 메시지 송수신 (WebSocket)
- 메시지 좋아요/답장/삭제
- 낙관적 업데이트
- 입력창 (텍스트, 이모지, 줄바꿈)
- 한글 IME 처리

---

## 2. 경로 및 접근 설정

### 2.1 페이지 경로
```
/room/:id
```

### 2.2 접근 권한
- **보호된 페이지**: 인증 필수
- **비로그인 접근 시**: 로그인 페이지(/login?redirect=/room/:id)로 리디렉션
- **존재하지 않는 채팅방**: 메인 페이지로 리디렉션

---

## 3. 컴포넌트 구조

```
ChatRoomPage
├── ChatRoomProvider (Context + useReducer)
│   └── ChatRoom
│       ├── ChatHeader
│       │   ├── BackButton
│       │   ├── RoomName
│       │   ├── ParticipantCount
│       │   └── MyPageLink
│       ├── MessageList
│       │   ├── InfiniteScrollTrigger
│       │   ├── MessageGroup[]
│       │   │   └── MessageItem[]
│       │   │       ├── MessageContent
│       │   │       ├── MessageActions
│       │   │       │   ├── LikeButton
│       │   │       │   ├── ReplyButton
│       │   │       │   └── DeleteButton (본인만)
│       │   │       ├── ReactionDisplay
│       │   │       └── ReplyPreview (답장 시)
│       │   └── ScrollToBottomButton
│       └── ChatInput
│           ├── ReplyTargetPreview
│           ├── TextArea (auto-resize)
│           ├── EmojiButton
│           └── SendButton
```

---

## 4. 상태 관리 (Context + useReducer)

### 4.1 ChatRoomProvider

상태 관리 설계 문서(state-management.md)에 정의된 대로 Context + useReducer 패턴 사용.

#### 초기화 로직
```typescript
// ChatRoomProvider 초기화 시
useEffect(() => {
  // 1. 채팅방 정보 로드
  const loadRoomInfo = async () => {
    const response = await apiClient.get(`/api/rooms/${roomId}`);
    dispatch({ type: 'INIT_ROOM', payload: response.data });
  };

  // 2. 메시지 히스토리 로드
  const loadMessages = async () => {
    const response = await apiClient.get(`/api/rooms/${roomId}/messages`);
    dispatch({ type: 'LOAD_MESSAGES_SUCCESS', payload: response.data });
  };

  // 3. WebSocket 연결
  const connectWebSocket = () => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('broadcast', { event: 'message' }, handleNewMessage)
      .on('broadcast', { event: 'reaction' }, handleReaction)
      .on('broadcast', { event: 'delete' }, handleDelete)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  loadRoomInfo();
  loadMessages();
  const cleanup = connectWebSocket();

  return cleanup;
}, [roomId]);
```

### 4.2 핵심 Actions

```typescript
actions.sendMessage(content, type);
actions.toggleReaction(messageId, 'like');
actions.setReplyTarget(message);
actions.deleteMessage(messageId);
actions.loadMoreMessages();
```

---

## 5. API 연동

### 5.1 Backend Routes

```typescript
// src/features/chatroom/backend/route.ts
const chatroom = new Hono<AppEnv>();

// 채팅방 정보 조회
chatroom.get('/:roomId', withAuth, getRoomInfoHandler);

// 메시지 목록 조회
chatroom.get('/:roomId/messages', withAuth, getMessagesHandler);

// 메시지 전송
chatroom.post('/:roomId/messages', withAuth, zValidator('json', messageSchema), sendMessageHandler);

// 메시지 삭제
chatroom.delete('/:roomId/messages/:messageId', withAuth, deleteMessageHandler);

// 좋아요 토글
chatroom.post('/:roomId/messages/:messageId/reactions', withAuth, toggleReactionHandler);
```

---

## 6. 핵심 기능 구현

### 6.1 메시지 전송 (낙관적 업데이트)

```typescript
const handleSendMessage = async () => {
  const tempId = `temp-${Date.now()}`;
  const tempMessage = {
    id: tempId,
    content: inputValue,
    authorId: currentUser.id,
    authorNickname: currentUser.nickname,
    createdAt: new Date(),
    isOptimistic: true,
  };

  // 1. 낙관적 업데이트
  dispatch({ type: 'ADD_OPTIMISTIC_MESSAGE', payload: { tempId, message: tempMessage } });

  // 2. API 호출
  try {
    const response = await apiClient.post(`/api/rooms/${roomId}/messages`, {
      content: inputValue,
      type: 'text',
      parentMessageId: replyTarget?.id,
    });

    // 3. 실제 메시지로 교체
    dispatch({ type: 'CONFIRM_OPTIMISTIC_MESSAGE', payload: { tempId, message: response.data } });
  } catch (error) {
    // 4. 실패 시 롤백
    dispatch({ type: 'REVERT_OPTIMISTIC_MESSAGE', payload: tempId });
    toast.error('메시지 전송에 실패했습니다');
  }
};
```

### 6.2 한글 IME 처리

```typescript
const [isComposing, setIsComposing] = useState(false);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
    e.preventDefault();
    handleSendMessage();
  }
};

const handleCompositionStart = () => setIsComposing(true);
const handleCompositionEnd = () => setIsComposing(false);
```

### 6.3 무한 스크롤

```typescript
const { ref, inView } = useInView();

useEffect(() => {
  if (inView && hasMore && !isLoading) {
    actions.loadMoreMessages();
  }
}, [inView, hasMore, isLoading]);

return (
  <div ref={ref} className="h-10">
    {isLoading && <Spinner />}
  </div>
);
```

### 6.4 자동 스크롤

```typescript
const messageListRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  // 새 메시지 도착 시
  if (shouldAutoScroll) {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }
}, [messages]);
```

---

## 7. WebSocket 실시간 통신

### 7.1 이벤트 타입

```typescript
// 새 메시지
{ type: 'new_message', payload: Message }

// 메시지 삭제
{ type: 'message_deleted', payload: { messageId: string } }

// 좋아요 업데이트
{ type: 'reaction_updated', payload: { messageId: string, totalLikes: number } }

// 사용자 입장/퇴장
{ type: 'user_joined', payload: { userId: string, nickname: string } }
{ type: 'user_left', payload: { userId: string } }
```

### 7.2 WebSocket 핸들러

```typescript
const handleNewMessage = (payload: Message) => {
  // 본인이 보낸 메시지는 이미 낙관적으로 추가되어 있음
  if (payload.authorId === currentUser.id) return;

  dispatch({ type: 'ADD_MESSAGE', payload });
};

const handleReactionUpdated = (payload: ReactionUpdate) => {
  dispatch({ type: 'UPDATE_REACTION', payload });
};

const handleMessageDeleted = (payload: { messageId: string }) => {
  dispatch({ type: 'DELETE_MESSAGE', payload: payload.messageId });
};
```

---

## 8. 성능 최적화

### 8.1 메시지 가상화 (선택사항)
- react-window 또는 react-virtual 사용
- 수천 개 메시지 렌더링 최적화

### 8.2 메모이제이션
```typescript
const groupedMessages = useMemo(() => 
  groupMessagesByTime(messages), 
[messages]);

const MessageItem = React.memo(({ message }) => {
  // ...
});
```

### 8.3 디바운싱
```typescript
// 타이핑 인디케이터 (선택사항)
const debouncedTyping = useDebouncedCallback(() => {
  sendTypingEvent();
}, 500);
```

---

## 9. 에러 처리

### 9.1 채팅방 미존재
```typescript
if (!room) {
  toast.error('존재하지 않는 채팅방입니다');
  router.push('/');
}
```

### 9.2 WebSocket 연결 끊김
```typescript
if (connectionStatus === 'disconnected') {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center">
      연결이 끊어졌습니다. 재연결 중...
    </div>
  );
}
```

---

## 10. 접근성

- 메시지 리스트에 role="log" 설정
- 새 메시지 도착 시 스크린 리더 알림
- 키보드만으로 모든 기능 접근 가능

---

## 11. 테스트 시나리오

### 정상 케이스
- [ ] 채팅방 입장 성공
- [ ] 메시지 전송 및 실시간 수신
- [ ] 좋아요/답장/삭제 기능 동작
- [ ] 무한 스크롤 동작

### 엣지 케이스
- [ ] 한글 IME 처리
- [ ] 연속 메시지 그룹핑
- [ ] WebSocket 재연결
- [ ] 네트워크 오류 처리

---

## 12. 구현 단계

### Phase 1: 기본 구조
1. [ ] ChatRoomProvider (Context + Reducer)
2. [ ] 채팅방 정보 로드
3. [ ] 메시지 리스트 렌더링

### Phase 2: 메시지 전송
1. [ ] ChatInput 컴포넌트
2. [ ] 메시지 전송 로직
3. [ ] 낙관적 업데이트

### Phase 3: WebSocket
1. [ ] WebSocket 연결
2. [ ] 실시간 메시지 수신
3. [ ] 재연결 로직

### Phase 4: 인터랙션
1. [ ] 좋아요 기능
2. [ ] 답장 기능
3. [ ] 삭제 기능

### Phase 5: 폴리싱
1. [ ] 무한 스크롤
2. [ ] 자동 스크롤
3. [ ] 한글 IME 처리

---

## 13. 의존성

```json
{
  "@tanstack/react-query": "^5.x",
  "date-fns": "^3.x",
  "react-use": "^17.x",
  "react-intersection-observer": "^9.x",
  "react-textarea-autosize": "^8.x"
}
```

---

## 14. 관련 문서

- [PRD](../../prd.md)
- [Usecase 004 - 채팅방 입장](../../usecases/004_join_room.md)
- [Usecase 005 - 메시지 전송](../../usecases/005_send_message.md)
- [Usecase 006 - 메시지 좋아요](../../usecases/006_like_message.md)
- [Usecase 007 - 메시지 답장](../../usecases/007_reply_message.md)
- [Usecase 008 - 메시지 삭제](../../usecases/008_delete_message.md)
- [상태 관리 설계](../../state-management.md)
- [데이터베이스 설계](../../database.md)
