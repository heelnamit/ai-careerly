import { z } from "zod";

export const candidateProfileSchema = z.object({
  name: z.string().min(2),
  headline: z.string().min(5),

  yearsExperience: z.number().min(0).max(50),

  currentRole: z.string().min(2),
  currentCompany: z.string().min(2),

  minimumSalaryLpa: z.number().min(0),
  targetSalaryLpa: z.number().min(0),

  preferredLocations: z
    .array(z.string().min(1))
    .min(1),

  targetRoles: z
    .array(z.string().min(1))
    .min(1),

  primarySkills: z
    .array(z.string().min(1))
    .min(1),

  secondarySkills: z
    .array(z.string().min(1)),

  companyPreferences: z
    .array(z.string().min(1)),

  excludedKeywords: z
    .array(z.string().min(1)),
});

export type CandidateProfileInput = z.infer<
  typeof candidateProfileSchema
>;