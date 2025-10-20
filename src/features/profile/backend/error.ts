export const PROFILE_ERRORS = {
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: '사용자를 찾을 수 없습니다',
    status: 404,
  },
  NICKNAME_UPDATE_FAILED: {
    code: 'NICKNAME_UPDATE_FAILED',
    message: '닉네임 변경에 실패했습니다',
    status: 500,
  },
  INVALID_PASSWORD: {
    code: 'INVALID_PASSWORD',
    message: '기존 비밀번호가 일치하지 않습니다',
    status: 401,
  },
  PASSWORD_UPDATE_FAILED: {
    code: 'PASSWORD_UPDATE_FAILED',
    message: '비밀번호 변경에 실패했습니다',
    status: 500,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: '인증이 필요합니다',
    status: 401,
  },
} as const;
