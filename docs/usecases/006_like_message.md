# Usecase 006: 메시지 좋아요

**문서 번호:** UC-006
**기능명:** 메시지 좋아요
**작성일:** 2025-10-19
**관련 유저플로우:** 6. 메시지 좋아요 유저플로우

---

## 1. 개요

채팅방 참여자가 다른 사용자의 메시지에 좋아요 반응을 추가하거나 취소하는 기능입니다. 낙관적 업데이트를 통해 즉시 UI에 반영되며, WebSocket을 통해 모든 참여자에게 실시간으로 전달됩니다.

---

## 2. 사전 조건

- 사용자가 채팅방에 입장한 상태여야 합니다.
- 좋아요할 메시지가 존재하고 삭제되지 않아야 합니다.
- WebSocket 연결이 수립되어 있어야 합니다.

---

## 3. 액터

- **주 액터:** 채팅방 참여자
- **부 액터:** Cokaotalk 백엔드 시스템, 데이터베이스, WebSocket 서비스, 다른 참여자

---

## 4. 기본 시나리오 (정상 흐름)

### 4.1. 좋아요 UI 표시
1. 사용자가 메시지에 마우스를 올립니다.
2. 메시지 우측 또는 하단에 좋아요 버튼이 표시됩니다.

### 4.2. 좋아요 클릭
3. 사용자가 좋아요 버튼을 클릭합니다.
4. 시스템이 현재 좋아요 상태를 확인합니다:
   - 이미 좋아요 했을 경우: 취소 처리
   - 좋아요 안 했을 경우: 추가 처리

### 4.3. 권한 검증
5. 클라이언트가 다음을 확인합니다:
   - 로그인 상태 확인
   - 자신의 메시지인지 확인 (자신의 메시지는 좋아요 불가)
   - 메시지 삭제 여부 확인

### 4.4. 낙관적 업데이트
6. 클라이언트가 즉시 UI를 업데이트합니다:
   - 좋아요 아이콘 활성화/비활성화
   - 좋아요 카운트 증가/감소 (+1 또는 -1)

### 4.5. 서버 요청
7. 서버에 좋아요 토글 요청을 보냅니다.
8. 서버가 message_reactions 테이블을 확인합니다:
   ```sql
   SELECT * FROM message_reactions
   WHERE message_id = $1 AND user_id = $2;
   ```

9. **좋아요 추가:**
   ```sql
   INSERT INTO message_reactions (id, message_id, user_id, reaction_type, created_at)
   VALUES (gen_random_uuid(), $1, $2, 'like', NOW())
   ON CONFLICT (message_id, user_id, reaction_type) DO NOTHING;
   ```

10. **좋아요 취소:**
    ```sql
    DELETE FROM message_reactions
    WHERE message_id = $1 AND user_id = $2 AND reaction_type = 'like';
    ```

### 4.6. WebSocket 브로드캐스트
11. 서버가 모든 참여자에게 좋아요 업데이트를 브로드캐스트합니다:
    ```json
    {
      "type": "reaction_updated",
      "payload": {
        "messageId": "msg-uuid",
        "userId": "user-uuid",
        "nickname": "사용자닉네임",
        "reactionType": "like",
        "action": "added", // 또는 "removed"
        "totalLikes": 5
      }
    }
    ```

### 4.7. 다른 참여자 수신
12. 다른 참여자의 화면에 좋아요 카운트가 실시간으로 업데이트됩니다.
13. 좋아요한 사용자 목록이 갱신됩니다 (호버 시 툴팁 표시).

---

## 5. 대체 시나리오 (예외 상황)

### 5.1. 자신의 메시지 좋아요 시도
- **조건:** 메시지 작성자 본인이 좋아요 클릭
- **결과:** 아무 동작 없음 (버튼 비활성화 또는 숨김)
- **복구:** 불필요

### 5.2. 삭제된 메시지 좋아요
- **조건:** 이미 삭제된 메시지에 좋아요 시도
- **결과:**
  - HTTP 400 Bad Request 응답
  - "삭제된 메시지에는 반응할 수 없습니다" 메시지
  - 낙관적 업데이트 롤백
- **복구:** 자동 롤백

### 5.3. 연속 클릭 방지
- **조건:** 사용자가 1초 이내에 여러 번 클릭
- **결과:** 디바운싱 적용, 마지막 클릭만 처리
- **복구:** 자동 방지

### 5.4. 네트워크 오류
- **조건:** API 요청 실패
- **결과:**
  - 낙관적 업데이트 롤백
  - "일시적인 오류가 발생했습니다" 토스트 메시지
  - 원래 상태로 복구
- **복구:** 사용자가 재시도 가능

### 5.5. 동시 토글
- **조건:** 여러 사용자가 동시에 같은 메시지에 좋아요
- **결과:** 서버에서 트랜잭션 처리, 모든 요청 정상 반영
- **복구:** 자동 처리

### 5.6. WebSocket 끊김
- **조건:** 좋아요 시 WebSocket 연결 없음
- **결과:**
  - 본인 화면에는 반영됨
  - 다른 참여자에게는 실시간 알림 안 감
  - 페이지 새로고침 시 동기화됨
- **복구:** WebSocket 재연결 시 자동 동기화

---

## 6. 사후 조건

