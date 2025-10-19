# 메인 페이지 구현 계획

**페이지명:** 메인 페이지 (Main Page / 채팅방 목록)
**경로:** `/` (루트 페이지)
**우선순위:** 3 (핵심 페이지)
**작성일:** 2025-10-19
**관련 유즈케이스:** UC-003 (채팅방 만들기), UC-004 (채팅방 입장), UC-012 (비로그인 접근 제한)
**선행 페이지:** 01_login_page.md, 02_register_page.md

---

## 1. 페이지 개요

로그인한 사용자가 참여 가능한 채팅방 목록을 확인하고, 새로운 채팅방을 생성하거나 기존 채팅방에 입장할 수 있는 페이지입니다. 비로그인 사용자는 자동으로 로그인 페이지로 리디렉션됩니다.

### 핵심 기능
- 채팅방 목록 표시 (실시간 업데이트)
- 채팅방 생성 (모달)
- 채팅방 입장
- 헤더에 사용자 정보 및 마이페이지 링크
- 로그아웃 기능

---

## 2. 경로 및 접근 설정

### 2.1 페이지 경로
```
/ (루트 페이지)
```

### 2.2 접근 권한
- **보호된 페이지**: 인증 필수
- **비로그인 접근 시**: 로그인 페이지(/login)로 자동 리디렉션

### 2.3 미들웨어 처리
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isProtectedRoute = request.nextUrl.pathname === '/';

  // 비로그인 상태에서 메인 페이지 접근 시
  if (isProtectedRoute && !token) {
    const redirectUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/room/:path*', '/mypage', '/login', '/register'],
};
```

---

## 3. 컴포넌트 구조

### 3.1 페이지 컴포넌트
```
src/app/page.tsx
```

### 3.2 컴포넌트 계층 구조
```
MainPage
├── MainHeader
│   ├── Logo
│   ├── UserInfo
│   │   └── Nickname
│   ├── MyPageLink
│   └── LogoutButton
├── MainContent
│   ├── CreateRoomButton
│   ├── RoomList
│   │   ├── RoomListHeader
│   │   │   └── RoomCount
│   │   ├── RoomItem[]
│   │   │   ├── RoomName
│   │   │   ├── CreatorNickname
│   │   │   ├── ParticipantCount
│   │   │   └── CreatedAt
│   │   └── EmptyState
│   └── LoadingSpinner
└── CreateRoomModal
    ├── RoomNameInput
    ├── CancelButton
    └── CreateButton
```

### 3.3 주요 컴포넌트

#### MainPage (src/app/page.tsx)
```typescript
'use client';

import { MainHeader } from '@/features/rooms/components/MainHeader';
import { RoomList } from '@/features/rooms/components/RoomList';
import { CreateRoomButton } from '@/features/rooms/components/CreateRoomButton';
import { useRooms } from '@/features/rooms/hooks/use-rooms';

export default function MainPage() {
  const { data: rooms, isLoading } = useRooms();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">채팅방 목록</h1>
          <CreateRoomButton />
        </div>
        <RoomList rooms={rooms} isLoading={isLoading} />
      </main>
    </div>
  );
}
```

#### MainHeader (src/features/rooms/components/MainHeader.tsx)
```typescript
'use client';

import Link from 'next/link';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { Button } from '@/components/ui/button';

export function MainHeader() {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Cokaotalk</h1>
          {user && (
            <span className="text-sm text-gray-600">{user.nickname}님</span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/mypage">
            <Button variant="ghost">마이페이지</Button>
          </Link>
          <Button variant="ghost" onClick={() => logout()}>
            로그아웃
          </Button>
        </div>
      </div>
    </header>
  );
}
```

#### RoomList (src/features/rooms/components/RoomList.tsx)
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Room } from '@/features/rooms/lib/dto';

interface RoomListProps {
  rooms?: Room[];
  isLoading: boolean;
}

export function RoomList({ rooms, isLoading }: RoomListProps) {
  const router = useRouter();

  if (isLoading) {
    return <RoomListSkeleton />;
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">아직 채팅방이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">새로운 채팅방을 만들어보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/room/${room.id}`)}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <span>{room.name}</span>
              <Badge variant="secondary">{room.participantCount}명</Badge>
            </CardTitle>
            <CardDescription>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">생성자: {room.creatorNickname}</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(room.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
