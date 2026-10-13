import { NextResponse } from "next/server";
import { jobSearchRequestSchema } from "@/lib/validation/search";
import { fetchLinkedInJobs } from "@/lib/job-sources/linkedin-apify";
import { upsertJobs } from "@/lib/jobs/upsert-jobs";
import { isDashboardRequestAuthorized } from "@/lib/auth/dashboard";

export const maxDuration = 300; // Apify runs can take a while

export async function POST(request: Request) {
  if (!isDashboardRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = jobSearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { searches, maxItemsPerSearch, save } = parsed.data;

  try {
    const results = await fetchLinkedInJobs(searches, maxItemsPerSearch);
    const allJobs = results.flatMap((r) => r.jobs);
    const saved = save ? await upsertJobs(allJobs) : null;

    return NextResponse.json({
      success: true,
      summary: { searches: searches.length, found: allJobs.length, saved },
      results: results.map((r) => ({
        keywords: r.search.keywords,
        location: r.search.location,
        count: r.jobs.length,
        jobs: r.jobs,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("Job search failed:", error);
    return NextResponse.json({ success: false, error: "Job search failed" }, { status: 500 });
  }
}