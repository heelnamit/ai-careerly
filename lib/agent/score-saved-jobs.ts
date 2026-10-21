import { prisma } from "@/lib/db/prisma";
import { scoreJob, type JobMatchResult } from "@/lib/agent/job-matching";

export async function scoreSavedJobs() {
  const profile = await prisma.candidateProfile.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!profile) {
    return { profileId: null, scored: 0, rejected: 0 };
  }

  const jobs = await prisma.job.findMany({
    orderBy: { fetchedAt: "desc" },
  });
  const existingMatches = await prisma.jobMatch.findMany({
    where: { candidateProfileId: profile.id },
    select: { jobId: true, status: true },
  });
  const existingStatusByJobId = new Map(
    existingMatches.map((match) => [match.jobId, match.status]),
  );

  const scoredJobs = await Promise.all(
    jobs.map(async (job) => ({
      job,
      result: await scoreJob(job, profile),
    })),
  );

  if (scoredJobs.length) {
    await prisma.$transaction(
      scoredJobs.map(({ job, result }) => {
        const existingStatus = existingStatusByJobId.get(job.id);
        const status =
          existingStatus === "SHORTLISTED" || existingStatus === "APPLIED"
            ? existingStatus
            : existingStatus === "SKIPPED" || result.rejected
              ? "SKIPPED"
              : "NEW";
        const fields = toMatchFields(result);

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
            ...fields,
            status,
          },
          update: {
            ...fields,
            status,
          },
        });
      }),
    );
  }

  return {
    profileId: profile.id,
    scored: scoredJobs.length,
    rejected: scoredJobs.filter((item) => item.result.rejected).length,
  };
}

function toMatchFields(result: JobMatchResult) {
  return {
    matchScore: result.matchScore,
    skillScore: result.skillScore,
    experienceScore: result.experienceScore,
    salaryScore: result.salaryScore,
    locationScore: result.locationScore,
    titleScore: result.titleScore,
    recommendation: result.recommendation,
    aiReasoning: result.reasoning,
  };
}
