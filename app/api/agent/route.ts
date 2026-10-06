import { NextResponse } from "next/server";
import { runCareerAgent } from "@/lib/agent/career-agent";

export async function POST() {
  const result = await runCareerAgent();
  return NextResponse.json(result);
}
