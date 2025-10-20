export const ROOM_ERRORS = {
  ROOMS_FETCH_FAILED: {
    code: 'ROOMS_FETCH_FAILED',
    message: '채팅방 목록을 불러오는데 실패했습니다',
    status: 500,
  },
  ROOM_CREATE_FAILED: {
    code: 'ROOM_CREATE_FAILED',
    message: '채팅방 생성에 실패했습니다',
    status: 500,
  },
  PARTICIPANT_ADD_FAILED: {
    code: 'PARTICIPANT_ADD_FAILED',
    message: '채팅방 생성에 실패했습니다',
    status: 500,
  },
  ROOM_NOT_FOUND: {
    code: 'ROOM_NOT_FOUND',
    message: '채팅방을 찾을 수 없습니다',
    status: 404,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: '로그인이 필요합니다',
    status: 401,
  },
} as const;
