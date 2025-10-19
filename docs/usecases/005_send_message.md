# Usecase 005: 메시지 전송

**문서 번호:** UC-005
**기능명:** 메시지 전송
**작성일:** 2025-10-19
**관련 유저플로우:** 5. 메시지 전송 유저플로우

---

## 1. 개요

채팅방에 입장한 사용자가 텍스트 또는 이모지 메시지를 작성하고 전송하는 기능입니다. 낙관적 업데이트를 통해 즉시 UI에 반영되며, WebSocket을 통해 다른 참여자에게 실시간으로 전달됩니다.

---

## 2. 사전 조건

- 사용자가 채팅방에 입장한 상태여야 합니다.
- WebSocket 연결이 수립되어 있어야 합니다.
- 사용자가 room_participants에 등록되어 있어야 합니다.

---

## 3. 액터

- **주 액터:** 채팅방 참여자
- **부 액터:** Cokaotalk 백엔드 시스템, 데이터베이스, WebSocket 서비스, 다른 참여자

---

## 4. 기본 시나리오 (정상 흐름)

### 4.1. 메시지 입력
1. 사용자가 채팅방 하단 입력창에 텍스트를 입력합니다.
2. 또는 이모지 버튼을 클릭하여 이모지를 선택합니다.

### 4.2. 입력 전처리
3. 시스템이 입력값을 검증합니다:
   - 공백만 있는 메시지 필터링
   - 메시지 길이 확인 (최대 2000자)
   - 한글 IME 조합 상태 확인 (compositionend 대기)

### 4.3. 전송 트리거
4. 사용자가 다음 중 하나를 수행합니다:
   - Enter 키 입력 (한글 조합 중이 아닐 때)
   - 전송 버튼 클릭
5. Shift+Enter는 줄바꿈으로 처리되어 전송되지 않습니다.

### 4.4. 낙관적 업데이트
6. 클라이언트가 임시 메시지 객체를 생성합니다:
   ```typescript
   const tempMessage = {
     id: `temp-${Date.now()}`,
     content: inputValue,
     type: 'text',
     authorId: currentUser.id,
     authorNickname: currentUser.nickname,
     roomId: roomId,
     createdAt: new Date(),
     isOptimistic: true,
   };
   ```
7. 임시 메시지를 즉시 메시지 리스트에 추가하여 UI에 표시합니다.
8. 입력창을 초기화하고 포커스를 유지합니다.
9. 스크롤을 최하단으로 자동 이동합니다.

### 4.5. 서버 전송
10. 서버에 메시지 저장 요청을 보냅니다:
    ```sql
    INSERT INTO messages (id, room_id, user_id, content, type, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
    RETURNING *;
    ```

### 4.6. 서버 응답 처리
11. **성공 시:**
    - 서버가 실제 메시지 ID와 타임스탬프를 반환
    - 클라이언트가 임시 메시지를 실제 메시지로 교체
    - `isOptimistic` 플래그 제거

12. **실패 시:**
    - 임시 메시지에 오류 표시 추가
    - "전송 실패" 아이콘과 재시도 버튼 표시
    - 메시지는 리스트에 유지 (삭제하지 않음)

### 4.7. WebSocket 브로드캐스트
13. 서버가 모든 채팅방 참여자에게 메시지를 브로드캐스트합니다:
    ```json
    {
      "type": "new_message",
      "payload": {
        "id": "msg-uuid",
        "roomId": "room-uuid",
        "content": "안녕하세요",
        "type": "text",
        "authorId": "user-uuid",
        "authorNickname": "사용자닉네임",
        "parentMessageId": null,
        "createdAt": "2025-10-19T12:00:00Z"
      }
    }
    ```

### 4.8. 다른 참여자 수신
14. 다른 참여자의 클라이언트가 WebSocket 이벤트를 수신합니다.
15. 메시지 리스트에 새 메시지를 추가합니다.
16. 스크롤이 최하단에 있을 경우 자동 스크롤합니다.
17. 스크롤이 위쪽에 있을 경우:
    - 자동 스크롤하지 않음
    - "새 메시지 N개" 배지를 하단에 표시

---

## 5. 대체 시나리오 (예외 상황)

