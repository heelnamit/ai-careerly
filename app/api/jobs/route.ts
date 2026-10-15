import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isDashboardRequestAuthorized } from "@/lib/auth/dashboard";

export async function GET(request: Request) {
  if (!isDashboardRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.candidateProfile.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    const [jobs, total, matchCounts] = await Promise.all([
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
          matches: {
            where: { candidateProfileId: profile?.id ?? "" },
            take: 1,
            select: {
              matchScore: true,
              skillScore: true,
              experienceScore: true,
              salaryScore: true,
              locationScore: true,
              titleScore: true,
              recommendation: true,
              aiReasoning: true,
              status: true,
            },
          },
        },
      }),
      prisma.job.count(),
      profile
        ? prisma.jobMatch.groupBy({
            by: ["status"],
            where: { candidateProfileId: profile.id },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);
    return NextResponse.json({
      success: true,
      jobs,
      summary: {
        total,
        scored: jobs.filter((job) => job.matches.length > 0).length,
        shortlisted:
          matchCounts.find((match) => match.status === "SHORTLISTED")?._count
            ._all ?? 0,
        applications:
          matchCounts.find((match) => match.status === "APPLIED")?._count
            ._all ?? 0,
      },
    });
  } catch (error) {
    console.error("Job list fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 },
    );
  }
}
