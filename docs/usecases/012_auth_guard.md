# Usecase 012: 비로그인 접근 제한

**문서 번호:** UC-012
**기능명:** 비로그인 접근 제한
**작성일:** 2025-10-19
**관련 유저플로우:** 12. 비로그인 접근 제한 유저플로우

---

## 1. 개요

비로그인 사용자가 보호된 페이지(메인 페이지, 채팅방, 마이페이지)에 접근할 때 자동으로 로그인 페이지로 리디렉션하는 기능입니다. 라우트 가드를 통해 모든 보호된 페이지에 일관되게 적용됩니다.

---

## 2. 사전 조건

- Next.js 라우팅 시스템이 정상 동작해야 합니다.
- JWT 토큰 검증 로직이 구현되어 있어야 합니다.
- 미들웨어 또는 라우트 가드가 설정되어 있어야 합니다.

---

## 3. 액터

- **주 액터:** 비로그인 사용자
- **부 액터:** Next.js 라우팅 시스템, 인증 미들웨어

---

## 4. 기본 시나리오 (정상 흐름)

### 4.1. 보호된 페이지 접근 시도
1. 비로그인 사용자가 다음 중 하나를 시도합니다:
   - 메인 페이지(/) URL 입력
   - 채팅방 페이지(/room/:id) 직접 접속
   - 마이페이지(/mypage) 북마크 클릭
   - 다른 보호된 페이지 접근

### 4.2. 라우트 가드 실행
2. Next.js 미들웨어 또는 페이지 컴포넌트가 실행됩니다.
3. 시스템이 인증 상태를 확인합니다:
   - HTTP-only 쿠키에서 JWT 토큰 추출
   - 토큰 존재 여부 확인

### 4.3. 토큰 검증
4. 토큰이 존재할 경우:
   - 토큰 서명 검증
   - 만료 시간 확인
   - 토큰 페이로드 유효성 확인

### 4.4. 인증 상태 판별
5. 시스템이 인증 상태를 판별합니다:
   - **토큰 없음:** 미인증 상태
   - **토큰 만료:** 만료된 세션
   - **토큰 무효:** 변조된 토큰
   - **토큰 유효:** 인증됨 (페이지 접근 허용)

### 4.5. 리디렉션 처리 (미인증 시)
6. 미인증 상태로 판별된 경우:
   - 원래 요청한 URL을 저장합니다:
     ```typescript
     const redirectUrl = encodeURIComponent(requestedUrl);
     ```
   - 로그인 페이지로 리디렉션합니다:
     ```
     /login?redirect=${redirectUrl}
     ```

### 4.6. 로그인 페이지 표시
7. 로그인 페이지가 렌더링됩니다.
8. 접근 제한 안내 메시지가 표시됩니다 (선택사항):
   - "로그인이 필요합니다"

### 4.7. 로그인 후 복귀
9. 사용자가 로그인을 완료합니다.
10. 시스템이 저장된 redirect URL로 자동 이동합니다.
11. 원래 접근하려던 페이지가 표시됩니다.

---

## 5. 대체 시나리오 (예외 상황)

### 5.1. 토큰 만료
- **조건:** JWT 토큰의 exp가 현재 시간보다 이전
- **결과:**
  - "세션이 만료되었습니다. 다시 로그인해주세요" 메시지
  - 로그인 페이지로 리디렉션
  - 원래 URL 저장 (로그인 후 복귀용)
- **복구:** 사용자가 재로그인

### 5.2. 토큰 무효
- **조건:** JWT 서명 검증 실패 또는 페이로드 변조
- **결과:**
  - 보안 경고 메시지 (선택사항)
  - 로그인 페이지로 리디렉션
  - 모든 로컬 데이터 초기화
  - 원래 URL 저장하지 않음 (보안)
- **복구:** 사용자가 재로그인

### 5.3. 로그인 중 만료
- **조건:** 페이지 사용 중 토큰 만료
- **결과:**
  - API 요청 시 401 Unauthorized 응답
  - "세션이 만료되었습니다" 모달 표시
  - 작업 중단 및 재인증 요구
  - 로그인 페이지로 리디렉션
- **복구:** 사용자가 재로그인

### 5.4. 다중 탭 동시 접근
- **조건:** 여러 탭/창에서 동시 페이지 접근
- **결과:**
  - 모든 탭에서 일관된 인증 상태 확인
  - 하나의 탭에서 로그아웃 시 모든 탭 리디렉션
  - BroadcastChannel 또는 storage 이벤트 활용
- **복구:** 일관된 처리

### 5.5. 새로고침 시
- **조건:** 보호된 페이지에서 F5 또는 새로고침
- **결과:**
  - 동일한 인증 확인 프로세스 실행
  - 토큰 유효: 페이지 정상 로드
  - 토큰 무효: 로그인 페이지 리디렉션
- **복구:** 자동 처리

### 5.6. 뒤로가기/앞으로가기
- **조건:** 브라우저 히스토리 네비게이션
- **결과:**
  - 히스토리 스택의 보호된 페이지 접근 시 인증 확인
  - 미인증 시 로그인 페이지로 리디렉션
  - 히스토리 스택 정리 (무한 루프 방지)
