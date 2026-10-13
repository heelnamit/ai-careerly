import { NextResponse } from "next/server";
import {
  createDashboardSessionToken,
  dashboardAuthIsConfigured,
  dashboardSessionCookie,
  dashboardSessionDurationSeconds,
  verifyDashboardPassword,
} from "@/lib/auth/dashboard";

const attemptWindowMs = 15 * 60 * 1000;
const maxAttempts = 8;
const failedAttempts = new Map<string, { count: number; startedAt: number }>();

function getClientKey(request: Request) {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function recordFailedAttempt(key: string, now: number) {
  if (failedAttempts.size >= 1000 && !failedAttempts.has(key)) {
    for (const [attemptKey, attempt] of failedAttempts) {
      if (now - attempt.startedAt >= attemptWindowMs) {
        failedAttempts.delete(attemptKey);
      }
    }
    if (failedAttempts.size >= 1000) {
      const oldestKey = failedAttempts.keys().next().value;
      if (oldestKey) failedAttempts.delete(oldestKey);
    }
  }

  const previous = failedAttempts.get(key);
  failedAttempts.set(
    key,
    previous && now - previous.startedAt < attemptWindowMs
      ? { count: previous.count + 1, startedAt: previous.startedAt }
      : { count: 1, startedAt: now },
  );
}

export async function POST(request: Request) {
  if (!dashboardAuthIsConfigured()) {
    console.error(
      "Dashboard login is unavailable: configure DASHBOARD_PASSWORD (at least 16 characters) and DASHBOARD_SESSION_SECRET (at least 32 characters).",
    );
    return NextResponse.json(
      { success: false, error: "Dashboard login is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid login request." },
      { status: 400 },
    );
  }

  const password =
    body && typeof body === "object" && "password" in body
      ? body.password
      : undefined;
  if (typeof password !== "string" || password.length > 1024) {
    return NextResponse.json(
      { success: false, error: "Enter a valid password." },
      { status: 400 },
    );
  }

  const key = getClientKey(request);
  const now = Date.now();
  const previous = failedAttempts.get(key);
  if (
    previous &&
    now - previous.startedAt < attemptWindowMs &&
    previous.count >= maxAttempts
  ) {
    return NextResponse.json(
      { success: false, error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  if (!verifyDashboardPassword(password)) {
    recordFailedAttempt(key, now);
    return NextResponse.json(
      { success: false, error: "The password is incorrect." },
      { status: 401 },
    );
  }

  failedAttempts.delete(key);
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: dashboardSessionCookie,
    value: createDashboardSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: dashboardSessionDurationSeconds,
  });
  return response;
}
