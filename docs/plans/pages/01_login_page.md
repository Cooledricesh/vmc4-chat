# 로그인 페이지 구현 계획

**페이지명:** 로그인 페이지 (Login Page)
**경로:** `/login`
**우선순위:** 1 (최우선 - 인증의 기본)
**작성일:** 2025-10-19
**관련 유즈케이스:** UC-002 (로그인), UC-012 (비로그인 접근 제한)

---

## 1. 페이지 개요

사용자가 이메일과 비밀번호를 입력하여 Cokaotalk에 로그인하는 페이지입니다. 인증 성공 시 JWT 토큰을 발급받아 메인 페이지로 이동하며, 이미 로그인된 상태에서는 자동으로 메인 페이지로 리디렉션됩니다.

### 핵심 기능
- 이메일/비밀번호 입력 및 검증
- 로그인 처리 및 JWT 토큰 발급
- 자동 리디렉션 (로그인 전 접근 URL 복원)
- 로그인 상태 체크 및 메인 페이지 리디렉션
- 회원가입 페이지 링크 제공

---

## 2. 경로 및 접근 설정

### 2.1 페이지 경로
```
/login
```

### 2.2 접근 권한
- **공개 페이지**: 인증 불필요
- **조건부 리디렉션**: 이미 로그인된 경우 메인 페이지(/)로 자동 리디렉션

### 2.3 미들웨어 처리
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // 이미 로그인된 상태에서 로그인 페이지 접근 시
  if (token && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
```

---

## 3. 컴포넌트 구조

### 3.1 페이지 컴포넌트
```
src/app/login/page.tsx
```

### 3.2 컴포넌트 계층 구조
```
LoginPage
├── LoginHeader
│   ├── Logo
│   └── Title
├── LoginForm
│   ├── EmailInput
│   ├── PasswordInput
│   │   └── PasswordToggleButton
│   ├── SubmitButton
│   └── ErrorMessage
└── LoginFooter
    ├── SignupLink
    └── ForgotPasswordLink (MVP 범위 외, 비활성화)
```

### 3.3 주요 컴포넌트

#### LoginPage (src/app/login/page.tsx)
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  // 이미 로그인된 경우 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  if (isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <LoginHeader />
        <LoginForm />
        <LoginFooter />
      </div>
    </div>
  );
}
```

#### LoginForm (src/features/auth/components/LoginForm.tsx)
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/features/auth/lib/dto';
import { useLogin } from '@/features/auth/hooks/use-login';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error.message}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            {...register('email')}
            disabled={isPending}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">비밀번호</Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            {...register('password')}
            disabled={isPending}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
```

---

## 4. 상태 관리

### 4.1 전역 상태 (Zustand)

#### Auth Store (src/features/auth/stores/auth-store.ts)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nickname: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true }),

      logout: () => set({ user: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

### 4.2 React Query

#### Login Mutation Hook (src/features/auth/hooks/use-login.ts)
```typescript
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from './use-auth-store';
import { apiClient } from '@/lib/remote/api-client';
import type { LoginInput, LoginResponse } from '@/features/auth/lib/dto';

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (data: LoginInput): Promise<LoginResponse> => {
      const response = await apiClient.post('/api/auth/login', data);
      return response.data.data;
    },

    onSuccess: (data) => {
      // 전역 상태에 사용자 정보 저장
      login(data.user);

      // 리디렉션 URL 확인 및 이동
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    },

    onError: (error: any) => {
      console.error('Login failed:', error);
    },
  });
}
```

---

## 5. API 연동

### 5.1 Backend API

#### Route (src/features/auth/backend/route.ts)
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginSchema } from './schema';
import { loginService } from './service';
import { respond, failure } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';

export function registerAuthRoutes(app: Hono<AppEnv>) {
  const auth = new Hono<AppEnv>();

  auth.post('/login', zValidator('json', loginSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await loginService(c, body);

    if (!result.success) {
      return c.json(failure(result.error.code, result.error.message), result.error.status || 401);
    }

    // JWT 토큰을 HTTP-only 쿠키로 설정
    c.header('Set-Cookie', `auth_token=${result.data.token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`);

    return c.json(respond({ user: result.data.user }));
  });

  app.route('/auth', auth);
}
```

#### Service (src/features/auth/backend/service.ts)
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { LoginInput } from './schema';
import { AUTH_ERRORS } from './error';

export async function loginService(c: Context<AppEnv>, input: LoginInput) {
  const supabase = c.get('supabase');
  const config = c.get('config');

  // 사용자 조회
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, nickname, password_hash')
    .eq('email', input.email)
    .single();

  if (error || !user) {
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_CREDENTIALS,
    };
  }

  // 비밀번호 검증
  const isValid = await bcrypt.compare(input.password, user.password_hash);

  if (!isValid) {
    return {
      success: false,
      error: AUTH_ERRORS.INVALID_CREDENTIALS,
    };
  }

  // JWT 토큰 생성
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      token,
    },
  };
}
```

#### Schema (src/features/auth/backend/schema.ts)
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    nickname: z.string(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
```

