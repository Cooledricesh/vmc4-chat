# 🧩 Product Requirement Document (PRD)

**프로젝트명:** Chatify MVP (v1.2)
**작성일:** 2025-10-19
**작성자:** 승현
**최종 수정:** 2025-10-19

---

## 1. 제품 개요 (Product Overview)

**목표:**
사용자가 회원가입 후 로그인하여 **채팅방을 만들거나 참여**하고, **닉네임 및 비밀번호를 관리할 수 있는 간단한 실시간 채팅 서비스**를 제공한다. MVP 단계에서는 **로그인 기반 접근 제한**, **기본적인 사용자 관리**, **실시간 대화** 기능에 집중한다.

**핵심 기능:**

* 로그인 / 회원가입 (닉네임 설정 포함)
* 메인 페이지(채팅방 목록)
* 채팅방 개설 및 참여
* 메시지 전송 (텍스트 / 이모지)
* 메시지 좋아요 / 답장 / 내 메시지 삭제
* 마이페이지 (닉네임 / 비밀번호 변경)
* 비로그인 시 로그인 페이지로 리디렉션

**제품 비전:**
“즉시 연결되는 대화의 즐거움, 누구나 쉽게 시작할 수 있는 채팅 공간”

---

## 2. 주요 이해관계자 (Stakeholders)

| 구분              | 역할                      | 주요 책임                             |
| --------------- | ----------------------- | --------------------------------- |
| **승현 (1인 개발자)** | PM · 기획 · 디자인 · 개발 · 배포 | 기능 기획, UX 설계, 프론트/백엔드 구현, 테스트, 운영 |

---

## 3. 포함 페이지 (Included Pages)

| 페이지명                   | 주요 기능                                             | 네비게이션                    |
| ---------------------- | ------------------------------------------------- | ------------------------- |
| **1. 로그인 페이지**         | 이메일/비밀번호 로그인, 비로그인 접근 시 자동 리디렉션                   | 회원가입 링크                   |
| **2. 회원가입 페이지**        | 이메일, 비밀번호, 닉네임 입력 및 계정 생성                         | 로그인 페이지로 이동               |
| **3. 메인 페이지 (루트 페이지)** | 로그인 후 접근, 채팅방 목록 표시, 새 방 개설, 상단 헤더에 '마이페이지' 메뉴 표시 | 마이페이지 링크, 로그아웃            |
| **4. 채팅방 페이지**         | 실시간 메시지 송수신, 좋아요, 답장, 내 메시지 삭제                    | 메인페이지로 돌아가기, 마이페이지 링크   |
| **5. 마이페이지**           | 닉네임 변경, 비밀번호 변경(기존 비밀번호 확인 + 새 비밀번호 입력 + 재확인)     | 메인페이지로 돌아가기 |

---

## 4. 사용자 여정 (User Journey)

### 🎯 타겟 유저 세그먼트

* **단일 타겟:** 일반 사용자 (친구, 동료, 소규모 그룹 커뮤니케이션 목적)

---

### 👣 사용자 여정 단계별 흐름

| 단계 | 페이지             | 사용자 행동                              | 시스템 반응                      |
| -- | --------------- | ----------------------------------- | --------------------------- |
| 1  | 로그인 페이지         | 로그인 시도                              | JWT 발급 후 메인 페이지로 이동         |
| 2  | 로그인 페이지         | 계정이 없을 경우 “회원가입” 클릭                 | 회원가입 페이지로 이동                |
| 3  | 회원가입 페이지        | 이메일, 비밀번호, 닉네임 입력 후 회원가입            | DB 저장 후 로그인 페이지로 이동         |
| 4  | 메인 페이지 (루트)     | 로그인한 사용자는 채팅방 목록 확인 가능              | 실시간 채팅방 목록 표시               |
| 5  | 메인 페이지          | “채팅방 만들기” 클릭                        | 새 채팅방 생성 후 목록 업데이트          |
| 6  | 메인 페이지          | 채팅방 클릭                              | 해당 방으로 이동                   |
| 7  | 채팅방 페이지         | 메시지 입력 및 전송                         | WebSocket으로 모든 참여자에게 실시간 반영 |
| 8  | 채팅방 페이지         | 좋아요 / 답장 / 내 메시지 삭제 수행              | UI 갱신 및 DB 반영               |
| 9  | 메인 헤더           | “마이페이지” 클릭                          | 마이페이지로 이동                   |
| 10 | 마이페이지           | 닉네임 변경 → 저장 클릭                      | DB 업데이트, 변경사항 반영            |
| 11 | 마이페이지           | 비밀번호 변경 → 기존 비밀번호 입력 + 새 비밀번호 + 재확인 | 유효성 검증 후 저장 성공 시 알림 표시      |
| 12 | 비로그인 상태에서 루트 접근 | / 또는 /main 접근 시                     | 자동으로 로그인 페이지로 리디렉션          |

---

## 5. 정보 구조 (Information Architecture, IA)

