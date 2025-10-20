import { z } from 'zod';

// 메시지 타입
export const messageTypeSchema = z.enum(['text', 'emoji', 'system']);
export type MessageType = z.infer<typeof messageTypeSchema>;

// 리액션 타입
export const reactionTypeSchema = z.enum(['like']);
export type ReactionType = z.infer<typeof reactionTypeSchema>;

// 메시지 전송 스키마
export const sendMessageSchema = z.object({
  content: z.string().min(1, '메시지 내용을 입력해주세요').max(5000, '메시지는 최대 5000자까지 가능합니다'),
  type: messageTypeSchema.default('text'),
  parentMessageId: z.string().uuid().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// 리액션 토글 스키마
export const toggleReactionSchema = z.object({
  type: reactionTypeSchema.default('like'),
});

export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;

// User 스키마
export const userSchema = z.object({
  id: z.string().uuid(),
  nickname: z.string(),
  email: z.string().email(),
});

export type User = z.infer<typeof userSchema>;

// Reaction 스키마
export const reactionSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  type: reactionTypeSchema,
  createdAt: z.string(),
});

export type Reaction = z.infer<typeof reactionSchema>;

// Message 스키마
export const messageSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  user: userSchema.optional(),
  content: z.string(),
  type: messageTypeSchema,
  parentMessageId: z.string().uuid().nullable(),
  parentMessage: z.lazy(() => messageSchema.partial()).optional(),
  isDeleted: z.boolean(),
  reactions: z.array(reactionSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Message = z.infer<typeof messageSchema>;

// Participant 스키마
export const participantSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  user: userSchema,
  joinedAt: z.string(),
});

export type Participant = z.infer<typeof participantSchema>;

// Room 정보 스키마
export const roomInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  participantCount: z.number(),
});

export type RoomInfo = z.infer<typeof roomInfoSchema>;

// 메시지 목록 조회 응답
export const messagesResponseSchema = z.object({
  messages: z.array(messageSchema),
  hasMore: z.boolean(),
  total: z.number(),
});

export type MessagesResponse = z.infer<typeof messagesResponseSchema>;

// 메시지 전송 응답
export const sendMessageResponseSchema = z.object({
  message: messageSchema,
});

export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;

// 리액션 토글 응답
export const toggleReactionResponseSchema = z.object({
  success: z.boolean(),
  isLiked: z.boolean(),
  totalLikes: z.number(),
});

export type ToggleReactionResponse = z.infer<typeof toggleReactionResponseSchema>;

// 참여자 목록 응답
export const participantsResponseSchema = z.object({
  participants: z.array(participantSchema),
});

export type ParticipantsResponse = z.infer<typeof participantsResponseSchema>;

// Room 정보 응답
export const roomInfoResponseSchema = z.object({
  room: roomInfoSchema,
});

export type RoomInfoResponse = z.infer<typeof roomInfoResponseSchema>;
