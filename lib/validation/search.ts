import { z } from "zod";

export const jobSearchSchema = z.object({
  keywords: z.string().min(2),
  location: z.string().min(2).default("India"),
  // "past24Hours" is confirmed from your run. Open the Date posted dropdown in
  // the Apify form and make sure the other two values match what it lists.
  datePosted: z.enum(["past24Hours", "pastWeek", "pastMonth"]).default("past24Hours"),
});

export const jobSearchRequestSchema = z.object({
  searches: z.array(jobSearchSchema).min(1).max(5),
  maxItemsPerSearch: z.number().int().min(1).max(50).default(10),
  save: z.boolean().default(true),
});

export type JobSearch = z.infer<typeof jobSearchSchema>;