```
Chatify MVP
│
├── 로그인 페이지 (/login)
│   ├── 이메일 입력
│   ├── 비밀번호 입력
│   └── 로그인 버튼 / 회원가입 링크
│
├── 회원가입 페이지 (/register)
│   ├── 이메일 입력
│   ├── 비밀번호 입력
│   ├── 비밀번호 확인
│   ├── 닉네임 입력
│   └── 회원가입 버튼
│
├── 메인 페이지 (/)
│   ├── 헤더
│   │   ├── 서비스 로고
│   │   └── 마이페이지 링크
│   ├── 채팅방 목록
│   │   ├── 내가 만든 방
│   │   └── 참여 가능한 방
│   └── 채팅방 만들기 버튼
│
├── 채팅방 페이지 (/room/:id)
│   ├── 상단: 방 이름 / 참여자 수
│   ├── 메시지 리스트
│   │   ├── 텍스트 메시지
│   │   ├── 이모지 메시지
│   │   └── 시스템 메시지 (입장/퇴장)
│   ├── 메시지 액션
│   │   ├── 좋아요
│   │   ├── 답장
│   │   └── 삭제 (본인 메시지)
│   └── 입력창
│       ├── 텍스트 입력
│       ├── 이모지 선택
│       └── 전송 버튼
│
└── 마이페이지 (/mypage)
    ├── 닉네임 변경
    │   ├── 현재 닉네임 표시
    │   ├── 새 닉네임 입력
    │   └── 저장 버튼
    ├── 비밀번호 변경
    │   ├── 기존 비밀번호 입력
    │   ├── 새 비밀번호 입력
    │   ├── 새 비밀번호 재확인
    │   └── 저장 버튼
    └── 로그아웃 버튼
```

---

## 6. 네비게이션 구조 (Navigation Structure)

### 📍 전역 네비게이션
- **헤더 영역**: 모든 페이지 상단에 일관성 있게 표시
  - 로고/서비스명 (메인페이지 링크)
  - 마이페이지 아이콘/버튼
  - 로그아웃 버튼 (로그인 상태에서만)

### 🔙 페이지별 네비게이션 요구사항

| 페이지 | 네비게이션 요소 | 위치 | 동작 |
|------|------------|-----|-----|
| **로그인** | 회원가입 링크 | 하단 | 회원가입 페이지로 이동 |
| **회원가입** | 로그인 페이지 링크 | 하단 | 로그인 페이지로 이동 |
| **메인 페이지** | 마이페이지 버튼 | 상단 헤더 | 마이페이지로 이동 |
| | 로그아웃 버튼 | 상단 헤더 | 로그아웃 후 로그인 페이지로 |
| **채팅방** | 뒤로가기 버튼 | 상단 좌측 | 메인페이지로 이동 |
| | 마이페이지 버튼 | 상단 우측 | 마이페이지로 이동 |
| **마이페이지** | 뒤로가기 버튼 | 상단 좌측 | 메인페이지로 이동 |
| | 채팅방 목록 버튼 | 상단 우측 | 메인페이지로 이동 |

---

## 7. UX 요구사항 (UX Requirements)

### 💬 채팅방 인터랙션

#### 메시지 입력 UX
- **포커스 유지**: 메시지 전송 후에도 입력창에 포커스가 유지되어 연속적인 메시지 작성 가능
- **엔터키 전송**: Enter 키로 메시지 전송, Shift+Enter로 줄바꿈
- **입력창 자동 높이 조절**: 멀티라인 입력 시 입력창 높이 자동 조절 (최대 5줄)
- **이모지 피커**: 입력창 옆 이모지 버튼 클릭 시 이모지 선택 팝업

#### 한글 입력 처리
- **IME 조합 처리**: 한글 조합 중 엔터 키 입력 시 메시지 전송 방지
- **중복 전송 방지**: `compositionend` 이벤트 처리로 한글 마지막 글자 중복 방지

#### 메시지 표시
- **자동 스크롤**: 새 메시지 도착 시 자동으로 최하단 스크롤
- **스크롤 위치 기억**: 이전 메시지를 읽는 중일 때는 자동 스크롤 비활성화
- **시간 그룹핑**: 같은 사용자가 1분 내 연속 메시지 전송 시 그룹핑

---

## 8. 기술 요구사항 (Technical Requirements)

### 🎯 핵심 기술 스택
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Hono, Supabase
- **Real-time**: WebSocket (Supabase Realtime)
- **State Management**: Zustand, TanStack Query
- **Form Handling**: React Hook Form, Zod validation

### 🔐 보안 요구사항
- **인증/인가**: JWT 기반 인증, HTTP-only cookies
- **비밀번호**: bcrypt 해싱, 최소 8자 이상
- **입력 검증**: 모든 사용자 입력에 대한 서버/클라이언트 검증
- **XSS 방지**: 사용자 입력 sanitization
- **CSRF 보호**: CSRF 토큰 구현

### 📊 데이터베이스 스키마 (기본)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  creator_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  parent_message_id UUID REFERENCES messages(id),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  reaction_type VARCHAR(20) DEFAULT 'like',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Room participants table
CREATE TABLE room_participants (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);
```

### 🚀 배포 및 인프라
- **Hosting**: Vercel (Frontend + API)
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics
- **Error Tracking**: Sentry (선택사항)

### 📈 성공 지표 (KPIs)
- **페이지 로드 시간**: < 2초 (3G 네트워크)
- **메시지 전송 지연**: < 100ms
- **동시 접속자**: 최소 100명 지원
- **가동 시간**: 99.9% 이상
- **모바일 반응성**: 터치 이벤트 < 50ms 응답

---

## 9. 변경 이력 (Change Log)

| 버전 | 날짜 | 변경 내용 | 작성자 |
|-----|------|----------|--------|
| v1.0 | 2025-10-17 | 초기 PRD 작성 | 승현 |
| v1.1 | 2025-10-18 | 마이페이지 기능 추가 | 승현 |
| v1.2 | 2025-10-19 | 네비게이션 구조 추가, UX 요구사항 상세화, 한글 입력 이슈 대응 추가 | 승현 |
