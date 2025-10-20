// Backend schema를 재노출하여 프론트엔드에서 사용
export {
  createRoomSchema,
  roomSchema,
  roomsResponseSchema,
  createRoomResponseSchema,
} from '../backend/schema';

export type {
  CreateRoomInput,
  Room,
  RoomsResponse,
  CreateRoomResponse,
} from '../backend/schema';
