# Usecase 004: 채팅방 입장

**문서 번호:** UC-004
**기능명:** 채팅방 입장
**작성일:** 2025-10-19
**관련 유저플로우:** 4. 채팅방 입장 유저플로우

---

## 1. 개요

로그인한 사용자가 메인 페이지의 채팅방 목록에서 채팅방을 선택하거나 URL로 직접 접근하여 채팅방에 입장하는 기능입니다. 입장 시 메시지 히스토리를 로드하고 WebSocket을 통해 실시간 메시지를 수신합니다.

---

## 2. 사전 조건

- 사용자가 로그인 상태여야 합니다 (JWT 토큰 유효).
- 접근하려는 채팅방이 rooms 테이블에 존재하고 is_active가 true여야 합니다.
- WebSocket 서비스가 실행 중이어야 합니다.

---

## 3. 액터

- **주 액터:** 로그인된 사용자
- **부 액터:** Cokaotalk 백엔드 시스템, 데이터베이스, WebSocket 서비스

---

## 4. 기본 시나리오 (정상 흐름)

### 4.1. 채팅방 선택
1. 사용자가 메인 페이지에서 채팅방 목록 중 하나를 클릭합니다.
2. 또는 브라우저 주소창에 `/room/:id` URL을 직접 입력합니다.

### 4.2. 라우팅 및 인증 확인
3. Next.js 라우터가 채팅방 페이지 컴포넌트를 마운트합니다.
4. 미들웨어가 JWT 토큰을 검증합니다:
   - 토큰 없음 → 로그인 페이지 리디렉션
   - 토큰 만료 → 로그인 페이지 리디렉션

### 4.3. 채팅방 유효성 확인
5. 서버에 채팅방 정보 조회 요청:
   ```sql
   SELECT r.id, r.name, r.creator_id, r.is_active, r.created_at,
          u.nickname AS creator_nickname
   FROM rooms r
   JOIN users u ON r.creator_id = u.id
   WHERE r.id = $1 AND r.is_active = true;
   ```
6. 채팅방이 존재하지 않거나 비활성 상태일 경우:
   - 메인 페이지로 리디렉션
   - "존재하지 않는 채팅방입니다" 토스트 메시지

### 4.4. 참여자 등록
7. room_participants 테이블에서 현재 사용자 참여 여부 확인:
   ```sql
   SELECT * FROM room_participants
   WHERE room_id = $1 AND user_id = $2;
   ```
8. 미참여 상태인 경우 새로 등록:
   ```sql
   INSERT INTO room_participants (id, room_id, user_id, joined_at)
   VALUES (gen_random_uuid(), $1, $2, NOW())
   ON CONFLICT (room_id, user_id) DO NOTHING;
   ```

### 4.5. 데이터 병렬 로드
9. 다음 데이터를 병렬로 조회합니다:
   - **메시지 히스토리** (최근 50개):
     ```sql
     SELECT m.id, m.content, m.type, m.parent_message_id, m.is_deleted, m.created_at,
            u.nickname AS author_nickname, u.id AS author_id,
            COUNT(mr.id) AS like_count
     FROM messages m
     JOIN users u ON m.user_id = u.id
     LEFT JOIN message_reactions mr ON m.id = mr.message_id
     WHERE m.room_id = $1
     GROUP BY m.id, u.nickname, u.id
     ORDER BY m.created_at DESC
     LIMIT 50;
     ```
   - **참여자 목록**:
     ```sql
     SELECT rp.user_id, u.nickname, rp.joined_at
     FROM room_participants rp
     JOIN users u ON rp.user_id = u.id
     WHERE rp.room_id = $1
     ORDER BY rp.joined_at ASC;
     ```

### 4.6. WebSocket 연결
10. 클라이언트가 채팅방별 WebSocket 채널 구독:
    ```typescript
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('broadcast', { event: 'message' }, handleMessage)
      .subscribe();
    ```

### 4.7. 입장 알림 브로드캐스트
11. 서버가 시스템 메시지를 생성하고 브로드캐스트:
    ```json
    {
      "type": "user_joined",
      "payload": {
        "userId": "user-uuid",
        "nickname": "사용자닉네임",
        "joinedAt": "2025-10-19T12:00:00Z"
      }
    }
    ```

### 4.8. UI 렌더링
12. 채팅방 페이지가 렌더링됩니다:
    - 상단: 채팅방 이름, 참여자 수
    - 중앙: 메시지 리스트 (시간순 정렬)
    - 하단: 메시지 입력창
13. 스크롤이 최하단으로 자동 이동합니다.
14. 다른 참여자에게 "사용자닉네임님이 입장하셨습니다" 시스템 메시지가 표시됩니다.

---

## 5. 대체 시나리오 (예외 상황)

### 5.1. 채팅방 미존재
- **조건:** room_id가 rooms 테이블에 없음
- **결과:**
  - HTTP 404 Not Found 응답
  - "존재하지 않는 채팅방입니다" 토스트 메시지
  - 메인 페이지(/)로 자동 리디렉션
- **복구:** 사용자가 메인 페이지에서 다른 채팅방 선택

