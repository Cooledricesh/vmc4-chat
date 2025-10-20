export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: '이메일 혹은 비밀번호를 확인해주세요',
    status: 401,
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: '사용자를 찾을 수 없습니다',
    status: 404,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: '로그인이 필요합니다',
    status: 401,
  },
  TOKEN_EXPIRED: {
    code: 'TOKEN_EXPIRED',
    message: '세션이 만료되었습니다',
    status: 401,
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'EMAIL_ALREADY_EXISTS',
    message: '이미 사용 중인 이메일입니다',
    status: 409,
  },
  REGISTRATION_FAILED: {
    code: 'REGISTRATION_FAILED',
    message: '회원가입에 실패했습니다',
    status: 500,
  },
} as const;
