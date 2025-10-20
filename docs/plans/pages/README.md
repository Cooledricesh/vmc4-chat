# 페이지별 구현 계획 요약

**작성일:** 2025-10-19
**프로젝트:** Cokaotalk MVP (v1.2)

---

## 📋 개요

이 디렉토리는 Cokaotalk MVP의 5개 페이지에 대한 상세 구현 계획을 포함합니다. 각 페이지는 PRD, 유즈케이스 문서, 데이터베이스 설계, 상태 관리 설계를 기반으로 작성되었습니다.

---

## 📄 페이지 목록

| 우선순위 | 페이지 | 경로 | 주요 기능 | 관련 유즈케이스 |
|---------|-------|------|----------|---------------|
| 1 | [로그인 페이지](./01_login_page.md) | `/login` | 이메일/비밀번호 로그인, 자동 리디렉션 | UC-002, UC-012 |
| 2 | [회원가입 페이지](./02_register_page.md) | `/register` | 계정 생성, 닉네임 설정 | UC-001 |
| 3 | [메인 페이지](./03_main_page.md) | `/` | 채팅방 목록, 채팅방 생성 | UC-003, UC-004, UC-012 |
| 4 | [채팅방 페이지](./04_chatroom_page.md) | `/room/:id` | 실시간 메시지 송수신, 좋아요/답장/삭제 | UC-004~UC-008 |
| 5 | [마이페이지](./05_mypage_page.md) | `/mypage` | 닉네임 변경, 비밀번호 변경, 로그아웃 | UC-009~UC-011 |

---

## 🔗 페이지 간 연결 관계

```
로그인 페이지 (/login)
    ↓ 로그인 성공
메인 페이지 (/)
    ↓ 채팅방 선택
채팅방 페이지 (/room/:id)
    ↑ 뒤로가기
메인 페이지 (/)
    → 마이페이지 (/mypage)
        ↓ 로그아웃
    로그인 페이지 (/login)

회원가입 페이지 (/register)
    ↓ 회원가입 완료
로그인 페이지 (/login)
```

---

## 🎯 구현 우선순위

### Phase 1: 인증 (1-2주)
1. 로그인 페이지
2. 회원가입 페이지
3. 인증 미들웨어
4. Auth Store (Zustand)

### Phase 2: 채팅방 목록 (1주)
5. 메인 페이지
6. 채팅방 목록 조회 API
7. 채팅방 생성 기능

### Phase 3: 채팅방 (2-3주) - 가장 복잡
8. 채팅방 페이지 기본 구조
9. Context + useReducer 상태 관리
10. 메시지 전송 (낙관적 업데이트)
11. WebSocket 실시간 통신
12. 메시지 좋아요/답장/삭제

### Phase 4: 계정 관리 (1주)
13. 마이페이지
14. 닉네임 변경
15. 비밀번호 변경
16. 로그아웃

### Phase 5: 폴리싱 및 테스트 (1-2주)
17. 에러 처리 강화
18. 성능 최적화
19. 접근성 개선
20. E2E 테스트

**총 예상 기간:** 6-9주

---

## 📊 기술 스택 요약

### Frontend
- **Framework:** Next.js 15.5.6 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:**
  - Global: Zustand (Auth)
  - Server State: TanStack Query (React Query)
  - Local: Context + useReducer (Chatroom)
- **Form:** React Hook Form + Zod
- **Real-time:** Supabase Realtime (WebSocket)

### Backend
- **API Framework:** Hono (delegated to Next.js API Routes)
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT (HTTP-only cookies)
- **Validation:** Zod

---

## 🔐 공통 보안 요구사항

### 모든 페이지에 적용
- HTTPS 필수
- CSRF 보호
- XSS 방지 (입력값 sanitization)
- SQL Injection 방지 (파라미터 바인딩)

### 보호된 페이지 (/, /room/:id, /mypage)
- JWT 토큰 검증 (미들웨어)
- 비로그인 시 로그인 페이지 리디렉션
- 원래 URL 저장 (로그인 후 복귀)

---

## 🚀 성능 최적화 전략

### 공통
- 코드 스플리팅 (Next.js 자동)
- 이미지 최적화 (next/image)
- React Query 캐싱
- 낙관적 업데이트

### 채팅방 페이지 특화
- 메시지 가상화 (react-window)
- 메모이제이션 (React.memo, useMemo)
- 디바운싱 (타이핑 인디케이터)
- WebSocket 재연결 로직

---

## ♿ 접근성 가이드라인

### 모든 페이지
- 키보드만으로 모든 기능 접근 가능
- 적절한 label 및 ARIA 속성
- 스크린 리더 지원
- 충분한 색상 대비

