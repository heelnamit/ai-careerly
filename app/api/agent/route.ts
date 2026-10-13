import { NextResponse } from "next/server";
import { runCareerAgent } from "@/lib/agent/career-agent";
import { isDashboardRequestAuthorized } from "@/lib/auth/dashboard";

export async function POST(request: Request) {
  if (!isDashboardRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCareerAgent();
  return NextResponse.json(result);
}
