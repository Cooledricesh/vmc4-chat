import axios, { isAxiosError } from "axios";

const apiClient = axios.create({
  // baseURL이 설정되지 않았을 때는 상대 경로로 요청
  // 개발 환경에서는 비워두면 현재 origin 기준으로 요청됨
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  // same-origin 요청이므로 withCredentials는 불필요 (자동으로 쿠키 포함됨)
  // cross-origin 요청 시에만 true로 설정
  withCredentials: !!process.env.NEXT_PUBLIC_API_BASE_URL,
});

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
