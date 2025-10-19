'use client';

import Link from 'next/link';

export function LoginFooter() {
  return (
    <div className="text-center text-sm">
      <span className="text-gray-600">계정이 없으신가요? </span>
      <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
        회원가입
      </Link>
    </div>
  );
}
