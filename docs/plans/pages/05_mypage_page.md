# 마이페이지 구현 계획

**페이지명:** 마이페이지 (My Page)
**경로:** `/mypage`
**우선순위:** 5 (계정 관리)
**작성일:** 2025-10-19
**관련 유즈케이스:** UC-009 (닉네임 변경), UC-010 (비밀번호 변경), UC-011 (로그아웃)
**선행 페이지:** 01_login_page.md, 02_register_page.md, 03_main_page.md

---

## 1. 페이지 개요

로그인한 사용자가 자신의 계정 정보를 관리하는 페이지입니다. 닉네임 변경, 비밀번호 변경, 로그아웃 기능을 제공합니다.

### 핵심 기능
- 사용자 정보 표시 (이메일, 닉네임)
- 닉네임 변경
- 비밀번호 변경 (기존 비밀번호 확인 필수)
- 로그아웃

---

## 2. 경로 및 접근 설정

### 2.1 페이지 경로
```
/mypage
```

### 2.2 접근 권한
- **보호된 페이지**: 인증 필수
- **비로그인 접근 시**: 로그인 페이지(/login?redirect=/mypage)로 리디렉션

---

## 3. 컴포넌트 구조

```
MyPage
├── PageHeader
│   ├── BackButton
│   └── Title
├── ProfileSection
│   ├── Email (읽기 전용)
│   └── CurrentNickname
├── NicknameChangeSection
│   ├── NewNicknameInput
│   └── SaveButton
├── PasswordChangeSection
│   ├── CurrentPasswordInput
│   ├── NewPasswordInput
│   ├── NewPasswordConfirmInput
│   └── SaveButton
└── LogoutSection
    └── LogoutButton
```

---

## 4. 주요 컴포넌트

### 4.1 NicknameChangeForm

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nicknameChangeSchema } from '@/features/profile/lib/dto';
import { useChangeNickname } from '@/features/profile/hooks/use-change-nickname';