### 5.1. 빈 메시지 전송 시도
- **조건:** 공백만 있거나 빈 문자열
- **결과:** 전송 버튼 비활성화, 전송 차단
- **복구:** 사용자가 내용 입력 후 재시도

### 5.2. 메시지 길이 초과
- **조건:** 2000자 초과
- **결과:** 입력 필드에서 2001번째 문자부터 입력 차단
- **복구:** 자동 차단

### 5.3. 한글 조합 중 Enter
- **조건:** IME 조합 중 Enter 키 입력
- **결과:**
  - `isComposing` 플래그 확인
  - 조합 완료 대기 (compositionend 이벤트)
  - 조합 완료 후 자동 전송하지 않음 (사용자가 다시 Enter)
- **복구:** 사용자가 조합 완료 후 Enter 재입력

### 5.4. WebSocket 연결 끊김
- **조건:** 메시지 전송 시 WebSocket 연결 없음
- **결과:**
  - 메시지를 로컬 큐에 저장
  - "연결이 끊어졌습니다. 재연결 중..." 메시지 표시
  - 자동 재연결 시도
  - 재연결 성공 시 큐의 메시지 자동 전송
- **복구:** 자동 재연결 및 재전송

### 5.5. 네트워크 오류
- **조건:** HTTP 요청 실패
- **결과:**
  - 임시 메시지에 "전송 실패" 표시
  - 재시도 버튼 표시
  - 사용자가 재시도 클릭 시 다시 전송
- **복구:** 사용자가 수동 재시도

### 5.6. 서버 오류
- **조건:** 데이터베이스 저장 실패
- **결과:**
  - HTTP 500 응답
  - "메시지 전송에 실패했습니다" 오류
  - 재시도 버튼 표시
- **복구:** 사용자가 재시도

### 5.7. 권한 없음
- **조건:** 채팅방 참여자가 아닌 사용자가 전송 시도
- **결과:**
  - HTTP 403 Forbidden 응답
  - "메시지를 전송할 권한이 없습니다" 오류
  - 입력창 비활성화
- **복구:** 채팅방 재입장 필요

### 5.8. 메시지 중복
- **조건:** 같은 메시지가 여러 번 전송됨
- **결과:**
  - 클라이언트 측에서 임시 ID로 중복 방지
  - 이미 전송 중인 메시지는 전송 차단
- **복구:** 자동 방지

### 5.9. XSS 공격 시도
- **조건:** 스크립트 태그 삽입 시도
- **결과:**
  - React의 기본 이스케이프 처리
  - 텍스트로만 렌더링
- **보안:** 자동 방어

---

## 6. 사후 조건

### 성공 시
- messages 테이블에 새 메시지가 저장됩니다.
- 모든 참여자의 화면에 메시지가 표시됩니다.
- 발신자의 입력창이 초기화되고 포커스가 유지됩니다.

### 실패 시
- 데이터베이스에 변경이 없습니다.
- 발신자 화면에 "전송 실패" 표시 및 재시도 옵션이 제공됩니다.
- 입력창은 초기화되지 않고 내용이 유지됩니다.

---

## 7. 비기능적 요구사항

### 7.1. 성능
- 메시지 전송 응답 시간: 500ms 이내
- WebSocket 브로드캐스트 지연: 100ms 이내
- 낙관적 업데이트: 즉시 (0ms)

### 7.2. 보안
- 입력값 sanitization
- XSS 방지 (React 기본 이스케이프)
- 메시지 길이 제한 (서버/클라이언트)
- 권한 검증 (채팅방 참여자만 전송 가능)

### 7.3. 사용성
- 입력창 포커스 유지
- 자동 스크롤 (조건부)
- 전송 실패 시 재시도 옵션
- 오프라인 큐잉 (자동 재전송)

### 7.4. 접근성
- 입력창에 aria-label 설정
- 전송 버튼에 키보드 접근 가능

---

## 8. UI/UX 요구사항

### 8.1. 입력창
- **위치:** 하단 고정
- **높이:** 자동 조절 (최대 5줄)
- **포커스:** 메시지 전송 후에도 유지
- **플레이스홀더:** "메시지를 입력하세요"

### 8.2. 전송 버튼
- **위치:** 입력창 우측
- **활성화:** 내용이 있을 때만
- **아이콘:** 전송 아이콘 (종이비행기)