### 성공 시
- message_reactions 테이블에 레코드가 추가/삭제됩니다.
- 모든 참여자 화면에 좋아요 상태가 업데이트됩니다.
- 좋아요 카운트가 정확히 반영됩니다.

### 실패 시
- 데이터베이스에 변경이 없습니다.
- 낙관적 업데이트가 롤백됩니다.
- 사용자에게 오류 메시지가 표시됩니다.

---

## 7. 비기능적 요구사항

### 7.1. 성능
- 좋아요 토글 응답 시간: 300ms 이내
- 낙관적 업데이트: 즉시 (0ms)
- WebSocket 브로드캐스트: 100ms 이내

### 7.2. 보안
- 권한 검증 (채팅방 참여자만 가능)
- 자신의 메시지 좋아요 차단
- 중복 좋아요 방지 (DB UNIQUE 제약)

### 7.3. 사용성
- 낙관적 업데이트로 즉각적인 피드백
- 롤백 시 자연스러운 애니메이션
- 좋아요한 사용자 목록 표시 (호버 툴팁)

---

## 8. UI/UX 요구사항

### 8.1. 좋아요 버튼
- **위치:** 메시지 우측 하단 또는 호버 시 표시
- **아이콘:** 빈 하트 (미클릭), 채워진 하트 (클릭)
- **색상:** 회색 (기본), 빨간색 (활성화)

### 8.2. 좋아요 카운트
- **표시:** 아이콘 옆에 숫자로 표시
- **조건:** 1개 이상일 때만 표시
- **예시:** "❤️ 5"

### 8.3. 좋아요한 사용자 목록
- **트리거:** 좋아요 카운트에 마우스 호버
- **표시:** 툴팁으로 닉네임 목록
- **예시:** "홍길동, 김철수, 이영희 외 2명"

### 8.4. 애니메이션
- **클릭 시:** 하트 크기 확대/축소 애니메이션
- **카운트 변경:** 부드러운 숫자 증가/감소

---

## 9. 데이터베이스 영향

### 생성되는 레코드 (좋아요 추가)
```sql
{
  id: "reaction-uuid",
  message_id: "msg-uuid",
  user_id: "user-uuid",
  reaction_type: "like",
  created_at: "2025-10-19T12:00:00Z"
}
```

### 삭제되는 레코드 (좋아요 취소)
```sql
DELETE FROM message_reactions
WHERE message_id = 'msg-uuid'
  AND user_id = 'user-uuid'
  AND reaction_type = 'like';
```

### 인덱스 활용
- `idx_message_reactions_message_id`: 메시지별 좋아요 조회
- `idx_message_reactions_user_id`: 사용자별 좋아요 조회
- UNIQUE(message_id, user_id, reaction_type): 중복 방지

---

## 10. API 명세

### Endpoint
```
POST /api/rooms/:roomId/messages/:messageId/reactions
```

### Request Body
```json
{
  "type": "like",
  "action": "toggle" // "add" 또는 "remove"도 가능
}
```

### Response (성공 - 추가)
```json
{
  "success": true,
  "data": {
    "action": "added",
    "reaction": {
      "id": "reaction-uuid",
      "messageId": "msg-uuid",
      "userId": "user-uuid",
      "type": "like",
      "createdAt": "2025-10-19T12:00:00Z"
    },
    "totalLikes": 5
  }
}
```

### Response (성공 - 취소)
```json
{
  "success": true,
  "data": {
    "action": "removed",
    "totalLikes": 4
  }
}
```

---

## 11. 상태 관리

### Context Actions
```typescript
// 좋아요 토글
actions.toggleReaction(messageId, 'like');

// 내부 처리:
// 1. 낙관적 업데이트
dispatch({ type: 'ADD_REACTION', payload: { messageId, reaction: tempReaction } });

// 2. API 호출
const response = await apiClient.post(`/api/rooms/${roomId}/messages/${messageId}/reactions`, {
  type: 'like',
  action: 'toggle'
});

// 3. 성공 시 (변경 없음, 이미 낙관적으로 업데이트됨)

// 4. 실패 시 롤백
dispatch({ type: 'REMOVE_REACTION', payload: { messageId, reactionId: tempReaction.id } });
```

---

## 12. 테스트 시나리오

### 12.1. 정상 케이스
- [ ] 다른 사용자 메시지에 좋아요 추가
- [ ] 좋아요 취소 (토글)
- [ ] 좋아요 카운트 정확히 표시
- [ ] 다른 참여자에게 실시간 반영

### 12.2. 권한 검증
- [ ] 자신의 메시지는 좋아요 불가
- [ ] 삭제된 메시지는 좋아요 불가
- [ ] 비참여자는 좋아요 불가

### 12.3. UX
- [ ] 낙관적 업데이트 즉시 반영
- [ ] 연속 클릭 방지 (디바운싱)
- [ ] 좋아요한 사용자 목록 툴팁 표시

### 12.4. 오류 처리
- [ ] 네트워크 오류 시 롤백
- [ ] 서버 오류 시 롤백 및 메시지 표시

---

## 13. 관련 문서

- [유저플로우 문서 - 6. 메시지 좋아요](../userflow.md#6-메시지-좋아요-유저플로우)
- [상태 관리 설계](../state-management.md)
- [데이터베이스 - message_reactions 테이블](../database.md#5-message_reactions-테이블)
- [Usecase 005 - 메시지 전송](./005_send_message.md)
