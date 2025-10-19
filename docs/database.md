# 📊 Cokaotalk MVP 데이터베이스 설계 문서

**프로젝트:** Cokaotalk MVP (v1.2)
**작성일:** 2025-10-19
**작성자:** 승현
**데이터베이스:** PostgreSQL (Supabase)

---

## 📌 문서 개요

이 문서는 Cokaotalk MVP의 데이터베이스 스키마와 데이터 플로우를 정의합니다.
유저플로우 문서에 명시된 기능만을 구현하는 최소 스펙으로 설계되었습니다.

---

## 🔄 데이터 플로우 요약

### 1. 회원가입/로그인 플로우
```
[사용자 입력] → [입력 검증] → users 테이블 저장 → [JWT 토큰 발급]
```

### 2. 채팅방 생성 플로우
```
[채팅방 이름 입력] → rooms 테이블 저장 → room_participants 테이블에 생성자 추가 → [채팅방 목록 업데이트]
```

### 3. 채팅방 입장 플로우
```
[채팅방 클릭] → rooms 테이블 조회 → room_participants 테이블 확인/추가 → messages 테이블 조회 (히스토리) → [WebSocket 구독]
```

### 4. 메시지 전송 플로우
```
[메시지 입력] → messages 테이블 저장 → [WebSocket 브로드캐스트] → [모든 참여자에게 실시간 전달]
```

### 5. 메시지 좋아요 플로우
```
[좋아요 버튼 클릭] → message_reactions 테이블 조회 (중복 확인) → 추가/삭제 → [WebSocket 업데이트]
```

### 6. 메시지 답장 플로우
```
[답장 버튼 클릭] → [답장 UI 활성화] → messages 테이블 저장 (parent_message_id 설정) → [WebSocket 브로드캐스트]
```

### 7. 메시지 삭제 플로우
```
[삭제 버튼 클릭] → messages 테이블 업데이트 (is_deleted = true) → [WebSocket 업데이트]
```

### 8. 닉네임 변경 플로우
```
[새 닉네임 입력] → users 테이블 업데이트 (nickname) → [JWT 토큰 재발급] → [전역 상태 업데이트]
```

### 9. 비밀번호 변경 플로우
```
[기존 비밀번호 확인] → [새 비밀번호 해싱] → users 테이블 업데이트 (password_hash) → [성공 메시지]
```

---

## 🗂️ 데이터베이스 스키마

### 1. users 테이블
사용자 계정 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 사용자 고유 ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 로그인용 이메일 |
| nickname | VARCHAR(50) | NOT NULL | 사용자 닉네임 (중복 허용) |
| password_hash | TEXT | NOT NULL | bcrypt 해싱된 비밀번호 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 계정 생성 시간 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 최종 수정 시간 |

**인덱스:**
- `idx_users_email` ON email (UNIQUE, 로그인 조회 최적화)

**트리거:**
- `updated_at` 자동 갱신 트리거

**사용 플로우:**
- 회원가입: INSERT (email, nickname, password_hash)
- 로그인: SELECT WHERE email = ?
- 닉네임 변경: UPDATE nickname WHERE id = ?
- 비밀번호 변경: UPDATE password_hash WHERE id = ?

---

### 2. rooms 테이블
채팅방 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 채팅방 고유 ID |
| name | VARCHAR(100) | NOT NULL | 채팅방 이름 |
| creator_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | 채팅방 생성자 |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 채팅방 활성화 상태 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 채팅방 생성 시간 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 최종 수정 시간 |

**인덱스:**
- `idx_rooms_creator_id` ON creator_id (생성자별 조회)
- `idx_rooms_is_active` ON is_active (활성 채팅방 필터링)

**트리거:**
- `updated_at` 자동 갱신 트리거

**사용 플로우:**
- 채팅방 생성: INSERT (name, creator_id)
- 채팅방 목록 조회: SELECT WHERE is_active = true
- 채팅방 입장: SELECT WHERE id = ? AND is_active = true

---

### 3. room_participants 테이블
채팅방 참여자 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 참여 레코드 고유 ID |
| room_id | UUID | NOT NULL, REFERENCES rooms(id) ON DELETE CASCADE | 채팅방 ID |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | 참여자 ID |
| joined_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 참여 시간 |

**제약조건:**
- UNIQUE(room_id, user_id) - 중복 참여 방지

**인덱스:**
- `idx_room_participants_room_id` ON room_id (채팅방별 참여자 조회)
- `idx_room_participants_user_id` ON user_id (사용자별 참여 채팅방 조회)

**사용 플로우:**
- 채팅방 생성 시: INSERT (room_id, user_id) - 생성자 자동 추가
- 채팅방 입장 시: INSERT ON CONFLICT DO NOTHING
- 참여자 목록 조회: SELECT WHERE room_id = ?

---

### 4. messages 테이블
채팅 메시지를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 메시지 고유 ID |
| room_id | UUID | NOT NULL, REFERENCES rooms(id) ON DELETE CASCADE | 채팅방 ID |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | 작성자 ID |
| content | TEXT | NOT NULL | 메시지 내용 (텍스트/이모지) |
| type | VARCHAR(20) | NOT NULL, DEFAULT 'text' | 메시지 타입 (text, emoji, system) |
| parent_message_id | UUID | REFERENCES messages(id) ON DELETE SET NULL | 답장 대상 메시지 ID |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | 삭제 여부 (Soft delete) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 메시지 전송 시간 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 최종 수정 시간 |

