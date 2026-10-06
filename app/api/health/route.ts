import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ai-career-agent",
    version: "0.1.0",
  });
}
