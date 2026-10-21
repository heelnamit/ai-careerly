import { NextResponse } from "next/server";
import { z } from "zod";
import { scoreJob } from "@/lib/agent/job-matching";
import { isDashboardRequestAuthorized } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/db/prisma";

const updateStatusSchema = z.object({
  status: z.enum(["NEW", "SHORTLISTED", "SKIPPED", "APPLIED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (!isDashboardRequestAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid job status.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { jobId } = await params;

  try {
    const profile = await prisma.candidateProfile.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Create a candidate profile before tracking job activity.",
        },
        { status: 409 },
      );
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }

    const existingMatch = await prisma.jobMatch.findUnique({
      where: {
        jobId_candidateProfileId: {
          jobId,
          candidateProfileId: profile.id,
        },
      },
      select: { id: true },
    });

    const match = existingMatch
      ? await prisma.jobMatch.update({
          where: { id: existingMatch.id },
          data: { status: parsed.data.status },
          select: { status: true },
        })
      : await createScoredMatch(job, profile, parsed.data.status);

    return NextResponse.json({
      success: true,
      data: { jobId, status: match.status },
    });
  } catch (error) {
    console.error("Job status update failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not update this job's status." },
      { status: 500 },
    );
  }
}

async function createScoredMatch(
  job: Awaited<ReturnType<typeof prisma.job.findUniqueOrThrow>>,
  profile: NonNullable<
    Awaited<ReturnType<typeof prisma.candidateProfile.findFirst>>
  >,
  status: z.infer<typeof updateStatusSchema>["status"],
) {
  const result = await scoreJob(job, profile);
  return prisma.jobMatch.upsert({
    where: {
      jobId_candidateProfileId: {
        jobId: job.id,
        candidateProfileId: profile.id,
      },
    },
    create: {
      jobId: job.id,
      candidateProfileId: profile.id,
      matchScore: result.matchScore,
      skillScore: result.skillScore,
      experienceScore: result.experienceScore,
      salaryScore: result.salaryScore,
      locationScore: result.locationScore,
      titleScore: result.titleScore,
      recommendation: result.recommendation,
      aiReasoning: result.reasoning,
      status,
    },
    update: { status },
    select: { status: true },
  });
}
