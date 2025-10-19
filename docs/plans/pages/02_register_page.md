# 회원가입 페이지 구현 계획

**페이지명:** 회원가입 페이지 (Register Page)
**경로:** `/register`
**우선순위:** 2 (사용자 등록)
**작성일:** 2025-10-19
**관련 유즈케이스:** UC-001 (회원가입)
**선행 페이지:** 01_login_page.md

---

## 1. 페이지 개요

신규 사용자가 이메일, 비밀번호, 닉네임을 입력하여 Cokaotalk 계정을 생성하는 페이지입니다. 회원가입 완료 후 자동으로 로그인 페이지로 리디렉션됩니다.

### 핵심 기능
- 이메일/비밀번호/닉네임 입력 및 검증
- 비밀번호 재확인
- 이메일 중복 확인
- 회원가입 처리 및 계정 생성
- 로그인 페이지로 리디렉션

---

## 2. 경로 및 접근 설정

### 2.1 페이지 경로
```
/register
```

### 2.2 접근 권한
- **공개 페이지**: 인증 불필요
- **조건부 리디렉션**: 이미 로그인된 경우 메인 페이지(/)로 자동 리디렉션

### 2.3 미들웨어 처리
```typescript
// middleware.ts (로그인 페이지와 동일한 로직 재사용)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // 이미 로그인된 상태에서 회원가입 페이지 접근 시
  if (token && request.nextUrl.pathname === '/register') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
```

---

## 3. 컴포넌트 구조

### 3.1 페이지 컴포넌트
```
src/app/register/page.tsx
```

### 3.2 컴포넌트 계층 구조
```
RegisterPage
├── RegisterHeader
│   ├── Logo
│   └── Title
├── RegisterForm
│   ├── EmailInput
│   ├── PasswordInput
│   │   └── PasswordToggleButton
│   ├── PasswordConfirmInput
│   │   └── PasswordToggleButton
│   ├── NicknameInput
│   ├── SubmitButton
│   └── ErrorMessage
└── RegisterFooter
    └── LoginLink
```

### 3.3 주요 컴포넌트

#### RegisterPage (src/app/register/page.tsx)
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // 이미 로그인된 경우 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <RegisterHeader />
        <RegisterForm />
        <RegisterFooter />
      </div>
    </div>
  );
}
```

#### RegisterForm (src/features/auth/components/RegisterForm.tsx)
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/features/auth/lib/dto';
import { useRegister } from '@/features/auth/hooks/use-register';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

export function RegisterForm() {
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  const onSubmit = (data: RegisterInput) => {
    register(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4" role="alert">
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
            {...registerField('email')}
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
            autoComplete="new-password"
            placeholder="최소 8자 이상"
            {...registerField('password')}
            disabled={isPending}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
          <PasswordInput
            id="passwordConfirm"
            autoComplete="new-password"
            placeholder="비밀번호 재입력"
            {...registerField('passwordConfirm')}
            disabled={isPending}
          />
          {errors.passwordConfirm && (
            <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            type="text"
            autoComplete="off"
            placeholder="닉네임 (1-50자)"
            maxLength={50}
            {...registerField('nickname')}
            disabled={isPending}
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{errors.nickname.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? '회원가입 중...' : '회원가입'}
      </Button>
    </form>
  );
}
```

---

## 4. 상태 관리

### 4.1 React Query

#### Register Mutation Hook (src/features/auth/hooks/use-register.ts)
```typescript
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/remote/api-client';
import type { RegisterInput, RegisterResponse } from '@/features/auth/lib/dto';
import { toast } from '@/components/ui/use-toast';

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterInput): Promise<RegisterResponse> => {
      const response = await apiClient.post('/api/auth/register', data);
      return response.data.data;
    },

    onSuccess: () => {
      toast({
        title: '회원가입 완료',
        description: '회원가입이 완료되었습니다. 로그인해주세요.',
        variant: 'success',
      });

      // 로그인 페이지로 리디렉션
      router.push('/login');
    },

    onError: (error: any) => {
      console.error('Registration failed:', error);
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
import { registerSchema } from './schema';
import { registerService } from './service';
import { respond, failure } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';

export function registerAuthRoutes(app: Hono<AppEnv>) {
  const auth = new Hono<AppEnv>();

  // ... 로그인 라우트

  auth.post('/register', zValidator('json', registerSchema), async (c) => {
    const body = c.req.valid('json');
    const result = await registerService(c, body);

    if (!result.success) {
      return c.json(failure(result.error.code, result.error.message), result.error.status || 400);
    }

    return c.json(respond({ userId: result.data.userId }), 201);
  });

  app.route('/auth', auth);
}
```

