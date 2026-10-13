import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const dashboardSessionCookie = "careerly_dashboard_session";
const sessionDurationSeconds = 60 * 60 * 12;

function secureEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function dashboardAuthIsConfigured() {
  return Boolean(
    process.env.DASHBOARD_PASSWORD &&
      process.env.DASHBOARD_PASSWORD.length >= 16 &&
      process.env.DASHBOARD_SESSION_SECRET &&
      process.env.DASHBOARD_SESSION_SECRET.length >= 32,
  );
}

export function verifyDashboardPassword(password: string) {
  const configuredPassword = process.env.DASHBOARD_PASSWORD;
  if (!dashboardAuthIsConfigured() || !configuredPassword) return false;
  return secureEqual(password, configuredPassword);
}

export function createDashboardSessionToken() {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Dashboard authentication is not configured.");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const signature = createHmac("sha256", secret)
    .update(String(expiresAt))
    .digest("hex");
  return `${expiresAt}.${signature}`;
}

function isValidDashboardSessionToken(token?: string) {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return false;

  const [expiresAtText, signature, extra] = token.split(".");
  const expiresAt = Number(expiresAtText);
  if (
    extra !== undefined ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000) ||
    !signature
  ) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(expiresAtText)
    .digest("hex");
  return secureEqual(signature, expected);
}

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  const cookie = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie?.slice(name.length + 1);
}

export function hasDashboardSessionInRequest(request: Request) {
  return isValidDashboardSessionToken(
    readCookie(request.headers.get("cookie"), dashboardSessionCookie),
  );
}

export async function hasDashboardSession() {
  const cookieStore = await cookies();
  return isValidDashboardSessionToken(
    cookieStore.get(dashboardSessionCookie)?.value,
  );
}

export function isDashboardRequestAuthorized(request: Request) {
  if (hasDashboardSessionInRequest(request)) return true;

  const internalKey = process.env.INTERNAL_API_KEY;
  const suppliedKey = request.headers.get("x-api-key");
  return Boolean(
    internalKey &&
      suppliedKey &&
      secureEqual(suppliedKey, internalKey),
  );
}

export const dashboardSessionDurationSeconds = sessionDurationSeconds;
