import { NextResponse } from "next/server";
import { scoreSavedJobs } from "@/lib/agent/score-saved-jobs";
import { isDashboardRequestAuthorized } from "@/lib/auth/dashboard";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isDashboardRequestAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await scoreSavedJobs();
    if (!result.profileId) {
      return NextResponse.json(
        {
          success: false,
          error: "Create a candidate profile before scoring jobs.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      summary: { scored: result.scored, rejected: result.rejected },
    });
  } catch (error) {
    console.error("Job scoring failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to score saved jobs." },
      { status: 500 },
    );
  }
}
