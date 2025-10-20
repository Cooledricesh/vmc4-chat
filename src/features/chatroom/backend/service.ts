import type { Context } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import type { SendMessageInput, ToggleReactionInput } from './schema';
import { CHATROOM_ERRORS } from './error';

// 채팅방 정보 조회
export async function getRoomInfoService(c: Context<AppEnv>, roomId: string) {
  const supabase = c.get('supabase');

  const { data: room, error } = await supabase
    .from('rooms')
    .select(`
      id,
      name,
      is_active,
      created_at,
      participants:room_participants(count)
    `)
    .eq('id', roomId)
    .single();

  if (error || !room) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_NOT_FOUND,
    };
  }

  if (!room.is_active) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_INACTIVE,
    };
  }

  const participantCount = Array.isArray(room.participants) ? room.participants.length : 0;

  return {
    success: true,
    data: {
      room: {
        id: room.id,
        name: room.name,
        isActive: room.is_active,
        createdAt: room.created_at,
        participantCount,
      },
    },
  };
}

// 메시지 목록 조회
export async function getMessagesService(
  c: Context<AppEnv>,
  roomId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const supabase = c.get('supabase');
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  // 먼저 채팅방 존재 여부 확인
  const { data: room } = await supabase
    .from('rooms')
    .select('id, is_active')
    .eq('id', roomId)
    .single();

  if (!room) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_NOT_FOUND,
    };
  }

  if (!room.is_active) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_INACTIVE,
    };
  }

  // 전체 메시지 수 조회
  const { count: total } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  // 메시지 조회
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      room_id,
      user_id,
      content,
      type,
      parent_message_id,
      is_deleted,
      created_at,
      updated_at,
      user:users!messages_user_id_fkey(id, nickname, email),
      parent_message:messages!messages_parent_message_id_fkey(
        id,
        content,
        user_id,
        is_deleted,
        user:users!messages_user_id_fkey(nickname)
      ),
      reactions:message_reactions(
        id,
        message_id,
        user_id,
        reaction_type,
        created_at
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return {
      success: false,
      error: CHATROOM_ERRORS.MESSAGES_FETCH_FAILED,
    };
  }

  const formattedMessages = (messages || []).map((msg: any) => ({
    id: msg.id,
    roomId: msg.room_id,
    userId: msg.user_id,
    user: msg.user ? {
      id: msg.user.id,
      nickname: msg.user.nickname,
      email: msg.user.email,
    } : undefined,
    content: msg.content,
    type: msg.type,
    parentMessageId: msg.parent_message_id,
    parentMessage: msg.parent_message ? {
      id: msg.parent_message.id,
      content: msg.parent_message.content,
      userId: msg.parent_message.user_id,
      isDeleted: msg.parent_message.is_deleted,
      user: msg.parent_message.user ? {
        nickname: msg.parent_message.user.nickname,
      } : undefined,
    } : undefined,
    isDeleted: msg.is_deleted,
    reactions: (msg.reactions || []).map((r: any) => ({
      id: r.id,
      messageId: r.message_id,
      userId: r.user_id,
      type: r.reaction_type,
      createdAt: r.created_at,
    })),
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
  }));

  return {
    success: true,
    data: {
      messages: formattedMessages,
      hasMore: (total || 0) > offset + limit,
      total: total || 0,
    },
  };
}

// 메시지 전송
export async function sendMessageService(
  c: Context<AppEnv>,
  roomId: string,
  userId: string,
  input: SendMessageInput
) {
  const supabase = c.get('supabase');

  // 채팅방 존재 여부 확인
  const { data: room } = await supabase
    .from('rooms')
    .select('id, is_active')
    .eq('id', roomId)
    .single();

  if (!room) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_NOT_FOUND,
    };
  }

  if (!room.is_active) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_INACTIVE,
    };
  }

  // 참여자 확인 및 자동 추가
  const { data: participant } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single();

  if (!participant) {
    // 참여자로 자동 추가
    await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
      });
  }

  // 메시지 저장
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      content: input.content,
      type: input.type,
      parent_message_id: input.parentMessageId || null,
    })
    .select(`
      id,
      room_id,
      user_id,
      content,
      type,
      parent_message_id,
      is_deleted,
      created_at,
      updated_at,
      user:users!messages_user_id_fkey(id, nickname, email),
      parent_message:messages!messages_parent_message_id_fkey(
        id,
        content,
        user_id,
        is_deleted,
        user:users!messages_user_id_fkey(nickname)
      )
    `)
    .single();

  if (error || !message) {
    return {
      success: false,
      error: CHATROOM_ERRORS.MESSAGE_SEND_FAILED,
    };
  }

  const user = Array.isArray(message.user) ? message.user[0] : message.user;
  const parentMessage = Array.isArray(message.parent_message) ? message.parent_message[0] : message.parent_message;

  return {
    success: true,
    data: {
      message: {
        id: message.id,
        roomId: message.room_id,
        userId: message.user_id,
        user: user ? {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
        } : undefined,
        content: message.content,
        type: message.type,
        parentMessageId: message.parent_message_id,
        parentMessage: parentMessage ? {
          id: parentMessage.id,
          content: parentMessage.content,
          userId: parentMessage.user_id,
          isDeleted: parentMessage.is_deleted,
          user: (() => {
            const pUser = parentMessage.user;
            if (Array.isArray(pUser) && pUser.length > 0) {
              return { nickname: pUser[0].nickname };
            } else if (pUser && !Array.isArray(pUser) && 'nickname' in pUser) {
              return { nickname: (pUser as any).nickname };
            }
            return undefined;
          })(),
        } : undefined,
        isDeleted: message.is_deleted,
        reactions: [],
        createdAt: message.created_at,
        updatedAt: message.updated_at,
      },
    },
  };
}

