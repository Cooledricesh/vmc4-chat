# Usecase 011: 로그아웃

**문서 번호:** UC-011
**기능명:** 로그아웃
**작성일:** 2025-10-19
**관련 유저플로우:** 11. 로그아웃 유저플로우

---

## 1. 개요

로그인한 사용자가 세션을 종료하고 로그아웃하는 기능입니다. 클라이언트 및 서버의 모든 인증 정보를 정리하며, 참여 중인 채팅방에서 퇴장 처리됩니다.

---

## 2. 사전 조건

- 사용자가 로그인 상태여야 합니다 (JWT 토큰 존재).
- 메인 페이지 또는 마이페이지에 접근할 수 있어야 합니다.

---

## 3. 액터

- **주 액터:** 로그인된 사용자
- **부 액터:** Cokaotalk 백엔드 시스템, WebSocket 서비스, 다른 채팅방 참여자

---

## 4. 기본 시나리오 (정상 흐름)

### 4.1. 로그아웃 버튼 클릭
1. 사용자가 헤더 또는 마이페이지의 "로그아웃" 버튼을 클릭합니다.
2. 확인 다이얼로그가 표시됩니다 (선택사항):
   - "로그아웃 하시겠습니까?"
   - "취소" 및 "로그아웃" 버튼

### 4.2. 로그아웃 확인
3. 사용자가 "로그아웃" 을 확인합니다.

### 4.3. 클라이언트 정리
4. 클라이언트가 다음을 수행합니다:
   - 로컬 스토리지/세션 스토리지 초기화
   - 전역 상태(Zustand) 초기화:
     ```typescript
     authStore.logout();
     ```
   - React Query 캐시 초기화:
     ```typescript
     queryClient.clear();
     ```

### 4.4. WebSocket 연결 종료
5. 모든 활성 WebSocket 연결을 종료합니다:
   ```typescript
   supabase.removeAllChannels();
   ```
6. 참여 중인 채팅방이 있을 경우:
   - 퇴장 시스템 메시지를 브로드캐스트
   - "사용자닉네임님이 퇴장하셨습니다"

### 4.5. 서버 세션 종료
7. 서버에 로그아웃 요청을 보냅니다.
8. 서버가 다음을 수행합니다:
   - JWT 토큰 무효화 (블랙리스트 추가, 선택사항)
   - HTTP-only 쿠키 삭제:
     ```
     Set-Cookie: auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
     ```
   - 활성 세션 종료

### 4.6. 로그인 페이지 리디렉션
9. 클라이언트가 로그인 페이지(/login)로 즉시 리디렉션합니다.
10. "로그아웃되었습니다" 메시지가 표시됩니다 (선택사항).

---

## 5. 대체 시나리오 (예외 상황)

### 5.1. 이미 로그아웃 상태
- **조건:** JWT 토큰이 없거나 만료됨
- **결과:** 로그인 페이지로 즉시 리디렉션
- **복구:** 불필요 (이미 로그아웃 상태)

### 5.2. 네트워크 오류
- **조건:** 로그아웃 요청 중 네트워크 끊김
- **결과:**
  - 로컬 정리는 진행 (클라이언트 측)
  - 서버 세션 종료는 실패 가능
  - 로그인 페이지로 리디렉션
  - 서버 측 토큰은 만료 시간까지 유효 (보안 위험 최소)
- **복구:** 강제 로컬 로그아웃 진행

### 5.3. 서버 오류
- **조건:** 서버에서 세션 종료 실패
- **결과:**
  - 클라이언트 로그아웃은 정상 진행
  - 로그인 페이지로 리디렉션
  - 서버 측 토큰 정리 실패 (만료 시간까지 유효)
- **복구:** 클라이언트 로그아웃 우선

### 5.4. 채팅 중 로그아웃
- **조건:** 채팅방에서 메시지 전송 중 로그아웃
- **결과:**
  - 전송 중인 메시지는 중단
  - WebSocket 연결 종료
  - 퇴장 메시지 브로드캐스트
  - 로그인 페이지로 리디렉션
- **복구:** 재로그인 후 채팅방 재입장

### 5.5. 다중 탭/창
- **조건:** 여러 탭/창에서 동시 로그인 상태
- **결과:**
  - 한 탭에서 로그아웃 시 모든 탭에서 로그아웃
  - BroadcastChannel 또는 localStorage 이벤트 활용
  - 모든 탭이 로그인 페이지로 리디렉션
- **복구:** 재로그인 필요

### 5.6. 자동 로그아웃
- **조건:** 세션 만료로 자동 로그아웃
- **결과:**
  - "세션이 만료되었습니다. 다시 로그인해주세요" 메시지
  - 로그인 페이지로 리디렉션
  - 로그아웃과 동일한 정리 프로세스
- **복구:** 재로그인

---

## 6. 사후 조건

### 성공 시
- 클라이언트의 모든 인증 정보가 삭제됩니다.
- 서버의 세션이 종료됩니다.
- WebSocket 연결이 종료됩니다.
- 참여 중인 채팅방에 퇴장 알림이 전송됩니다.
- 사용자는 로그인 페이지로 리디렉션됩니다.

### 실패 시
- 클라이언트 로그아웃은 정상 진행됩니다.
- 서버 세션 종료는 실패할 수 있으나, 토큰 만료로 자동 무효화됩니다.
- 사용자는 로그인 페이지로 리디렉션됩니다.