```

#### CreateRoomButton (src/features/rooms/components/CreateRoomButton.tsx)
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateRoom } from '@/features/rooms/hooks/use-create-room';
import { createRoomSchema, type CreateRoomInput } from '@/features/rooms/lib/dto';

export function CreateRoomButton() {
  const [open, setOpen] = useState(false);
  const { mutate: createRoom, isPending } = useCreateRoom();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
  });

  const onSubmit = (data: CreateRoomInput) => {
    createRoom(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>채팅방 만들기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 채팅방 만들기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">채팅방 이름</Label>
            <Input
              id="name"
              placeholder="채팅방 이름 (1-100자)"
              maxLength={100}
              {...register('name')}
              disabled={isPending}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '생성 중...' : '생성'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 4. 상태 관리

### 4.1 React Query

#### Rooms Query Hook (src/features/rooms/hooks/use-rooms.ts)
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { RoomsResponse } from '@/features/rooms/lib/dto';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async (): Promise<RoomsResponse> => {
      const response = await apiClient.get('/api/rooms');
      return response.data.data;
    },
    refetchInterval: 5000, // 5초마다 자동 갱신
  });
}
```

#### Create Room Mutation Hook (src/features/rooms/hooks/use-create-room.ts)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateRoomInput, CreateRoomResponse } from '@/features/rooms/lib/dto';
import { toast } from '@/components/ui/use-toast';

export function useCreateRoom() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomInput): Promise<CreateRoomResponse> => {
      const response = await apiClient.post('/api/rooms', data);
      return response.data.data;
    },

    onSuccess: (data) => {
      toast({
        title: '채팅방 생성 완료',
        description: '채팅방이 생성되었습니다.',
        variant: 'success',
      });

      // 채팅방 목록 무효화 (자동 리페치)
      queryClient.invalidateQueries({ queryKey: ['rooms'] });

      // 생성된 채팅방으로 이동
      router.push(`/room/${data.room.id}`);
    },

    onError: (error: any) => {
      console.error('Create room failed:', error);
      toast({
        title: '채팅방 생성 실패',
        description: error.message || '채팅방 생성에 실패했습니다.',
        variant: 'destructive',
      });
    },
  });
}
```

### 4.2 WebSocket 실시간 업데이트 (선택사항)

```typescript
// src/features/rooms/hooks/use-rooms-realtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useRoomsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('rooms')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
      }, () => {
        // 채팅방 목록 무효화
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

---

## 5. API 연동

### 5.1 Backend API

#### Route (src/features/rooms/backend/route.ts)
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createRoomSchema } from './schema';
import { getRoomsService, createRoomService } from './service';
import { respond, failure } from '@/backend/http/response';
import { withAuth } from '@/backend/middleware/with-auth';
import type { AppEnv } from '@/backend/hono/context';

export function registerRoomsRoutes(app: Hono<AppEnv>) {
  const rooms = new Hono<AppEnv>();

  // 채팅방 목록 조회
  rooms.get('/', withAuth, async (c) => {
    const result = await getRoomsService(c);

    if (!result.success) {
      return c.json(failure(result.error.code, result.error.message), result.error.status || 500);
    }

    return c.json(respond({ rooms: result.data.rooms }));
  });

  // 채팅방 생성
  rooms.post('/', withAuth, zValidator('json', createRoomSchema), async (c) => {
    const body = c.req.valid('json');
    const userId = c.get('userId'); // withAuth 미들웨어에서 설정
    const result = await createRoomService(c, { ...body, creatorId: userId });

    if (!result.success) {
      return c.json(failure(result.error.code, result.error.message), result.error.status || 500);
    }

    return c.json(respond({ room: result.data.room }), 201);
  });

  app.route('/rooms', rooms);
}
```

#### Service (src/features/rooms/backend/service.ts)
```typescript
import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { CreateRoomInput } from './schema';