### 8.3. 이모지 버튼
- **위치:** 입력창 좌측
- **기능:** 클릭 시 이모지 피커 표시

### 8.4. 메시지 표시
- **본인 메시지:** 우측 정렬, 파란색 배경
- **타인 메시지:** 좌측 정렬, 회색 배경
- **시스템 메시지:** 중앙 정렬, 밝은 회색

### 8.5. 전송 상태
- **전송 중:** 메시지 우측 하단에 작은 스피너
- **전송 완료:** 체크 아이콘 (선택사항)
- **전송 실패:** 빨간색 느낌표 + 재시도 버튼

---

## 9. 데이터베이스 영향

### 생성되는 레코드
```sql
{
  id: "msg-uuid-here",
  room_id: "room-uuid",
  user_id: "user-uuid",
  content: "안녕하세요",
  type: "text",
  parent_message_id: null,
  is_deleted: false,
  created_at: "2025-10-19T12:00:00Z",
  updated_at: "2025-10-19T12:00:00Z"
}
```

### 인덱스 활용
- `idx_messages_room_id_created_at`: 채팅방별 메시지 조회

---

## 10. API 명세

### Endpoint
```
POST /api/rooms/:roomId/messages
```

### Request Body
```json
{
  "content": "안녕하세요",
  "type": "text",
  "parentMessageId": null
}
```

### Response (성공)
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-uuid",
      "content": "안녕하세요",
      "type": "text",
      "authorId": "user-uuid",
      "authorNickname": "사용자닉네임",
      "roomId": "room-uuid",
      "parentMessageId": null,
      "isDeleted": false,
      "createdAt": "2025-10-19T12:00:00Z"
    }
  }
}
```

---

## 11. 상태 관리

### Context Actions
```typescript
// 메시지 전송
actions.sendMessage(content, type);

// 내부 처리:
// 1. 낙관적 업데이트
dispatch({ type: 'ADD_OPTIMISTIC_MESSAGE', payload: tempMessage });

// 2. API 호출
const response = await apiClient.post(`/api/rooms/${roomId}/messages`, { content, type });

// 3. 성공 시
dispatch({ type: 'CONFIRM_OPTIMISTIC_MESSAGE', payload: { tempId, message: response.data } });

// 4. 실패 시
dispatch({ type: 'REVERT_OPTIMISTIC_MESSAGE', payload: tempId });
dispatch({ type: 'SET_MESSAGE_ERROR', payload: { messageId: tempId, error } });
```

### State 업데이트
```typescript
messages: {
  items: [...existingMessages, newMessage],
  hasMore: false,
  isLoading: false,
},
input: {
  value: '', // 초기화
  replyTarget: null,
  isComposing: false,
}
```

---

## 12. 테스트 시나리오

### 12.1. 정상 케이스
- [ ] 텍스트 메시지 전송 성공
- [ ] 이모지 메시지 전송 성공
- [ ] 메시지가 즉시 UI에 표시됨
- [ ] 다른 참여자에게 실시간 전달
- [ ] 입력창 초기화 및 포커스 유지

### 12.2. 유효성 검증
- [ ] 빈 메시지 전송 차단
- [ ] 2000자 초과 입력 차단
- [ ] 공백만 있는 메시지 전송 차단

### 12.3. 한글 입력 처리
- [ ] 조합 중 Enter 입력 시 전송 방지
- [ ] 조합 완료 후 정상 전송
- [ ] 마지막 글자 중복 방지

### 12.4. 오류 처리
- [ ] 네트워크 오류 시 재시도 옵션
- [ ] WebSocket 끊김 시 큐잉 및 자동 재전송
- [ ] 서버 오류 시 사용자에게 안내

### 12.5. UX
- [ ] Enter 키로 전송
- [ ] Shift+Enter로 줄바꿈
- [ ] 자동 스크롤 (최하단)
- [ ] 낙관적 업데이트 동작

---

## 13. 관련 문서

- [유저플로우 문서 - 5. 메시지 전송](../userflow.md#5-메시지-전송-유저플로우)
- [상태 관리 설계 - 메시지 전송](../state-management.md)
- [데이터베이스 - messages 테이블](../database.md#4-messages-테이블)
- [Usecase 004 - 채팅방 입장](./004_join_room.md)