#### Error Codes (src/features/auth/backend/error.ts)
```typescript
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
} as const;
```

### 5.2 DTO 재노출 (src/features/auth/lib/dto.ts)
```typescript
export { loginSchema, loginResponseSchema } from '../backend/schema';
export type { LoginInput, LoginResponse } from '../backend/schema';
```

---

## 6. 에러 처리

### 6.1 클라이언트 에러 처리

#### 유효성 검증 에러
- 이메일 형식 오류
- 비밀번호 미입력

#### 서버 에러
- 401: 인증 실패 (이메일/비밀번호 불일치)
- 500: 서버 내부 오류

#### 네트워크 에러
- 타임아웃 (30초)
- 연결 실패

### 6.2 에러 메시지 표시
```typescript
// 통합 에러 메시지 표시
{error && (
  <div className="rounded-md bg-red-50 p-4" role="alert">
    <p className="text-sm text-red-800">{error.message}</p>
  </div>
)}
```

---

## 7. 성능 최적화

### 7.1 코드 스플리팅
```typescript
// 동적 임포트로 초기 로딩 최적화
const PasswordInput = dynamic(() => import('@/components/ui/password-input'), {
  loading: () => <InputSkeleton />,
});
```

### 7.2 요청 최적화
- 중복 제출 방지 (버튼 비활성화)
- 자동 완성 지원 (autocomplete 속성)

---

## 8. 접근성 고려사항

### 8.1 키보드 접근성
- Tab 키로 모든 필드 접근 가능
- Enter 키로 로그인 가능

### 8.2 스크린 리더 지원
- 모든 입력 필드에 label 연결
- 오류 메시지에 role="alert" 설정
- aria-invalid 속성으로 오류 필드 표시

### 8.3 포커스 관리
- 페이지 로드 시 이메일 필드에 자동 포커스
- 에러 발생 시 해당 필드로 포커스 이동

---

## 9. 테스트 시나리오

### 9.1 정상 케이스
- [ ] 유효한 이메일/비밀번호로 로그인 성공
- [ ] 로그인 후 메인 페이지로 리디렉션
- [ ] redirect 파라미터 있을 경우 해당 URL로 이동
- [ ] 이미 로그인된 상태에서 /login 접근 시 메인 페이지로 리디렉션

### 9.2 유효성 검증
- [ ] 잘못된 이메일 형식 입력 시 오류 메시지
- [ ] 비밀번호 미입력 시 오류 메시지
- [ ] 존재하지 않는 이메일 입력 시 인증 실패 메시지
- [ ] 잘못된 비밀번호 입력 시 인증 실패 메시지

### 9.3 UX
- [ ] 로딩 중 버튼 비활성화
- [ ] Enter 키로 로그인 가능
- [ ] 비밀번호 표시/숨김 토글
- [ ] 이메일 자동완성 지원

### 9.4 에러 처리
- [ ] 네트워크 오류 시 재시도 가능
- [ ] 서버 오류 시 명확한 에러 메시지

---

