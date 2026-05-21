import { isAxiosError } from 'axios';

type ApiErrorMessage = {
  message?: string | { message?: string };
};

export function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorMessage>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (typeof message?.message === 'string') return message.message;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}