#### Service (src/features/auth/backend/service.ts)
```typescript
import bcrypt from 'bcrypt';
import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { RegisterInput } from './schema';
import { AUTH_ERRORS } from './error';

export async function registerService(c: Context<AppEnv>, input: RegisterInput) {
  const supabase = c.get('supabase');

  // 이메일 중복 확인
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.email)
    .single();

  if (existingUser) {
    return {
      success: false,
      error: AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
    };
  }

  // 비밀번호 해싱
  const passwordHash = await bcrypt.hash(input.password, 10);

  // 사용자 생성
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: input.email,
      nickname: input.nickname,
      password_hash: passwordHash,
    })
    .select('id')
    .single();

  if (error || !user) {
    return {
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: '회원가입에 실패했습니다',
        status: 500,
      },
    };
  }

  return {
    success: true,
    data: {
      userId: user.id,
    },
  };
}
```

#### Schema (src/features/auth/backend/schema.ts)
```typescript
import { z } from 'zod';

// ... loginSchema

export const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  nickname: z.string().min(1, '닉네임을 입력해주세요').max(50, '닉네임은 최대 50자까지 가능합니다'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerResponseSchema = z.object({
  userId: z.string().uuid(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;
```

#### Error Codes (src/features/auth/backend/error.ts)
```typescript
export const AUTH_ERRORS = {
  // ... 로그인 에러
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
```

### 5.2 DTO 재노출 (src/features/auth/lib/dto.ts)
```typescript
export { loginSchema, loginResponseSchema, registerSchema, registerResponseSchema } from '../backend/schema';
export type { LoginInput, LoginResponse, RegisterInput, RegisterResponse } from '../backend/schema';
```

---

## 6. 에러 처리

### 6.1 클라이언트 에러 처리

#### 유효성 검증 에러
- 이메일 형식 오류
- 비밀번호 길이 부족 (8자 미만)
- 비밀번호 불일치
- 닉네임 미입력 또는 길이 초과

#### 서버 에러
- 409: 이메일 중복
- 500: 서버 내부 오류

#### 네트워크 에러
- 타임아웃 (30초)
- 연결 실패

### 6.2 에러 메시지 표시
```typescript
// 필드별 에러 메시지
{errors.email && (
  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
)}

// 전역 에러 메시지
{error && (
  <div className="rounded-md bg-red-50 p-4" role="alert">
    <p className="text-sm text-red-800">{error.message}</p>
  </div>
)}
```

---

## 7. 성능 최적화

### 7.1 실시간 유효성 검증
```typescript
// watch를 사용한 비밀번호 일치 여부 실시간 확인
const password = watch('password');
const passwordConfirm = watch('passwordConfirm');

const passwordsMatch = password === passwordConfirm && password.length >= 8;
```

### 7.2 중복 제출 방지
- 버튼 비활성화 (isPending)
- API 호출 중 모든 입력 필드 비활성화

---

## 8. 접근성 고려사항

### 8.1 키보드 접근성
- Tab 키로 모든 필드 접근 가능
- Enter 키로 회원가입 가능

### 8.2 스크린 리더 지원
- 모든 입력 필드에 label 연결
- 오류 메시지에 role="alert" 설정
- aria-invalid 속성으로 오류 필드 표시

### 8.3 포커스 관리
- 페이지 로드 시 이메일 필드에 자동 포커스
- 에러 발생 시 첫 번째 오류 필드로 포커스 이동

---

## 9. 테스트 시나리오

### 9.1 정상 케이스
- [ ] 유효한 정보로 회원가입 성공
- [ ] 회원가입 후 로그인 페이지로 리디렉션
- [ ] 생성된 계정으로 로그인 가능

### 9.2 유효성 검증
- [ ] 잘못된 이메일 형식 입력 시 오류 메시지
- [ ] 7자 이하 비밀번호 입력 시 오류 메시지
- [ ] 비밀번호 불일치 시 오류 메시지
- [ ] 빈 닉네임 입력 시 오류 메시지
- [ ] 51자 이상 닉네임 입력 차단

