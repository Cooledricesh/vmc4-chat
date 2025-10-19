# Usecase 003: 채팅방 만들기

**문서 번호:** UC-003
**기능명:** 채팅방 만들기
**작성일:** 2025-10-19
**관련 유저플로우:** 3. 채팅방 만들기 유저플로우

---

## 1. 개요

로그인한 사용자가 새로운 채팅방을 생성하는 기능입니다. 채팅방 이름을 입력하면 즉시 생성되며, 생성자는 자동으로 참여자로 등록되고 해당 채팅방으로 입장합니다.

---

## 2. 사전 조건

- 사용자가 로그인 상태여야 합니다 (JWT 토큰 유효).
- 메인 페이지(/)에 접근할 수 있어야 합니다.
- rooms 및 room_participants 테이블이 정상적으로 구성되어 있어야 합니다.
- WebSocket 서비스가 실행 중이어야 합니다.

---

## 3. 액터

- **주 액터:** 로그인된 사용자
- **부 액터:** Cokaotalk 백엔드 시스템, 데이터베이스, WebSocket 서비스

---

## 4. 기본 시나리오 (정상 흐름)

### 4.1. 채팅방 생성 모달 열기
1. 사용자가 메인 페이지에서 "채팅방 만들기" 버튼을 클릭합니다.
2. 시스템이 채팅방 생성 모달 또는 다이얼로그를 표시합니다.

### 4.2. 채팅방 이름 입력
3. 사용자가 채팅방 이름을 입력합니다:
   - 최소 1자, 최대 100자
   - 특수문자, 이모지, 공백 모두 허용

### 4.3. 클라이언트 유효성 검증
4. 시스템이 입력값을 검증합니다:
   - 빈 문자열 확인
   - 길이 제한 확인 (1-100자)
   - 공백만 있는 경우 필터링

### 4.4. 채팅방 생성 요청
5. 사용자가 "생성" 버튼을 클릭합니다.
6. 시스템이 생성 버튼을 비활성화하여 중복 생성을 방지합니다.

### 4.5. 서버 처리
7. 서버가 다음을 수행합니다:
   - JWT 토큰에서 사용자 ID 추출
   - 채팅방 이름 유효성 재검증
   - UUID 생성
   - rooms 테이블에 INSERT:
     ```sql
     INSERT INTO rooms (id, name, creator_id, is_active, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
     RETURNING *;
     ```
   - room_participants 테이블에 생성자 추가:
     ```sql
     INSERT INTO room_participants (id, room_id, user_id, joined_at)
     VALUES (gen_random_uuid(), $1, $2, NOW());
     ```

### 4.6. WebSocket 브로드캐스트
8. 서버가 WebSocket을 통해 모든 연결된 클라이언트에 새 채팅방 생성 이벤트를 브로드캐스트합니다:
   ```json
   {
     "type": "room_created",
     "payload": {
       "roomId": "550e8400-e29b-41d4-a716-446655440000",
       "name": "새 채팅방",
       "creatorNickname": "사용자닉네임",
       "createdAt": "2025-10-19T12:00:00Z",
       "participantCount": 1
     }
   }
   ```

### 4.7. 채팅방 목록 업데이트
9. 모든 클라이언트의 채팅방 목록에 새 방이 즉시 표시됩니다.

### 4.8. 채팅방 자동 입장
10. 생성자 클라이언트가 생성된 채팅방 페이지(/room/:id)로 자동 리디렉션됩니다.
11. 시스템 메시지로 "채팅방이 생성되었습니다" 알림이 표시됩니다.

---

## 5. 대체 시나리오 (예외 상황)

### 5.1. 채팅방 이름 미입력
- **조건:** 이름 필드가 비어있거나 공백만 있음
- **결과:** "채팅방 이름을 입력해주세요" 오류 메시지 표시
- **복구:** 사용자가 이름 입력 후 재시도

### 5.2. 채팅방 이름 길이 초과
- **조건:** 이름이 100자를 초과
- **결과:**
  - 입력 필드에서 101번째 문자부터 입력 차단
  - "채팅방 이름은 최대 100자까지 가능합니다" 안내 메시지
- **복구:** 사용자가 100자 이내로 수정

### 5.3. 미인증 사용자
- **조건:** JWT 토큰이 없거나 만료됨
- **결과:**
  - HTTP 401 Unauthorized 응답
  - "로그인이 필요합니다" 메시지 표시
  - 자동으로 로그인 페이지로 리디렉션
