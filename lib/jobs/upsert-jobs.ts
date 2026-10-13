import { prisma } from "@/lib/db/prisma";
import type { JobInput } from "@/lib/validation/job";

export async function upsertJobs(jobs: JobInput[]) {
  if (!jobs.length) return 0;

  await prisma.$transaction(
    jobs.map(({ postedAt, ...job }) =>
      prisma.job.upsert({
        where: { url: job.url },
        create: {
          ...job,
          postedAt: postedAt ? new Date(postedAt) : null,
        },
        update: {
          ...job,
          postedAt: postedAt ? new Date(postedAt) : null,
          fetchedAt: new Date(),
        },
      }),
    ),
  );
  return jobs.length;
}