export async function getRoomsService(c: Context<AppEnv>) {
  const supabase = c.get('supabase');

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select(`
      id,
      name,
      created_at,
      creator:users!creator_id(nickname),
      participants:room_participants(count)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return {
      success: false,
      error: {
        code: 'ROOMS_FETCH_FAILED',
        message: '채팅방 목록을 불러오는데 실패했습니다',
        status: 500,
      },
    };
  }

  // 참여자 수 계산
  const roomsWithCount = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    createdAt: room.created_at,
    creatorNickname: room.creator.nickname,
    participantCount: room.participants.length,
  }));

  return {
    success: true,
    data: { rooms: roomsWithCount },
  };
}

export async function createRoomService(
  c: Context<AppEnv>,
  input: CreateRoomInput & { creatorId: string }
) {
  const supabase = c.get('supabase');

  // 트랜잭션: 채팅방 생성 + 생성자를 참여자로 추가
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      name: input.name,
      creator_id: input.creatorId,
    })
    .select()
    .single();

  if (roomError || !room) {
    return {
      success: false,
      error: {
        code: 'ROOM_CREATE_FAILED',
        message: '채팅방 생성에 실패했습니다',
        status: 500,
      },
    };
  }

  // 생성자를 참여자로 추가
  const { error: participantError } = await supabase
    .from('room_participants')
    .insert({
      room_id: room.id,
      user_id: input.creatorId,
    });

  if (participantError) {
    // 참여자 추가 실패 시 채팅방 삭제 (롤백)
    await supabase.from('rooms').delete().eq('id', room.id);

    return {
      success: false,
      error: {
        code: 'PARTICIPANT_ADD_FAILED',
        message: '채팅방 생성에 실패했습니다',
        status: 500,
      },
    };
  }

  return {
    success: true,
    data: {
      room: {
        id: room.id,
        name: room.name,
        createdAt: room.created_at,
      },
    },
  };
}
```

#### Schema (src/features/rooms/backend/schema.ts)
```typescript
import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string()
    .min(1, '채팅방 이름을 입력해주세요')
    .max(100, '채팅방 이름은 최대 100자까지 가능합니다')
    .transform((val) => val.trim()),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const roomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  creatorNickname: z.string(),
  participantCount: z.number(),
  createdAt: z.string(),
});

export type Room = z.infer<typeof roomSchema>;

export const roomsResponseSchema = z.object({
  rooms: z.array(roomSchema),
});

export type RoomsResponse = z.infer<typeof roomsResponseSchema>;

export const createRoomResponseSchema = z.object({
  room: z.object({
    id: z.string().uuid(),
    name: z.string(),
    createdAt: z.string(),
  }),
});

export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>;
```

### 5.2 인증 미들웨어 (src/backend/middleware/with-auth.ts)
```typescript
import { MiddlewareHandler } from 'hono';
import jwt from 'jsonwebtoken';
import type { AppEnv } from '@/backend/hono/context';

export const withAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = c.req.cookie('auth_token');

  if (!token) {
    return c.json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '로그인이 필요합니다',
      },
    }, 401);
  }

  try {
    const config = c.get('config');
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      email: string;
      nickname: string;
    };

    // 컨텍스트에 사용자 정보 설정
    c.set('userId', decoded.userId);
    c.set('userEmail', decoded.email);
    c.set('userNickname', decoded.nickname);

    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '유효하지 않은 토큰입니다',
      },
    }, 401);
  }
};
```

---

## 6. 에러 처리

### 6.1 클라이언트 에러 처리

- 채팅방 목록 로드 실패
- 채팅방 생성 실패
- 네트워크 오류

### 6.2 에러 표시

```typescript
// 채팅방 목록 로드 실패 시
{error && (
  <div className="text-center py-12">
    <p className="text-red-500">채팅방 목록을 불러오는데 실패했습니다.</p>
    <Button onClick={() => refetch()} className="mt-4">
      다시 시도
    </Button>
  </div>
)}
```

---

## 7. 성능 최적화

### 7.1 자동 리페치
- 5초마다 채팅방 목록 자동 갱신
- WebSocket으로 실시간 업데이트 (선택사항)

### 7.2 최적화 기법
- React Query 캐싱
- 낙관적 업데이트 (채팅방 생성 시)

---

## 8. 테스트 시나리오

### 8.1 정상 케이스
- [ ] 채팅방 목록 정상 표시
- [ ] 채팅방 생성 성공
- [ ] 채팅방 클릭 시 해당 채팅방으로 이동
- [ ] 실시간 업데이트 (새 채팅방 즉시 표시)

### 8.2 인증
- [ ] 비로그인 상태에서 접근 시 로그인 페이지 리디렉션
- [ ] 로그인 후 메인 페이지 정상 표시

### 8.3 UX
- [ ] 로딩 상태 표시
- [ ] 빈 상태 표시
- [ ] 에러 발생 시 재시도 옵션

---

## 9. 구현 단계

### Phase 1: 기본 구조
1. [ ] 페이지 및 라우팅 설정
2. [ ] MainHeader 컴포넌트
3. [ ] RoomList 컴포넌트

### Phase 2: 백엔드 연동
1. [ ] rooms/backend/route.ts
2. [ ] rooms/backend/service.ts
3. [ ] rooms/backend/schema.ts
4. [ ] withAuth 미들웨어

### Phase 3: 채팅방 생성
1. [ ] CreateRoomButton 컴포넌트
2. [ ] CreateRoomModal
3. [ ] use-create-room hook

### Phase 4: 실시간 업데이트
1. [ ] WebSocket 연동 (선택사항)
2. [ ] 폴링 방식 자동 리페치

---

## 10. 의존성

### 10.1 필요한 라이브러리
```json
{
  "@tanstack/react-query": "^5.x",
  "date-fns": "^3.x",
  "hono": "^3.x",
  "jsonwebtoken": "^9.x"
}
```

### 10.2 shadcn-ui 컴포넌트
```bash
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add badge
```

---

## 11. 관련 문서

- [PRD](../../prd.md)
- [Usecase 003 - 채팅방 만들기](../../usecases/003_create_room.md)
- [Usecase 004 - 채팅방 입장](../../usecases/004_join_room.md)
- [로그인 페이지 계획](./01_login_page.md)
- [채팅방 페이지 계획](./04_chatroom_page.md)
- [마이페이지 계획](./05_mypage_page.md)
