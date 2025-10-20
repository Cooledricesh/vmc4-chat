import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { CreateRoomInput } from './schema';
import { ROOM_ERRORS } from './error';

export async function getRoomsService(c: Context<AppEnv>) {
  const supabase = c.get('supabase');

  const { data: rooms, error } = await supabase
    .from('rooms')
    .select(`
      id,
      name,
      created_at,
      creator:users!rooms_creator_id_fkey(nickname),
      participants:room_participants(count)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return {
      success: false,
      error: ROOM_ERRORS.ROOMS_FETCH_FAILED,
    };
  }

  // 참여자 수 계산
  const roomsWithCount = (rooms || []).map((room: any) => ({
    id: room.id,
    name: room.name,
    createdAt: room.created_at,
    creatorNickname: room.creator?.nickname || '알 수 없음',
    participantCount: Array.isArray(room.participants) ? room.participants.length : 0,
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
      error: ROOM_ERRORS.ROOM_CREATE_FAILED,
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
      error: ROOM_ERRORS.PARTICIPANT_ADD_FAILED,
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
