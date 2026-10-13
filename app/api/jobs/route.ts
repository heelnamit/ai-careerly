import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isDashboardRequestAuthorized } from "@/lib/auth/dashboard";

export async function GET(request: Request) {
  if (!isDashboardRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [jobs, total, shortlisted, applications] = await Promise.all([
      prisma.job.findMany({
        orderBy: { fetchedAt: "desc" },
        take: 100,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          url: true,
          source: true,
          salaryText: true,
          postedAt: true,
          fetchedAt: true,
        },
      }),
      prisma.job.count(),
      prisma.jobMatch.count({ where: { status: "SHORTLISTED" } }),
      prisma.jobMatch.count({ where: { status: "APPLIED" } }),
    ]);
    return NextResponse.json({
      success: true,
      jobs,
      summary: { total, shortlisted, applications },
    });
  } catch (error) {
    console.error("Job list fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 },
    );
  }
}