### 5.2. 비활성 채팅방
- **조건:** is_active가 false
- **결과:**
  - "비활성화된 채팅방입니다" 메시지
  - 메인 페이지로 리디렉션
- **복구:** 사용자가 다른 채팅방 선택

### 5.3. 미인증 사용자
- **조건:** JWT 토큰이 없거나 만료됨
- **결과:**
  - 로그인 페이지(/login)로 리디렉션
  - 원래 접근하려던 채팅방 URL을 쿼리 파라미터로 저장 (예: `/login?redirect=/room/:id`)
- **복구:** 사용자가 로그인 후 자동으로 해당 채팅방으로 이동

### 5.4. WebSocket 연결 실패
- **조건:** WebSocket 서버에 연결할 수 없음
- **결과:**
  - "실시간 연결에 실패했습니다" 경고 메시지
  - 메시지 히스토리는 정상 표시
  - 폴백으로 HTTP 폴링 시도 (3초 간격)
- **복구:** 자동 재연결 시도 (최대 5회, 지수 백오프)

### 5.5. 메시지 로드 실패
- **조건:** 메시지 조회 쿼리 실패
- **결과:**
  - 빈 메시지 리스트 표시
  - "메시지를 불러오는데 실패했습니다" 오류 메시지
  - "다시 시도" 버튼 표시
- **복구:** 사용자가 재시도 버튼 클릭

### 5.6. 네트워크 오류
- **조건:** 페이지 로드 중 네트워크 연결 끊김
- **결과:**
  - 로딩 스피너 표시 후 타임아웃 (30초)
  - "네트워크 연결을 확인해주세요" 오류 메시지
  - "다시 시도" 버튼 표시
- **복구:** 사용자가 네트워크 확인 후 페이지 새로고침

### 5.7. 동시 입장
- **조건:** 같은 사용자가 여러 탭/창에서 동시 입장
- **결과:**
  - 각 탭/창은 독립적으로 WebSocket 연결
  - 중복 입장 메시지는 방지 (마지막 입장만 알림)
- **복구:** 정상 동작 (다중 탭 지원)

### 5.8. 참여자 등록 실패
- **조건:** room_participants INSERT 실패
- **결과:**
  - 입장은 허용되나 참여자 목록에 표시 안 됨
  - 백그라운드에서 재시도 (최대 3회)
- **복구:** 자동 재시도 또는 페이지 새로고침

---

## 6. 사후 조건

### 성공 시
- room_participants 테이블에 사용자가 참여자로 등록됩니다.
- 사용자는 채팅방 페이지에서 메시지 히스토리를 볼 수 있습니다.
- WebSocket을 통해 실시간 메시지를 수신할 수 있습니다.
- 다른 참여자에게 입장 알림이 전달됩니다.

### 실패 시
- room_participants 테이블에 변경이 없습니다.
- 사용자는 메인 페이지 또는 로그인 페이지로 리디렉션됩니다.
- WebSocket 연결이 수립되지 않습니다.

---

## 7. 비기능적 요구사항

### 7.1. 성능
- 채팅방 입장 처리 시간: 2초 이내
- 메시지 히스토리 로드: 1초 이내
- WebSocket 연결 수립: 500ms 이내

### 7.2. 보안
- 사용자 인증 필수 (JWT 토큰 검증)
- 채팅방 존재 여부 및 활성 상태 확인
- WebSocket 메시지 검증 (발신자 확인)

### 7.3. 확장성
- 동시 참여자 수 제한 없음 (MVP)
- 메시지 페이지네이션 지원 (무한 스크롤)

### 7.4. 사용성
- 자동 스크롤: 최하단으로 이동
- 로딩 상태 명확히 표시
- 오류 발생 시 재시도 옵션 제공

---

## 8. UI/UX 요구사항

### 8.1. 채팅방 헤더
- **왼쪽:** 뒤로가기 버튼 (메인 페이지로 이동)
- **중앙:** 채팅방 이름
- **오른쪽:** 참여자 수 (예: "3명")

### 8.2. 메시지 리스트
- **정렬:** 시간순 (오래된 메시지 상단)
- **그룹핑:** 같은 사용자의 1분 이내 연속 메시지 그룹화
- **스크롤:** 자동 스크롤 (최하단), 스크롤 위치 기억

### 8.3. 입력창
- **위치:** 하단 고정
- **자동 포커스:** 페이지 로드 시
- **Enter 전송:** Enter 키로 전송, Shift+Enter로 줄바꿈

### 8.4. 로딩 상태
- **초기 로드:** 중앙 로딩 스피너
- **메시지 로드:** 상단 작은 스피너
- **스켈레톤 UI:** 메시지 목록 로딩 시

### 8.5. 오류 표시
- **오류 메시지:** 화면 중앙에 표시
- **재시도 버튼:** 오류 메시지 하단
- **WebSocket 끊김:** 상단 배너에 경고 메시지

### 8.6. 시스템 메시지
- **입장 알림:** 중앙 정렬, 회색 배경
- **퇴장 알림:** 중앙 정렬, 회색 배경
- **아이콘:** 작은 아이콘 추가 (입장: 👋, 퇴장: 👋)