### 9.3 중복 검증
- [ ] 동일 이메일 재가입 시도 시 오류 응답

### 9.4 보안
- [ ] 비밀번호가 bcrypt로 해싱되어 저장됨
- [ ] SQL Injection 시도 차단
- [ ] XSS 공격 시도 차단

### 9.5 UX
- [ ] 중복 제출 방지 (버튼 비활성화)
- [ ] 비밀번호 표시/숨김 토글
- [ ] 네트워크 오류 시 재시도 가능
- [ ] 모바일 환경에서 정상 동작

---

## 10. 구현 단계

### Phase 1: 기본 구조 (우선순위: 높음)
1. **페이지 및 라우팅 설정**
   - [ ] `/register` 페이지 생성
   - [ ] 미들웨어 설정 (로그인 상태 체크)
   - [ ] 리디렉션 로직 구현

2. **컴포넌트 생성**
   - [ ] RegisterPage 컴포넌트
   - [ ] RegisterForm 컴포넌트
   - [ ] PasswordInput 컴포넌트 재사용

3. **상태 관리 설정**
   - [ ] use-register hook (React Query)

### Phase 2: 백엔드 연동 (우선순위: 높음)
1. **Backend API 구현**
   - [ ] auth/backend/route.ts에 register 라우트 추가
   - [ ] auth/backend/service.ts에 registerService 추가
   - [ ] auth/backend/schema.ts에 registerSchema 추가
   - [ ] auth/backend/error.ts에 에러 코드 추가

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
   - [ ] 성공 토스트 메시지

3. **접근성**
   - [ ] 키보드 접근성
   - [ ] 스크린 리더 지원
   - [ ] ARIA 속성 추가

### Phase 4: 테스트 (우선순위: 중간)
1. **단위 테스트**
   - [ ] registerService 테스트
   - [ ] use-register hook 테스트

2. **통합 테스트**
   - [ ] 회원가입 플로우 E2E 테스트

---

## 11. 의존성

### 11.1 필요한 라이브러리
```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "@tanstack/react-query": "^5.x",
  "bcrypt": "^5.x",
  "hono": "^3.x"
}
```

### 11.2 shadcn-ui 컴포넌트
```bash
# 로그인 페이지와 동일
npx shadcn@latest add input
npx shadcn@latest add button
npx shadcn@latest add label
npx shadcn@latest add toast
```

---

## 12. 다른 페이지와의 연결

### 12.1 In-bound (이 페이지로 들어오는 경로)
- **로그인 페이지**: "회원가입" 링크 클릭

### 12.2 Out-bound (이 페이지에서 나가는 경로)
- **회원가입 성공**: 로그인 페이지(/login)로 리디렉션
- **로그인 링크**: 로그인 페이지(/login)로 이동

---

## 13. 로그인 페이지와의 차이점

### 13.1 추가 필드
- 비밀번호 확인
- 닉네임

### 13.2 추가 유효성 검증
- 비밀번호 일치 여부 확인
- 닉네임 길이 확인 (1-50자)
- 이메일 중복 확인

### 13.3 성공 후 처리
- 로그인 페이지: 메인 페이지로 리디렉션
- 회원가입 페이지: 로그인 페이지로 리디렉션 (자동 로그인 없음)

---

## 14. 주의사항

### 14.1 보안
- 비밀번호는 HTTPS를 통해서만 전송
- bcrypt로 해싱 후 저장 (솔트 라운드 10)
- XSS/SQL Injection 방지

### 14.2 성능
- 이메일 중복 확인은 서버에서만 수행 (프론트엔드에서 미리 확인하지 않음)
- 불필요한 리렌더링 방지

### 14.3 UX
- 로딩 상태 명확히 표시
- 에러 메시지는 사용자 친화적으로 작성
- 회원가입 성공 시 명확한 피드백

---

## 15. 체크리스트

### 구현 전 확인사항
- [ ] PRD 및 유즈케이스 문서 숙지
- [ ] 로그인 페이지 구현 완료
- [ ] 데이터베이스 스키마 확인

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

## 16. 관련 문서

- [PRD](../../prd.md)
- [Usecase 001 - 회원가입](../../usecases/001_signup.md)
- [데이터베이스 설계](../../database.md)
- [로그인 페이지 계획](./01_login_page.md)
- [메인 페이지 계획](./03_main_page.md)
