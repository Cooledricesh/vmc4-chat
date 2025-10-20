'use client';

import { MainHeader } from '@/features/rooms/components/MainHeader';
import { RoomList } from '@/features/rooms/components/RoomList';
import { CreateRoomButton } from '@/features/rooms/components/CreateRoomButton';
import { useRooms } from '@/features/rooms/hooks/use-rooms';

export function MainPageClient() {
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
