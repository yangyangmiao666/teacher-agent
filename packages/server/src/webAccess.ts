import { timingSafeEqual } from "node:crypto";

export function parseAccessExpiry(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const text = value.trim();
  const timestamp = Date.parse(text);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(text) ||
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString() !== (text.includes(".") ? text : text.replace(/Z$/, ".000Z"))
  ) {
    throw new Error("JZX_SERVER_AUTH_EXPIRES_AT must be an ISO UTC timestamp");
  }
  return timestamp;
}

interface AccessCredential {
  query?: string | null;
  cookie?: string;
  authorization?: string;
}

function cookieToken(cookie: string | undefined): string | undefined {
  const value = cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("zcode_lite_token="))
    ?.slice("zcode_lite_token=".length);
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

export function createWebAccessPolicy(token?: string, expiresAt?: number, now = Date.now) {
  if (expiresAt !== undefined && (!token || !Number.isFinite(expiresAt))) {
    throw new Error("Access expiry requires a token and a finite timestamp");
  }
  const matches = (value: string | undefined | null): boolean => {
    if (!token || !value) return false;
    const expected = Buffer.from(token);
    const received = Buffer.from(value);
    return expected.length === received.length && timingSafeEqual(expected, received);
  };
  const expired = () => expiresAt !== undefined && now() >= expiresAt;
  return {
    expired,
    authorize(credential: AccessCredential): boolean {
      if (expired()) return false;
      if (!token) return true;
      return (
        matches(credential.query) ||
        matches(cookieToken(credential.cookie)) ||
        matches(
          credential.authorization?.startsWith("Bearer ")
            ? credential.authorization.slice(7)
            : undefined,
        )
      );
    },
    onExpired(callback: () => void): () => void {
      if (expiresAt === undefined) return () => {};
      let timer: ReturnType<typeof setTimeout>;
      let disposed = false;
      const schedule = () => {
        if (disposed) return;
        if (expired()) {
          callback();
          return;
        }
        // 原脚本只写日期不执行失效；分段定时避免 30 天超过 Node 的 32 位上限而立即到期。
        timer = setTimeout(schedule, Math.min(expiresAt - now(), 2_147_483_647));
      };
      schedule();
      return () => {
        disposed = true;
        clearTimeout(timer);
      };
    },
  };
}
