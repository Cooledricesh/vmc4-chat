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

function RoomListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-3/4 mb-2 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
