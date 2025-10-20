"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Wifi, WifiOff } from 'lucide-react';
import { useChatRoom } from '../context/chatroom-context';

export function ChatHeader() {
  const { state } = useChatRoom();

  const getConnectionStatusColor = () => {
    switch (state.connection.status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (state.connection.status) {
      case 'connected':
        return '연결됨';
      case 'connecting':
        return '연결 중...';
      case 'disconnected':
        return '연결 끊김';
      case 'error':
        return '오류';
      default:
        return '대기 중';
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded p-1 transition-colors hover:bg-gray-100"
          title="메인으로 돌아가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {state.room?.name || '채팅방'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{state.room?.participantCount || 0}명 참여</span>
            </div>
            <div className={`flex items-center gap-1 ${getConnectionStatusColor()}`}>
              {state.connection.status === 'connected' ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <span className="text-xs">{getConnectionStatusText()}</span>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/mypage"
        className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        마이페이지
      </Link>
    </div>
  );
}
