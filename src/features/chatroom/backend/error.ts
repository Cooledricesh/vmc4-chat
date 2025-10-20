export const CHATROOM_ERRORS = {
  ROOM_NOT_FOUND: {
    status: 404,
    code: 'ROOM_NOT_FOUND',
    message: '채팅방을 찾을 수 없습니다',
  },
  ROOM_INACTIVE: {
    status: 403,
    code: 'ROOM_INACTIVE',
    message: '비활성화된 채팅방입니다',
  },
  MESSAGES_FETCH_FAILED: {
    status: 500,
    code: 'MESSAGES_FETCH_FAILED',
    message: '메시지를 불러오는데 실패했습니다',
  },
  MESSAGE_SEND_FAILED: {
    status: 500,
    code: 'MESSAGE_SEND_FAILED',
    message: '메시지 전송에 실패했습니다',
  },
  MESSAGE_NOT_FOUND: {
    status: 404,
    code: 'MESSAGE_NOT_FOUND',
    message: '메시지를 찾을 수 없습니다',
  },
  MESSAGE_DELETE_FAILED: {
    status: 500,
    code: 'MESSAGE_DELETE_FAILED',
    message: '메시지 삭제에 실패했습니다',
  },
  UNAUTHORIZED_DELETE: {
    status: 403,
    code: 'UNAUTHORIZED_DELETE',
    message: '본인의 메시지만 삭제할 수 있습니다',
  },
  REACTION_TOGGLE_FAILED: {
    status: 500,
    code: 'REACTION_TOGGLE_FAILED',
    message: '좋아요 처리에 실패했습니다',
  },
  SELF_REACTION_NOT_ALLOWED: {
    status: 400,
    code: 'SELF_REACTION_NOT_ALLOWED',
    message: '본인의 메시지에는 좋아요를 누를 수 없습니다',
  },
  PARTICIPANTS_FETCH_FAILED: {
    status: 500,
    code: 'PARTICIPANTS_FETCH_FAILED',
    message: '참여자 목록을 불러오는데 실패했습니다',
  },
  JOIN_FAILED: {
    status: 500,
    code: 'JOIN_FAILED',
    message: '채팅방 입장에 실패했습니다',
  },
} as const;