## 10. 구현 단계

### Phase 1: 기본 구조 (우선순위: 높음)
1. **페이지 및 라우팅 설정**
   - [ ] `/login` 페이지 생성
   - [ ] 미들웨어 설정 (로그인 상태 체크)
   - [ ] 리디렉션 로직 구현

2. **컴포넌트 생성**
   - [ ] LoginPage 컴포넌트
   - [ ] LoginForm 컴포넌트
   - [ ] PasswordInput 컴포넌트 (shadcn-ui)

3. **상태 관리 설정**
   - [ ] auth-store (Zustand)
   - [ ] use-login hook (React Query)

### Phase 2: 백엔드 연동 (우선순위: 높음)
1. **Backend API 구현**
   - [ ] auth/backend/route.ts
   - [ ] auth/backend/service.ts
   - [ ] auth/backend/schema.ts
   - [ ] auth/backend/error.ts

2. **API 클라이언트 연동**
   - [ ] apiClient 설정
   - [ ] DTO 재노출

### Phase 3: 폴리싱 (우선순위: 중간)
1. **에러 처리**
   - [ ] 클라이언트 에러 처리
   - [ ] 서버 에러 처리
   - [ ] 네트워크 에러 처리

2. **UX 개선**
   - [ ] 로딩 스피너
   - [ ] 비밀번호 표시/숨김
   - [ ] 자동 포커스

3. **접근성**
   - [ ] 키보드 접근성
   - [ ] 스크린 리더 지원
   - [ ] ARIA 속성 추가

### Phase 4: 테스트 (우선순위: 중간)
1. **단위 테스트**
   - [ ] loginService 테스트
   - [ ] use-login hook 테스트

2. **통합 테스트**
   - [ ] 로그인 플로우 E2E 테스트

---

## 11. 의존성

### 11.1 필요한 라이브러리
```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x",
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x",
  "hono": "^3.x"
}
```

### 11.2 shadcn-ui 컴포넌트
```bash
npx shadcn@latest add input
npx shadcn@latest add button
npx shadcn@latest add label
```

---

## 12. 다른 페이지와의 연결

### 12.1 In-bound (이 페이지로 들어오는 경로)
- **비로그인 접근 제한**: 보호된 페이지 접근 시 자동 리디렉션
- **로그아웃**: 로그아웃 후 리디렉션
- **회원가입 완료**: 회원가입 후 로그인 페이지로 이동

### 12.2 Out-bound (이 페이지에서 나가는 경로)
- **로그인 성공**: 메인 페이지(/) 또는 redirect URL로 이동
- **회원가입 링크**: 회원가입 페이지(/register)로 이동

---

## 13. 주의사항

### 13.1 보안
- 비밀번호는 HTTPS를 통해서만 전송
- JWT 토큰은 HTTP-only 쿠키로 저장
- CSRF 보호 구현

### 13.2 성능
- 불필요한 리렌더링 방지 (React.memo, useMemo)
- API 요청 중복 방지

### 13.3 UX
- 로딩 상태 명확히 표시
- 에러 메시지는 사용자 친화적으로 작성
- 입력 필드 자동완성 지원

---

## 14. 체크리스트

### 구현 전 확인사항
- [ ] PRD 및 유즈케이스 문서 숙지
- [ ] 데이터베이스 스키마 확인
- [ ] API 명세 확인

### 구현 중 확인사항
- [ ] TypeScript 타입 오류 없음
- [ ] ESLint 경고 없음
- [ ] 코드 리뷰 완료

### 구현 후 확인사항
- [ ] 모든 테스트 시나리오 통과
- [ ] 접근성 체크
- [ ] 성능 측정 (Lighthouse)
- [ ] 모바일 반응형 확인

---

## 15. 관련 문서

- [PRD](../../prd.md)
- [Usecase 002 - 로그인](../../usecases/002_login.md)
- [Usecase 012 - 비로그인 접근 제한](../../usecases/012_auth_guard.md)
- [데이터베이스 설계](../../database.md)
- [회원가입 페이지 계획](./02_register_page.md)