export function NicknameChangeForm() {
  const { user } = useAuthStore();
  const { mutate: changeNickname, isPending } = useChangeNickname();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(nicknameChangeSchema),
  });

  const onSubmit = (data) => {
    if (data.nickname === user?.nickname) {
      toast.error('현재 닉네임과 동일합니다');
      return;
    }

    changeNickname(data, {
      onSuccess: () => {
        toast.success('닉네임이 변경되었습니다');
        reset();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label>현재 닉네임</Label>
        <p className="text-gray-600">{user?.nickname}</p>
      </div>
      <div>
        <Label htmlFor="nickname">새 닉네임</Label>
        <Input
          id="nickname"
          placeholder="새 닉네임 (1-50자)"
          maxLength={50}
          {...register('nickname')}
          disabled={isPending}
        />
        {errors.nickname && (
          <p className="text-red-600 text-sm">{errors.nickname.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
```

### 4.2 PasswordChangeForm

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordChangeSchema } from '@/features/profile/lib/dto';
import { useChangePassword } from '@/features/profile/hooks/use-change-password';

export function PasswordChangeForm() {
  const { mutate: changePassword, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = (data) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success('비밀번호가 변경되었습니다');
        reset();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="currentPassword">기존 비밀번호</Label>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          {...register('currentPassword')}
          disabled={isPending}
        />
        {errors.currentPassword && (
          <p className="text-red-600 text-sm">{errors.currentPassword.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          placeholder="최소 8자 이상"
          {...register('newPassword')}
          disabled={isPending}
        />
        {errors.newPassword && (
          <p className="text-red-600 text-sm">{errors.newPassword.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="newPasswordConfirm">새 비밀번호 확인</Label>
        <PasswordInput
          id="newPasswordConfirm"
          autoComplete="new-password"
          placeholder="새 비밀번호 재입력"
          {...register('newPasswordConfirm')}
          disabled={isPending}
        />
        {errors.newPasswordConfirm && (
          <p className="text-red-600 text-sm">{errors.newPasswordConfirm.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
```

### 4.3 LogoutButton

```typescript
'use client';

import { useLogout } from '@/features/auth/hooks/use-logout';

export function LogoutButton() {
  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? '로그아웃 중...' : '로그아웃'}
    </Button>
  );
}
```

---

## 5. 상태 관리

### 5.1 Hooks

#### useChangeNickname
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';
import { apiClient } from '@/lib/remote/api-client';

export function useChangeNickname() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (data: { nickname: string }) => {
      const response = await apiClient.patch('/api/users/me/nickname', data);
      return response.data.data;
    },

    onSuccess: (data) => {
      // 전역 상태 업데이트
      updateUser({ nickname: data.user.nickname });
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
```

#### useChangePassword
```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      newPasswordConfirm: string;
    }) => {
      const response = await apiClient.patch('/api/users/me/password', data);
      return response.data;
    },

    onError: (error: any) => {
      if (error.response?.data?.error?.code === 'INVALID_PASSWORD') {
        toast.error('기존 비밀번호가 일치하지 않습니다');
      } else {
        toast.error('비밀번호 변경에 실패했습니다');
      }
    },
  });
}
```

#### useLogout
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';
import { apiClient } from '@/lib/remote/api-client';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/auth/logout');
    },

    onSettled: () => {
      // 성공/실패 여부와 관계없이 클라이언트 로그아웃 진행
      logout();
      queryClient.clear();
      router.push('/login');
    },
  });
}
```

---

## 6. API 연동

### 6.1 Backend Routes

```typescript
// src/features/profile/backend/route.ts
const profile = new Hono<AppEnv>();

// 닉네임 변경
profile.patch('/me/nickname', withAuth, zValidator('json', nicknameChangeSchema), changeNicknameHandler);

// 비밀번호 변경
profile.patch('/me/password', withAuth, zValidator('json', passwordChangeSchema), changePasswordHandler);

app.route('/users', profile);

// 로그아웃
auth.post('/logout', withAuth, logoutHandler);
```

### 6.2 Services

#### changeNicknameService
```typescript
export async function changeNicknameService(c: Context<AppEnv>, input: { nickname: string }) {
  const supabase = c.get('supabase');
  const userId = c.get('userId');
  const config = c.get('config');

  // 닉네임 업데이트
  const { data: user, error } = await supabase
    .from('users')
    .update({ nickname: input.nickname })
    .eq('id', userId)
    .select('id, email, nickname')
    .single();

  if (error || !user) {
    return {
      success: false,
      error: {
        code: 'NICKNAME_UPDATE_FAILED',
        message: '닉네임 변경에 실패했습니다',
        status: 500,
      },
    };
  }

  // JWT 재발급
  const newToken = jwt.sign(
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
      user,
      token: newToken,
    },
  };
}
```

#### changePasswordService
```typescript
export async function changePasswordService(c: Context<AppEnv>, input: {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}) {
  const supabase = c.get('supabase');
  const userId = c.get('userId');

  // 기존 비밀번호 검증
  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();

  if (!user) {
    return {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: '사용자를 찾을 수 없습니다',
        status: 404,
      },
    };
  }

  const isValid = await bcrypt.compare(input.currentPassword, user.password_hash);

  if (!isValid) {
    return {
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: '기존 비밀번호가 일치하지 않습니다',
        status: 401,
      },
    };
  }

  // 새 비밀번호 해싱
  const newHash = await bcrypt.hash(input.newPassword, 10);

  // 비밀번호 업데이트
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', userId);

  if (error) {
    return {
      success: false,
      error: {
        code: 'PASSWORD_UPDATE_FAILED',
        message: '비밀번호 변경에 실패했습니다',
        status: 500,
      },
    };
  }

  return {
    success: true,
    data: {},
  };
}
```

---

## 7. 유효성 검증

### 7.1 Schemas

```typescript
// src/features/profile/backend/schema.ts
import { z } from 'zod';

export const nicknameChangeSchema = z.object({
  nickname: z.string()
    .min(1, '닉네임을 입력해주세요')
    .max(50, '닉네임은 최대 50자까지 가능합니다'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, '기존 비밀번호를 입력해주세요'),
  newPassword: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['newPasswordConfirm'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: '새 비밀번호는 기존 비밀번호와 달라야 합니다',
  path: ['newPassword'],
});
```

---

## 8. 에러 처리

### 8.1 닉네임 변경 에러
- 현재 닉네임과 동일
- 길이 제한 (1-50자)
- 서버 오류

### 8.2 비밀번호 변경 에러
- 기존 비밀번호 불일치
- 새 비밀번호 길이 부족 (8자 미만)
- 새 비밀번호 불일치
- 기존 비밀번호와 동일
- 서버 오류

---

## 9. 테스트 시나리오

### 9.1 닉네임 변경
- [ ] 유효한 닉네임으로 변경 성공
- [ ] JWT 토큰 재발급 확인
- [ ] 헤더에 새 닉네임 즉시 반영
- [ ] 현재 닉네임과 동일 시 오류

### 9.2 비밀번호 변경
- [ ] 유효한 비밀번호로 변경 성공
- [ ] 기존 비밀번호 불일치 시 오류
- [ ] 새 비밀번호 불일치 시 오류
- [ ] 기존 비밀번호와 동일 시 오류

### 9.3 로그아웃
- [ ] 로그아웃 후 로그인 페이지 리디렉션
- [ ] 전역 상태 초기화
- [ ] React Query 캐시 초기화

---

## 10. 구현 단계

### Phase 1: 기본 구조
1. [ ] MyPage 페이지
2. [ ] ProfileSection
3. [ ] 레이아웃

### Phase 2: 닉네임 변경
1. [ ] NicknameChangeForm
2. [ ] use-change-nickname hook
3. [ ] Backend API

### Phase 3: 비밀번호 변경
1. [ ] PasswordChangeForm
2. [ ] use-change-password hook
3. [ ] Backend API

### Phase 4: 로그아웃
1. [ ] LogoutButton
2. [ ] use-logout hook
3. [ ] 클라이언트 정리 로직

---

## 11. 의존성

```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "@tanstack/react-query": "^5.x",
  "bcrypt": "^5.x",
  "jsonwebtoken": "^9.x"
}
```

---

## 12. 관련 문서

- [PRD](../../prd.md)
- [Usecase 009 - 닉네임 변경](../../usecases/009_change_nickname.md)
- [Usecase 010 - 비밀번호 변경](../../usecases/010_change_password.md)
- [Usecase 011 - 로그아웃](../../usecases/011_logout.md)
- [로그인 페이지 계획](./01_login_page.md)
- [메인 페이지 계획](./03_main_page.md)
