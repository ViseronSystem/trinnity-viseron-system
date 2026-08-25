import crypto from "crypto";

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: "owner" | "admin" | "member";
  email: string;
  iat: number;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function b64urlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export function signToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresInSeconds = 7 * 24 * 60 * 60
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");
  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyToken(token: string, secret: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");
  const sigBuffer = Buffer.from(signatureB64);
  const expBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return null;
  }
  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as JwtPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