- **복구:** 사용자가 재로그인 후 채팅방 생성

### 5.4. 같은 이름의 채팅방 존재
- **조건:** 동일한 이름의 채팅방이 이미 존재
- **결과:** 정상 생성 허용 (생성 시간과 생성자로 구분)
- **참고:** MVP에서는 중복 이름 허용

### 5.5. 네트워크 오류
- **조건:** 생성 요청 중 네트워크 연결 끊김
- **결과:**
  - 로딩 스피너 표시 후 타임아웃 (30초)
  - "네트워크 연결을 확인해주세요" 오류 메시지
  - 생성 버튼 재활성화
- **복구:** 사용자가 네트워크 확인 후 재시도

### 5.6. 데이터베이스 오류
- **조건:** rooms 테이블 INSERT 실패
- **결과:**
  - HTTP 500 Internal Server Error 응답
  - "채팅방 생성에 실패했습니다. 다시 시도해주세요" 메시지
  - 생성 버튼 재활성화
- **복구:** 사용자가 잠시 후 재시도

### 5.7. WebSocket 연결 실패
- **조건:** WebSocket 브로드캐스트 실패
- **결과:**
  - 채팅방은 정상 생성됨
  - 다른 사용자에게 실시간 알림은 안 가지만, 페이지 새로고침 시 목록에 표시됨
  - 생성자는 정상적으로 채팅방 입장
- **복구:** 자동 복구 (다음 WebSocket 재연결 시 동기화)

### 5.8. 연속 생성 시도
- **조건:** 사용자가 1초 이내에 여러 번 생성 버튼 클릭
- **결과:**
  - 버튼 비활성화로 첫 번째 요청만 처리
  - 추가 클릭은 무시됨
- **복구:** 자동 방지

### 5.9. XSS 공격 시도
- **조건:** 채팅방 이름에 스크립트 삽입 시도 (예: `<script>alert('xss')</script>`)
- **결과:**
  - 입력값 sanitization 처리
  - 렌더링 시 자동 이스케이프
  - 텍스트로만 표시됨
- **보안:** DOMPurify 또는 React의 기본 XSS 방어

---

## 6. 사후 조건

### 성공 시
- rooms 테이블에 새 채팅방 레코드가 생성됩니다.
- room_participants 테이블에 생성자가 첫 번째 참여자로 등록됩니다.
- 모든 사용자의 채팅방 목록에 새 방이 표시됩니다.
- 생성자는 해당 채팅방 페이지로 이동합니다.

### 실패 시
- 데이터베이스에 어떠한 변경도 발생하지 않습니다.
- 사용자는 메인 페이지 또는 생성 모달에 그대로 유지됩니다.
- 입력한 채팅방 이름은 유지됩니다.

---

## 7. 비기능적 요구사항

### 7.1. 성능
- 채팅방 생성 처리 시간: 1초 이내
- WebSocket 브로드캐스트 지연: 500ms 이내

### 7.2. 보안
- 사용자 인증 필수 (JWT 토큰 검증)
- 입력값 sanitization 필수
- SQL Injection 방지 (파라미터 바인딩)
- XSS 방지 (입력값 이스케이프)

### 7.3. 확장성
- 동시 채팅방 생성 지원 (트랜잭션 처리)
- 생성 가능한 채팅방 수 제한 없음 (MVP)

### 7.4. 사용성
- 생성 후 즉시 입장 (추가 클릭 불필요)
- 실시간 목록 업데이트 (새로고침 불필요)

---

## 8. UI/UX 요구사항

### 8.1. 채팅방 생성 모달
- **위치:** 화면 중앙
- **크기:** 최대 너비 500px
- **배경:** 반투명 오버레이 (dim)

### 8.2. 입력 필드
- **채팅방 이름:**
  - type="text"
  - placeholder="채팅방 이름 (1-100자)"
  - maxlength="100"
  - 자동 포커스 (모달 열릴 때)

### 8.3. 버튼
- **생성 버튼:**
  - 기본 상태: 파란색 배경
  - 비활성 상태: 회색 배경
  - 로딩 상태: 스피너 + "생성 중..." 텍스트
- **취소 버튼:**
  - 회색 배경
  - 클릭 시 모달 닫기

