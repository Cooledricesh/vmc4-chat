import "server-only";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { CurrentUserSnapshot } from "../types";

type JWTPayload = {
  userId: string;
  email: string;
  nickname: string;
  iat: number;
  exp: number;
};

export const loadCurrentUser = async (): Promise<CurrentUserSnapshot> => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { status: "unauthenticated", user: null };
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[loadCurrentUser] JWT_SECRET not configured');
      return { status: "unauthenticated", user: null };
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    return {
      status: "authenticated",
      user: {
        id: decoded.userId,
        email: decoded.email,
        appMetadata: {},
        userMetadata: { nickname: decoded.nickname },
      },
    };
  } catch (error) {
    console.error('[loadCurrentUser] JWT verification failed:', error);
    return { status: "unauthenticated", user: null };
  }
};