// 메시지 삭제
export async function deleteMessageService(
  c: Context<AppEnv>,
  roomId: string,
  messageId: string,
  userId: string
) {
  const supabase = c.get('supabase');

  // 메시지 조회 및 권한 확인
  const { data: message } = await supabase
    .from('messages')
    .select('id, user_id, room_id')
    .eq('id', messageId)
    .eq('room_id', roomId)
    .single();

  if (!message) {
    return {
      success: false,
      error: CHATROOM_ERRORS.MESSAGE_NOT_FOUND,
    };
  }

  if (message.user_id !== userId) {
    return {
      success: false,
      error: CHATROOM_ERRORS.UNAUTHORIZED_DELETE,
    };
  }

  // Soft delete
  const { error } = await supabase
    .from('messages')
    .update({ is_deleted: true })
    .eq('id', messageId);

  if (error) {
    return {
      success: false,
      error: CHATROOM_ERRORS.MESSAGE_DELETE_FAILED,
    };
  }

  return {
    success: true,
    data: {
      messageId,
    },
  };
}

// 리액션 토글
export async function toggleReactionService(
  c: Context<AppEnv>,
  roomId: string,
  messageId: string,
  userId: string,
  input: ToggleReactionInput
) {
  const supabase = c.get('supabase');

  // 메시지 조회
  const { data: message } = await supabase
    .from('messages')
    .select('id, user_id, room_id')
    .eq('id', messageId)
    .eq('room_id', roomId)
    .single();

  if (!message) {
    return {
      success: false,
      error: CHATROOM_ERRORS.MESSAGE_NOT_FOUND,
    };
  }

  // 본인 메시지에는 리액션 불가
  if (message.user_id === userId) {
    return {
      success: false,
      error: CHATROOM_ERRORS.SELF_REACTION_NOT_ALLOWED,
    };
  }

  // 기존 리액션 확인
  const { data: existingReaction } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('reaction_type', input.type)
    .single();

  let isLiked = false;

  if (existingReaction) {
    // 리액션 삭제
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existingReaction.id);

    if (error) {
      return {
        success: false,
        error: CHATROOM_ERRORS.REACTION_TOGGLE_FAILED,
      };
    }
    isLiked = false;
  } else {
    // 리액션 추가
    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        reaction_type: input.type,
      });

    if (error) {
      return {
        success: false,
        error: CHATROOM_ERRORS.REACTION_TOGGLE_FAILED,
      };
    }
    isLiked = true;
  }

  // 총 좋아요 수 조회
  const { count } = await supabase
    .from('message_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('message_id', messageId)
    .eq('reaction_type', input.type);

  return {
    success: true,
    data: {
      success: true,
      isLiked,
      totalLikes: count || 0,
    },
  };
}

// 참여자 목록 조회
export async function getParticipantsService(c: Context<AppEnv>, roomId: string) {
  const supabase = c.get('supabase');

  // 채팅방 존재 여부 확인
  const { data: room } = await supabase
    .from('rooms')
    .select('id')
    .eq('id', roomId)
    .single();

  if (!room) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_NOT_FOUND,
    };
  }

  const { data: participants, error } = await supabase
    .from('room_participants')
    .select(`
      id,
      user_id,
      joined_at,
      user:users!room_participants_user_id_fkey(id, nickname, email)
    `)
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    return {
      success: false,
      error: CHATROOM_ERRORS.PARTICIPANTS_FETCH_FAILED,
    };
  }

  const formattedParticipants = (participants || []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    user: {
      id: p.user.id,
      nickname: p.user.nickname,
      email: p.user.email,
    },
    joinedAt: p.joined_at,
  }));

  return {
    success: true,
    data: {
      participants: formattedParticipants,
    },
  };
}

// 채팅방 입장 (참여자 추가)
export async function joinRoomService(c: Context<AppEnv>, roomId: string, userId: string) {
  const supabase = c.get('supabase');

  // 채팅방 존재 여부 확인
  const { data: room } = await supabase
    .from('rooms')
    .select('id, is_active')
    .eq('id', roomId)
    .single();

  if (!room) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_NOT_FOUND,
    };
  }

  if (!room.is_active) {
    return {
      success: false,
      error: CHATROOM_ERRORS.ROOM_INACTIVE,
    };
  }

  // 이미 참여 중인지 확인
  const { data: existing } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // 이미 참여 중이면 성공 반환
    return {
      success: true,
      data: {
        alreadyJoined: true,
      },
    };
  }

  // 참여자 추가
  const { error } = await supabase
    .from('room_participants')
    .insert({
      room_id: roomId,
      user_id: userId,
    });

  if (error) {
    return {
      success: false,
      error: CHATROOM_ERRORS.JOIN_FAILED,
    };
  }

  return {
    success: true,
    data: {
      alreadyJoined: false,
    },
  };
}