- **복구:** 자동 처리

### 5.7. API 요청 중 인증 실패
- **조건:** 페이지 로드 후 API 요청 시 401 응답
- **결과:**
  - 요청 중단
  - 전역 에러 핸들러 실행
  - "로그인이 만료되었습니다" 메시지
  - 로그인 페이지로 리디렉션
- **복구:** 사용자가 재로그인

---

## 6. 사후 조건

### 인증 성공 시
- 사용자는 요청한 보호된 페이지에 접근할 수 있습니다.
- 페이지 컴포넌트가 정상 렌더링됩니다.

### 인증 실패 시
- 사용자는 로그인 페이지로 리디렉션됩니다.
- 원래 요청한 URL이 redirect 파라미터로 저장됩니다.
- 접근 제한 안내 메시지가 표시됩니다.

---

## 7. 비기능적 요구사항

### 7.1. 성능
- 인증 확인 시간: 100ms 이내
- 리디렉션 처리: 즉시

### 7.2. 보안
- 모든 보호된 페이지에 라우트 가드 적용
- JWT 토큰 서명 검증 필수
- 토큰 만료 시간 엄격히 적용
- 무효 토큰 시 로컬 데이터 초기화

### 7.3. 사용성
- 원래 URL 저장 (로그인 후 복귀)
- 명확한 접근 제한 안내 메시지
- 자동 리디렉션 (사용자 개입 최소화)

### 7.4. 일관성
- 모든 보호된 페이지에 동일한 로직 적용
- 다중 탭 동기화
- 히스토리 스택 관리

---

## 8. UI/UX 요구사항

### 8.1. 로그인 페이지 안내 메시지
- **제목:** "로그인이 필요합니다"
- **내용:** "이 페이지는 로그인 후 이용할 수 있습니다"
- **위치:** 로그인 폼 상단

### 8.2. 세션 만료 모달 (페이지 사용 중)
- **제목:** "세션 만료"
- **내용:** "세션이 만료되었습니다. 다시 로그인해주세요"
- **버튼:** "로그인 페이지로 이동"

### 8.3. 로딩 상태
- **보호된 페이지 로드 시:**
  - 인증 확인 중: 스켈레톤 UI 또는 로딩 스피너
  - 인증 실패: 즉시 리디렉션 (깜빡임 최소화)

---

## 9. 보호된 페이지 목록

### 9.1. 전체 보호 (인증 필수)
- `/` (메인 페이지)
- `/room/:id` (채팅방 페이지)
- `/mypage` (마이페이지)

### 9.2. 공개 페이지 (인증 불필요)
- `/login` (로그인 페이지)
- `/register` (회원가입 페이지)

### 9.3. 조건부 접근
- `/login`, `/register`: 이미 로그인된 경우 메인 페이지로 리디렉션

---

## 10. 구현 방법

### 10.1. Next.js 미들웨어 (권장)
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isProtectedRoute = ['/','/ room', '/mypage'].some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    const redirectUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, request.url));
  }

  if (token && ['/login', '/register'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/room/:path*', '/mypage', '/login', '/register'],
};
```

### 10.2. 클라이언트 라우트 가드 (폴백)
```typescript
// components/AuthGuard.tsx
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirect}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
```

---

## 11. API 인증 실패 처리

### Axios Interceptor
```typescript
// api-client.ts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 전역 로그아웃 처리
      authStore.logout();
      queryClient.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 12. 테스트 시나리오

### 12.1. 정상 케이스
- [ ] 비로그인 상태에서 메인 페이지 접근 시 로그인 페이지 리디렉션
- [ ] 비로그인 상태에서 채팅방 URL 접근 시 로그인 페이지 리디렉션
- [ ] 비로그인 상태에서 마이페이지 접근 시 로그인 페이지 리디렉션
- [ ] 로그인 후 원래 URL로 자동 복귀

### 12.2. 토큰 상태
- [ ] 토큰 없음: 로그인 페이지 리디렉션
- [ ] 토큰 만료: 세션 만료 메시지 후 로그인 페이지
- [ ] 토큰 무효: 로그인 페이지 리디렉션 및 로컬 데이터 초기화
- [ ] 토큰 유효: 페이지 정상 접근

### 12.3. 이미 로그인된 경우
- [ ] 로그인 페이지 접근 시 메인 페이지 리디렉션
- [ ] 회원가입 페이지 접근 시 메인 페이지 리디렉션

### 12.4. 엣지 케이스
- [ ] 페이지 사용 중 토큰 만료 시 모달 표시 및 리디렉션
- [ ] 다중 탭에서 일관된 인증 상태
- [ ] 새로고침 시 인증 재확인
- [ ] 뒤로가기/앞으로가기 시 인증 확인
- [ ] API 요청 중 401 응답 시 로그아웃

---

## 13. 관련 문서

- [유저플로우 문서 - 12. 비로그인 접근 제한](../userflow.md#12-비로그인-접근-제한-유저플로우)
- [PRD - 접근 제한 기능](../prd.md)
- [Usecase 002 - 로그인](./002_login.md)
- [Usecase 011 - 로그아웃](./011_logout.md)