### 8.4. 오류 표시
- 오류 메시지 색상: 빨간색 (#DC2626)
- 입력 필드 하단에 인라인 표시

### 8.5. 성공 피드백
- 생성 성공 시: 간단한 토스트 알림 "채팅방이 생성되었습니다"
- 즉시 채팅방 페이지로 이동

---

## 9. 데이터베이스 영향

### 생성되는 레코드

#### rooms 테이블
```sql
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "새 채팅방",
  creator_id: "user-uuid-here",
  is_active: true,
  created_at: "2025-10-19T12:00:00Z",
  updated_at: "2025-10-19T12:00:00Z"
}
```

#### room_participants 테이블
```sql
{
  id: "participant-uuid-here",
  room_id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "user-uuid-here",
  joined_at: "2025-10-19T12:00:00Z"
}
```

### 인덱스 활용
- `idx_rooms_creator_id`: 생성자별 채팅방 조회
- `idx_rooms_is_active`: 활성 채팅방 필터링
- `idx_room_participants_room_id`: 채팅방 참여자 조회
- `idx_room_participants_user_id`: 사용자 참여 채팅방 조회

---

## 10. API 명세

### Endpoint
```
POST /api/rooms
```

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Request Body
```json
{
  "name": "새 채팅방"
}
```

### Response (성공)
```json
{
  "success": true,
  "message": "채팅방이 생성되었습니다",
  "data": {
    "room": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "새 채팅방",
      "creatorId": "user-uuid-here",
      "creatorNickname": "사용자닉네임",
      "isActive": true,
      "participantCount": 1,
      "createdAt": "2025-10-19T12:00:00Z"
    }
  }
}
```

### Response (실패 - 미인증)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다"
  }
}
```

### Response (실패 - 유효성 검증)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "채팅방 이름을 입력해주세요",
    "details": {
      "field": "name",
      "reason": "required"
    }
  }
}
```

---

## 11. WebSocket 이벤트

### 브로드캐스트 이벤트
```json
{
  "type": "room_created",
  "payload": {
    "roomId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "새 채팅방",
    "creatorId": "user-uuid-here",
    "creatorNickname": "사용자닉네임",
    "participantCount": 1,
    "createdAt": "2025-10-19T12:00:00Z"
  },
  "timestamp": "2025-10-19T12:00:00Z"
}
```

### 클라이언트 처리
- React Query 캐시 무효화: `['rooms']`
- 채팅방 목록 자동 갱신
- 최신 생성 채팅방 상단 표시

---

## 12. 상태 관리

### React Query
```typescript
// 채팅방 생성 mutation
const createRoomMutation = useMutation({
  mutationFn: (name: string) => apiClient.post('/api/rooms', { name }),
  onSuccess: (data) => {
    queryClient.invalidateQueries(['rooms']);
    router.push(`/room/${data.room.id}`);
  },
});
```

### Zustand (선택사항)
```typescript
interface RoomState {
  currentRoom: Room | null;
  setCurrentRoom: (room: Room) => void;
}
```

---

## 13. 테스트 시나리오

### 13.1. 정상 케이스
- [ ] 유효한 이름으로 채팅방 생성 성공
- [ ] 생성 후 채팅방 목록에 즉시 표시
- [ ] 생성자가 자동으로 채팅방에 입장
- [ ] 다른 사용자 화면에도 실시간 반영

### 13.2. 유효성 검증
- [ ] 빈 이름 입력 시 오류 메시지
- [ ] 101자 이상 입력 차단
- [ ] 공백만 입력 시 오류 메시지

### 13.3. 인증
- [ ] 비로그인 상태에서 생성 시도 시 401 응답
- [ ] 만료된 토큰으로 시도 시 로그인 페이지 리디렉션

### 13.4. 데이터베이스
- [ ] rooms 테이블에 레코드 생성 확인
- [ ] room_participants 테이블에 생성자 추가 확인
- [ ] creator_id가 현재 사용자 ID와 일치

### 13.5. 실시간 업데이트
- [ ] WebSocket 이벤트 정상 브로드캐스트
- [ ] 모든 연결된 클라이언트 목록 갱신

### 13.6. UX
- [ ] 중복 생성 방지 (버튼 비활성화)
- [ ] 네트워크 오류 시 재시도 가능
- [ ] 모달 ESC 키로 닫기 가능

---

## 14. 관련 문서

- [유저플로우 문서 - 3. 채팅방 만들기](../userflow.md#3-채팅방-만들기-유저플로우)
- [데이터베이스 설계 - rooms 테이블](../database.md#2-rooms-테이블)
- [데이터베이스 설계 - room_participants 테이블](../database.md#3-room_participants-테이블)
- [PRD - 채팅방 기능](../prd.md)
- [Usecase 004 - 채팅방 입장](./004_join_room.md)
