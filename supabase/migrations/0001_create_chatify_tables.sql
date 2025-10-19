-- =============================================================================
-- Cokaotalk MVP 데이터베이스 마이그레이션
-- 작성일: 2025-10-19
-- 설명: 사용자, 채팅방, 메시지, 반응 테이블 생성
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. updated_at 자동 업데이트 트리거 함수 생성
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. users 테이블 생성
-- 사용자 계정 정보를 저장합니다.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- users 테이블 updated_at 트리거
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- users 테이블 주석
COMMENT ON TABLE users IS '사용자 계정 정보';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.email IS '로그인용 이메일 (유니크)';
COMMENT ON COLUMN users.nickname IS '사용자 닉네임 (중복 허용)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt 해싱된 비밀번호';
COMMENT ON COLUMN users.created_at IS '계정 생성 시간';
COMMENT ON COLUMN users.updated_at IS '최종 수정 시간';

-- -----------------------------------------------------------------------------
-- 3. rooms 테이블 생성
-- 채팅방 정보를 저장합니다.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- rooms 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);

-- rooms 테이블 updated_at 트리거
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- rooms 테이블 주석
COMMENT ON TABLE rooms IS '채팅방 정보';
COMMENT ON COLUMN rooms.id IS '채팅방 고유 ID';
COMMENT ON COLUMN rooms.name IS '채팅방 이름';
COMMENT ON COLUMN rooms.creator_id IS '채팅방 생성자 ID';
COMMENT ON COLUMN rooms.is_active IS '채팅방 활성화 상태';
COMMENT ON COLUMN rooms.created_at IS '채팅방 생성 시간';
COMMENT ON COLUMN rooms.updated_at IS '최종 수정 시간';

-- -----------------------------------------------------------------------------
-- 4. room_participants 테이블 생성
-- 채팅방 참여자 정보를 저장합니다.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- room_participants 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);

-- room_participants 테이블 주석
COMMENT ON TABLE room_participants IS '채팅방 참여자 정보';
COMMENT ON COLUMN room_participants.id IS '참여 레코드 고유 ID';
COMMENT ON COLUMN room_participants.room_id IS '채팅방 ID';
COMMENT ON COLUMN room_participants.user_id IS '참여자 ID';
COMMENT ON COLUMN room_participants.joined_at IS '참여 시간';

-- -----------------------------------------------------------------------------
-- 5. messages 테이블 생성
-- 채팅 메시지를 저장합니다.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'text',
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);

-- messages 테이블 updated_at 트리거
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- messages 테이블 주석
COMMENT ON TABLE messages IS '채팅 메시지';
COMMENT ON COLUMN messages.id IS '메시지 고유 ID';
COMMENT ON COLUMN messages.room_id IS '채팅방 ID';
COMMENT ON COLUMN messages.user_id IS '작성자 ID';
COMMENT ON COLUMN messages.content IS '메시지 내용 (텍스트/이모지)';
COMMENT ON COLUMN messages.type IS '메시지 타입 (text, emoji, system)';
COMMENT ON COLUMN messages.parent_message_id IS '답장 대상 메시지 ID';
COMMENT ON COLUMN messages.is_deleted IS '삭제 여부 (Soft delete)';
COMMENT ON COLUMN messages.created_at IS '메시지 전송 시간';
COMMENT ON COLUMN messages.updated_at IS '최종 수정 시간';

-- -----------------------------------------------------------------------------
-- 6. message_reactions 테이블 생성
-- 메시지 좋아요 정보를 저장합니다.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- message_reactions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- message_reactions 테이블 주석
COMMENT ON TABLE message_reactions IS '메시지 반응 (좋아요)';
COMMENT ON COLUMN message_reactions.id IS '반응 레코드 고유 ID';
COMMENT ON COLUMN message_reactions.message_id IS '메시지 ID';
COMMENT ON COLUMN message_reactions.user_id IS '좋아요 누른 사용자 ID';
COMMENT ON COLUMN message_reactions.reaction_type IS '반응 타입 (MVP는 like만 사용)';
COMMENT ON COLUMN message_reactions.created_at IS '반응 생성 시간';

-- -----------------------------------------------------------------------------
-- 7. RLS (Row Level Security) 비활성화
-- MVP에서는 애플리케이션 레이어에서 인증/인가를 처리합니다.
-- -----------------------------------------------------------------------------
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions DISABLE ROW LEVEL SECURITY;

COMMIT;

-- =============================================================================
-- 마이그레이션 완료
-- =============================================================================
