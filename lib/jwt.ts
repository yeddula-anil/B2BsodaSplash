import { createHmac, timingSafeEqual } from "crypto";

export type JwtPayload = Record<string, unknown>;

const base64UrlToBase64 = (value: string) => {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding === 2) base64 += "==";
  else if (padding === 3) base64 += "=";
  else if (padding === 1) throw new Error("Invalid base64url string");
  return base64;
};

export function decodeJwtPayload(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payloadJson = Buffer.from(base64UrlToBase64(parts[1]), "base64").toString("utf8");
  return JSON.parse(payloadJson) as JwtPayload;
}

export function verifyJwtSignature(token: string, secret: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [header, payload, signature] = parts;
  const expectedSignature = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest();

  const signatureBuffer = Buffer.from(base64UrlToBase64(signature), "base64");

  if (signatureBuffer.length !== expectedSignature.length || !timingSafeEqual(signatureBuffer, expectedSignature)) {
    throw new Error("Invalid JWT signature");
  }

  return decodeJwtPayload(token);
}

export function getJwtPayload(token: string): JwtPayload {
  const secret = process.env.AUTH_SERVICE_JWT_SECRET;
  const payload = secret ? verifyJwtSignature(token, secret) : decodeJwtPayload(token);

  if (payload.exp && typeof payload.exp === "number") {
    const expiresAt = payload.exp * 1000;
    if (Date.now() >= expiresAt) {
      throw new Error("JWT expired");
    }
  }

  return payload;
}

export function getJwtUserId(token: string): string | null {
  const payload = getJwtPayload(token);
  if (typeof payload.sub === "string" && payload.sub.trim()) {
    return payload.sub;
  }

  const userId = payload.userId ?? payload.id;
  if (typeof userId === "string" && userId.trim()) {
    return userId;
  }

  return null;
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const header = authorization.trim();
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export function getUserIdFromRequest(request: Request): string | null {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  return getJwtUserId(token);
}

export function buildForwardHeaders(request: Request, includeJsonContent = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJsonContent) {
    headers["Content-Type"] = "application/json";
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.Authorization = authorization;
  }

  const incomingUserId = request.headers.get("x-user-id");
  const forwardedUserId = incomingUserId || getUserIdFromRequest(request);
  if (forwardedUserId) {
    headers["X-User-Id"] = forwardedUserId;
  }

  return headers;
}