**인덱스:**
- `idx_messages_room_id_created_at` ON (room_id, created_at DESC) - 채팅방별 메시지 조회 최적화
- `idx_messages_user_id` ON user_id (사용자별 메시지 조회)
- `idx_messages_parent_message_id` ON parent_message_id (답장 관계 조회)

**트리거:**
- `updated_at` 자동 갱신 트리거

**사용 플로우:**
- 메시지 전송: INSERT (room_id, user_id, content, type, parent_message_id)
- 메시지 히스토리 조회: SELECT WHERE room_id = ? ORDER BY created_at DESC LIMIT 50
- 답장 메시지: INSERT (parent_message_id 포함)
- 메시지 삭제: UPDATE SET is_deleted = true WHERE id = ? AND user_id = ?

---

### 5. message_reactions 테이블
메시지 좋아요 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 반응 레코드 고유 ID |
| message_id | UUID | NOT NULL, REFERENCES messages(id) ON DELETE CASCADE | 메시지 ID |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | 좋아요 누른 사용자 ID |
| reaction_type | VARCHAR(20) | NOT NULL, DEFAULT 'like' | 반응 타입 (MVP는 like만 사용) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 반응 생성 시간 |

**제약조건:**
- UNIQUE(message_id, user_id, reaction_type) - 중복 좋아요 방지

**인덱스:**
- `idx_message_reactions_message_id` ON message_id (메시지별 좋아요 조회)
- `idx_message_reactions_user_id` ON user_id (사용자별 좋아요 조회)

**사용 플로우:**
- 좋아요 추가: INSERT (message_id, user_id, reaction_type)
- 좋아요 취소: DELETE WHERE message_id = ? AND user_id = ?
- 좋아요 수 조회: SELECT COUNT(*) WHERE message_id = ?
- 좋아요 여부 확인: SELECT EXISTS WHERE message_id = ? AND user_id = ?

---

## 🔗 테이블 관계도

```
users (1) ─────── (N) rooms [creator_id]
  │                      │
  │                      │
  │                      │
  └─── (N) room_participants (N) ───┘
  │
  │
  └─── (N) messages
         │
         ├─── (N) message_reactions
         │
         └─── (N) messages [parent_message_id] (self-reference)
```

---

## 📊 주요 쿼리 패턴

### 1. 채팅방 목록 조회 (참여자 수 포함)
```sql
SELECT
  r.id,
  r.name,
  r.created_at,
  u.nickname AS creator_nickname,
  COUNT(rp.user_id) AS participant_count
FROM rooms r
JOIN users u ON r.creator_id = u.id
LEFT JOIN room_participants rp ON r.id = rp.room_id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.created_at, u.nickname
ORDER BY r.created_at DESC;
```

### 2. 채팅방 메시지 히스토리 조회 (좋아요 수 포함)
```sql
SELECT
  m.id,
  m.content,
  m.type,
  m.parent_message_id,
  m.is_deleted,
  m.created_at,
  u.nickname AS author_nickname,
  COUNT(mr.id) AS like_count
FROM messages m
JOIN users u ON m.user_id = u.id
LEFT JOIN message_reactions mr ON m.id = mr.message_id
WHERE m.room_id = $1
GROUP BY m.id, m.content, m.type, m.parent_message_id, m.is_deleted, m.created_at, u.nickname
ORDER BY m.created_at DESC
LIMIT 50 OFFSET $2;
```

### 3. 사용자가 좋아요한 메시지 확인
```sql
SELECT message_id
FROM message_reactions
WHERE user_id = $1 AND message_id IN ($2, $3, $4, ...);
```

---

## 🔐 보안 고려사항

### RLS (Row Level Security)
- **비활성화**: MVP에서는 RLS를 사용하지 않음
- 모든 인증/인가는 애플리케이션 레이어에서 처리

### 데이터 보호
- **비밀번호**: bcrypt 해싱으로 저장, 절대 평문 저장 금지
- **Soft Delete**: 메시지 삭제 시 is_deleted 플래그 사용, 감사 목적으로 데이터 보존
- **CASCADE 삭제**: 사용자/채팅방 삭제 시 관련 데이터 자동 정리

---

## 📈 성능 최적화

### 인덱스 전략
1. **복합 인덱스**: (room_id, created_at DESC) - 채팅방별 메시지 조회 최적화
2. **외래 키 인덱스**: 모든 FK에 인덱스 추가로 JOIN 성능 향상
3. **UNIQUE 인덱스**: 중복 방지와 조회 성능 동시 달성

### 쿼리 최적화
- **페이지네이션**: LIMIT/OFFSET으로 메시지 로딩
- **LEFT JOIN**: 좋아요 수 등 선택적 데이터 조회
- **COUNT 최적화**: 참여자 수, 좋아요 수는 필요 시에만 조회

---

## 🔄 마이그레이션 정보

**마이그레이션 파일:** `supabase/migrations/0001_create_Cokaotalk_tables.sql`

**실행 순서:**
1. updated_at 트리거 함수 생성
2. users 테이블 생성
3. rooms 테이블 생성
4. room_participants 테이블 생성
5. messages 테이블 생성
6. message_reactions 테이블 생성
7. 인덱스 생성
8. 트리거 연결

---

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|-----|------|----------|--------|
| v1.0 | 2025-10-19 | 초기 데이터베이스 설계 문서 작성 | 승현 |

---

## 🔗 관련 문서

- [Product Requirement Document (PRD)](./prd.md)
- [유저플로우 문서](./userflow.md)
- [API 명세서](./api-spec.md)
