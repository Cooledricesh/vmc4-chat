'use client';

import Link from 'next/link';

export function RegisterFooter() {
  return (
    <div className="text-center text-sm">
      <span className="text-gray-600">이미 계정이 있으신가요? </span>
      <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
        로그인
      </Link>
    </div>
  );
}
