import { z } from "zod";

export const jobSchema = z.object({
  externalId: z.string().optional(),
  source: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional().nullable(),
  description: z.string().min(1),
  salaryText: z.string().optional().nullable(),
  minSalaryLpa: z.number().nonnegative().optional().nullable(),
  maxSalaryLpa: z.number().nonnegative().optional().nullable(),
  experienceText: z.string().optional().nullable(),
  postedAt: z.string().datetime().optional().nullable(),
});

export const jobImportSchema = z.array(jobSchema).min(1).max(100);

export type JobInput = z.infer<typeof jobSchema>;