### 채팅방 페이지
- role="log" (메시지 리스트)
- 새 메시지 도착 시 스크린 리더 알림
- 답장 관계 명확히 전달

---

## 📦 필수 의존성

### 공통
```json
{
  "next": "15.5.6",
  "react": "19.2.0",
  "typescript": "^5.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "hono": "^3.x",
  "date-fns": "^3.x",
  "tailwindcss": "^3.x"
}
```

### 인증 관련
```json
{
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x"
}
```

### 채팅방 관련
```json
{
  "react-intersection-observer": "^9.x",
  "react-textarea-autosize": "^8.x",
  "react-use": "^17.x"
}
```

### shadcn-ui 컴포넌트
```bash
npx shadcn@latest add input button label card dialog badge toast
```

---

## 📝 테스트 전략

### 단위 테스트
- Services (Backend)
- Hooks (React Query)
- Reducers (Context)

### 통합 테스트
- API 엔드포인트
- Auth 플로우
- WebSocket 통신

### E2E 테스트
- 회원가입 → 로그인 → 채팅방 생성 → 메시지 전송
- 로그아웃 → 로그인
- 닉네임/비밀번호 변경

---

## 🐛 알려진 이슈 및 해결책

### 한글 IME 처리
- **문제:** 한글 입력 시 Enter 키 중복 처리
- **해결:** `isComposing` 상태로 조합 중 확인

### WebSocket 재연결
- **문제:** 네트워크 끊김 시 재연결 실패
- **해결:** 지수 백오프 재연결 로직

### 낙관적 업데이트 롤백
- **문제:** API 실패 시 UI 깜빡임
- **해결:** 부드러운 애니메이션 전환

---

## 📚 참고 문서

### 프로젝트 문서
- [PRD](../../prd.md)
- [유저플로우](../../userflow.md)
- [데이터베이스 설계](../../database.md)
- [상태 관리 설계](../../state-management.md)
- [요구사항 문서](../../requirements.md)

### 유즈케이스
- [UC-001: 회원가입](../../usecases/001_signup.md)
- [UC-002: 로그인](../../usecases/002_login.md)
- [UC-003: 채팅방 만들기](../../usecases/003_create_room.md)
- [UC-004: 채팅방 입장](../../usecases/004_join_room.md)
- [UC-005: 메시지 전송](../../usecases/005_send_message.md)
- [UC-006: 메시지 좋아요](../../usecases/006_like_message.md)
- [UC-007: 메시지 답장](../../usecases/007_reply_message.md)
- [UC-008: 메시지 삭제](../../usecases/008_delete_message.md)
- [UC-009: 닉네임 변경](../../usecases/009_change_nickname.md)
- [UC-010: 비밀번호 변경](../../usecases/010_change_password.md)
- [UC-011: 로그아웃](../../usecases/011_logout.md)
- [UC-012: 비로그인 접근 제한](../../usecases/012_auth_guard.md)

---

## ✅ 체크리스트 (구현 전)

### 문서 확인
- [ ] PRD 숙지
- [ ] 모든 유즈케이스 검토
- [ ] 데이터베이스 스키마 확인
- [ ] 상태 관리 아키텍처 이해

### 환경 설정
- [ ] Next.js 15.5.6 프로젝트 초기화
- [ ] TypeScript 설정
- [ ] ESLint + Prettier 설정
- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정

### 의존성 설치
- [ ] 필수 패키지 설치
- [ ] shadcn-ui 초기화
- [ ] 필요한 컴포넌트 추가

### 디렉토리 구조 생성
- [ ] src/app (페이지)
- [ ] src/features (기능별 모듈)
- [ ] src/backend (Hono 앱)
- [ ] src/components/ui (shadcn-ui)
- [ ] src/lib (유틸리티)

---

## 🎓 학습 자료

### Next.js 15.5.6
- App Router 구조
- Server Components vs Client Components
- Middleware (Turbopack 완전 지원)
- API Routes with Hono

### React 19.2.0
- use hook
- Server Actions (필요 시)

### TanStack Query v5
- useQuery
- useMutation
- Optimistic Updates
- Invalidation

### Zustand
- Global State Management
- Persist Middleware

### Hono
- Routing
- Middleware
- Context
- Zod Validation

---

## 📞 문의 및 지원

구현 중 문제가 발생하거나 명세가 불명확한 경우:

1. 관련 유즈케이스 문서 재확인
2. PRD 및 요구사항 문서 참조
3. 상태 관리 설계 문서 검토
4. 팀 리뷰 요청

---

**마지막 업데이트:** 2025-10-19
**작성자:** 승현 (AI 어시스턴트)
**버전:** v1.0
