import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    jobs: [],
    message: "Job ingestion is not connected yet.",
  });
}