---

## 7. 비기능적 요구사항

### 7.1. 성능
- 로그아웃 처리 시간: 1초 이내
- 페이지 리디렉션: 즉시

### 7.2. 보안
- 모든 클라이언트 인증 정보 완전 삭제
- HTTP-only 쿠키 삭제
- JWT 토큰 무효화 (블랙리스트, 선택사항)
- WebSocket 연결 정리

### 7.3. 사용성
- 명확한 로그아웃 확인
- 즉각적인 피드백
- 다중 탭 동기화

### 7.4. 데이터 보존
- 사용자 데이터는 보존 (users 테이블 유지)
- 채팅 히스토리는 보존 (messages 테이블 유지)
- 채팅방 참여 이력은 보존 (room_participants 유지)

---

## 8. UI/UX 요구사항

### 8.1. 로그아웃 버튼
- **위치:** 헤더 우측 또는 마이페이지 하단
- **스타일:** 빨간색 텍스트 또는 경고 색상
- **아이콘:** 로그아웃 아이콘 (문 밖 화살표)

### 8.2. 확인 다이얼로그 (선택사항)
- **제목:** "로그아웃"
- **내용:** "로그아웃 하시겠습니까?"
- **버튼:** "취소" (회색), "로그아웃" (빨간색)

### 8.3. 로딩 상태
- **표시:** 간단한 "로그아웃 중..." 메시지 또는 스피너
- **지속 시간:** 최소 (즉시 리디렉션)

### 8.4. 성공 피드백
- **메시지:** "로그아웃되었습니다" (선택사항)
- **위치:** 로그인 페이지 상단 토스트

---

## 9. 데이터베이스 영향

### 변경되는 레코드
- **없음:** 로그아웃은 데이터베이스 변경을 수반하지 않음

### 유지되는 레코드
- users 테이블: 사용자 정보 보존
- messages 테이블: 메시지 히스토리 보존
- room_participants 테이블: 참여 이력 보존
- rooms 테이블: 채팅방 정보 보존

---

## 10. API 명세

### Endpoint
```
POST /api/auth/logout
```

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Request Body
```json
{}
```

### Response (성공)
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

### Response Header (성공)
```
Set-Cookie: auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

---

## 11. 상태 관리

### Zustand Actions
```typescript
// 전역 상태 초기화
authStore.logout();

// State 리셋
interface AuthState {
  user: null,
  isAuthenticated: false,
}
```

### React Query
```typescript
// 모든 캐시 초기화
queryClient.clear();

// 또는
queryClient.removeQueries();
```

### localStorage/sessionStorage
```typescript
// 모든 로컬 데이터 삭제
localStorage.clear();
sessionStorage.clear();

// 또는 특정 키만 삭제
localStorage.removeItem('auth_token');
localStorage.removeItem('user_id');
```

### WebSocket
```typescript
// 모든 WebSocket 채널 종료
supabase.removeAllChannels();

// 또는 특정 채널만 종료
channel.unsubscribe();
```

---

## 12. 다중 탭 동기화

### BroadcastChannel 활용
```typescript
// 로그아웃 탭
const bc = new BroadcastChannel('auth_channel');
bc.postMessage({ type: 'logout' });

// 다른 탭
bc.onmessage = (event) => {
  if (event.data.type === 'logout') {
    // 로그아웃 처리
    authStore.logout();
    router.push('/login');
  }
};
```

### localStorage 이벤트 활용 (폴백)
```typescript
// 로그아웃 탭
localStorage.setItem('logout_event', Date.now().toString());

// 다른 탭
window.addEventListener('storage', (e) => {
  if (e.key === 'logout_event') {
    // 로그아웃 처리
    authStore.logout();
    router.push('/login');
  }
});
```

---

## 13. 테스트 시나리오

### 13.1. 정상 케이스
- [ ] 로그아웃 버튼 클릭 시 정상 처리
- [ ] 모든 클라이언트 인증 정보 삭제
- [ ] 서버 세션 종료
- [ ] 로그인 페이지로 리디렉션

### 13.2. 클라이언트 정리
- [ ] localStorage 초기화
- [ ] sessionStorage 초기화
- [ ] Zustand 상태 초기화
- [ ] React Query 캐시 초기화
- [ ] WebSocket 연결 종료

### 13.3. 서버 정리
- [ ] HTTP-only 쿠키 삭제
- [ ] JWT 토큰 무효화 (선택사항)
- [ ] 세션 종료

### 13.4. 다중 탭
- [ ] 한 탭에서 로그아웃 시 모든 탭 로그아웃
- [ ] BroadcastChannel 동기화
- [ ] localStorage 이벤트 동기화

### 13.5. 엣지 케이스
- [ ] 이미 로그아웃 상태에서 로그아웃 시도
- [ ] 네트워크 오류 시 강제 로컬 로그아웃
- [ ] 채팅 중 로그아웃 시 퇴장 알림
- [ ] 자동 로그아웃 (세션 만료)

---

## 14. 관련 문서

- [유저플로우 문서 - 11. 로그아웃](../userflow.md#11-로그아웃-유저플로우)
- [PRD - 로그아웃 기능](../prd.md)
- [Usecase 002 - 로그인](./002_login.md)
- [Usecase 012 - 비로그인 접근 제한](./012_auth_guard.md)
