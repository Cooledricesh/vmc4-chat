import { z } from 'zod';

// 채팅방 생성 스키마
export const createRoomSchema = z.object({
  name: z
    .string()
    .min(1, '채팅방 이름을 입력해주세요')
    .max(100, '채팅방 이름은 최대 100자까지 가능합니다')
    .transform((val) => val.trim()),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

// 채팅방 정보 스키마
export const roomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  creatorNickname: z.string(),
  participantCount: z.number(),
  createdAt: z.string(),
});

export type Room = z.infer<typeof roomSchema>;

// 채팅방 목록 응답 스키마
export const roomsResponseSchema = z.object({
  rooms: z.array(roomSchema),
});

export type RoomsResponse = z.infer<typeof roomsResponseSchema>;

// 채팅방 생성 응답 스키마
export const createRoomResponseSchema = z.object({
  room: z.object({
    id: z.string().uuid(),
    name: z.string(),
    createdAt: z.string(),
  }),
});

export type CreateRoomResponse = z.infer<typeof createRoomResponseSchema>;
