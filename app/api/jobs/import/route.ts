import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jobImportSchema } from "@/lib/validation/job";
import { isDashboardRequestAuthorized } from "@/lib/auth/dashboard";
import { scoreSavedJobs } from "@/lib/agent/score-saved-jobs";

export async function POST(request: Request) {
  if (!isDashboardRequestAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = jobImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid job data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;

    for (const job of parsed.data) {
      const { postedAt, ...fields } = job;

      const data = {
        ...fields,
        postedAt: postedAt ? new Date(postedAt) : null,
      };

      const existing = await prisma.job.findUnique({
        where: { url: job.url },
        select: { id: true },
      });

      if (existing) {
        await prisma.job.update({
          where: { id: existing.id },
          data: {
            ...data,
            fetchedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.job.create({ data });
        created++;
      }
    }

    const scoring = await scoreSavedJobs();

    return NextResponse.json({
      success: true,
      summary: {
        received: parsed.data.length,
        created,
        updated,
        scored: scoring.scored,
        profileConfigured: scoring.profileId !== null,
      },
    });
  } catch (error) {
    console.error("Job import failed:", error);

    return NextResponse.json(
      { success: false, error: "Failed to import jobs" },
      { status: 500 }
    );
  }
}