---

## 9. 데이터베이스 영향

### 생성되는 레코드

#### room_participants 테이블 (첫 입장 시)
```sql
{
  id: "participant-uuid-here",
  room_id: "room-uuid-here",
  user_id: "user-uuid-here",
  joined_at: "2025-10-19T12:00:00Z"
}
```

### 조회되는 레코드
- rooms 테이블: 채팅방 정보
- messages 테이블: 최근 메시지 50개
- room_participants 테이블: 참여자 목록
- users 테이블: 사용자 정보 (JOIN)

### 인덱스 활용
- `idx_rooms_id`: 채팅방 조회
- `idx_messages_room_id_created_at`: 메시지 히스토리 조회 최적화
- `idx_room_participants_room_id`: 참여자 목록 조회

---

## 10. API 명세

### Endpoint
```
GET /api/rooms/:roomId
```

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Response (성공)
```json
{
  "success": true,
  "data": {
    "room": {
      "id": "room-uuid-here",
      "name": "채팅방 이름",
      "creatorId": "creator-uuid",
      "creatorNickname": "생성자닉네임",
      "isActive": true,
      "participantCount": 5,
      "createdAt": "2025-10-19T12:00:00Z"
    },
    "messages": [
      {
        "id": "msg-uuid",
        "content": "안녕하세요",
        "type": "text",
        "authorId": "user-uuid",
        "authorNickname": "사용자1",
        "parentMessageId": null,
        "isDeleted": false,
        "likeCount": 3,
        "createdAt": "2025-10-19T12:05:00Z"
      }
    ],
    "participants": [
      {
        "userId": "user-uuid",
        "nickname": "사용자1",
        "joinedAt": "2025-10-19T12:00:00Z"
      }
    ],
    "currentUserIsParticipant": true
  }
}
```

### Response (실패 - 채팅방 없음)
```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "존재하지 않는 채팅방입니다"
  }
}
```

---

## 11. WebSocket 이벤트

### 구독 채널
```typescript
supabase.channel(`room:${roomId}`)
```

### 입장 알림 이벤트
```json
{
  "type": "user_joined",
  "payload": {
    "userId": "user-uuid",
    "nickname": "사용자닉네임",
    "joinedAt": "2025-10-19T12:00:00Z"
  }
}
```

### 클라이언트 처리
- 참여자 목록에 새 사용자 추가
- 시스템 메시지 표시: "사용자닉네임님이 입장하셨습니다"

---

## 12. 상태 관리 (Context + useReducer)

### ChatRoomProvider 초기화
```typescript
<ChatRoomProvider roomId={roomId}>
  <ChatRoomPage />
</ChatRoomProvider>
```

### State 초기화
```typescript
const initialState = {
  room: null,
  messages: { items: [], hasMore: false, isLoading: true },
  participants: { list: [], count: 0 },
  connection: { status: 'connecting' },
  // ...
};
```

### 초기 데이터 로드 액션
```typescript
dispatch({ type: 'INIT_ROOM', payload: { roomId, roomInfo } });
dispatch({ type: 'LOAD_MESSAGES_SUCCESS', payload: { messages, hasMore } });
dispatch({ type: 'SET_PARTICIPANTS', payload: participants });
dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
```

---

## 13. 테스트 시나리오

### 13.1. 정상 케이스
- [ ] 채팅방 목록에서 클릭하여 입장 성공
- [ ] URL 직접 입력으로 입장 성공
- [ ] 메시지 히스토리 정상 로드
- [ ] 참여자 목록 정상 표시
- [ ] WebSocket 연결 성공
- [ ] 다른 참여자에게 입장 알림 전송

### 13.2. 유효성 검증
- [ ] 존재하지 않는 채팅방 접근 시 메인 페이지 리디렉션
- [ ] 비활성 채팅방 접근 시 메인 페이지 리디렉션
- [ ] 잘못된 UUID 형식 입력 시 404 페이지

### 13.3. 인증
- [ ] 비로그인 상태에서 접근 시 로그인 페이지 리디렉션
- [ ] 로그인 후 원래 채팅방으로 자동 이동

### 13.4. 참여자 관리
- [ ] 첫 입장 시 room_participants에 추가
- [ ] 재입장 시 중복 추가 방지
- [ ] 참여자 수 정확히 표시

### 13.5. WebSocket
- [ ] 연결 실패 시 폴링 폴백
- [ ] 자동 재연결 (최대 5회)
- [ ] 다중 탭 동시 입장 지원

### 13.6. UX
- [ ] 로딩 상태 표시
- [ ] 오류 시 재시도 옵션 제공
- [ ] 자동 스크롤 (최하단)
- [ ] 입력창 자동 포커스

---

## 14. 관련 문서

- [유저플로우 문서 - 4. 채팅방 입장](../userflow.md#4-채팅방-입장-유저플로우)
- [상태 관리 설계 문서](../state-management.md)
- [데이터베이스 설계](../database.md)
- [Usecase 003 - 채팅방 만들기](./003_create_room.md)
- [Usecase 005 - 메시지 전송](./005_send_message.md)
