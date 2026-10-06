import { z } from "zod";

export const jobSchema = z.object({
  source: z.string().min(1),
  url: z.url(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  description: z.string().optional(),
  salaryText: z.string().optional(),
  experienceText: z.string().optional(),
});

export type JobInput = z.infer<typeof jobSchema>;
