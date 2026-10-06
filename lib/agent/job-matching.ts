export type JobMatchInput = {
  title: string;
  description?: string;
  company: string;
  location?: string;
  salaryText?: string;
};

export type JobMatchResult = {
  matchScore: number;
  skillScore: number;
  experienceScore: number;
  salaryScore: number;
  locationScore: number;
  titleScore: number;
  recommendation: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
};

export function scoreJob(_job: JobMatchInput): JobMatchResult {
  // Deterministic + LLM scoring will be implemented in V1.
  return {
    matchScore: 0,
    skillScore: 0,
    experienceScore: 0,
    salaryScore: 0,
    locationScore: 0,
    titleScore: 0,
    recommendation: "LOW",
    reasoning: "Scoring engine not configured yet.",
  };
}
