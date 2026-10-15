import type { CandidateProfile, Job } from "@prisma/client";

export type JobMatchResult = {
  matchScore: number;
  skillScore: number;
  experienceScore: number;
  salaryScore: number;
  locationScore: number;
  titleScore: number;
  recommendation: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
  rejected: boolean;
};

// ---- tune these ----
const WEIGHTS = { skill: 0.4, experience: 0.2, title: 0.2, location: 0.1, salary: 0.1 };
const HIGH_AT = 70;
const MEDIUM_AT = 45;
const NCR = ["gurugram", "delhi", "new delhi", "noida", "ghaziabad", "faridabad"];
// techs that signal a different primary stack (ignored if YOU list them as skills)
const OTHER_STACKS = [
  ".net", "c#", "asp.net", "java", "spring", "ruby", "rails", "php", "laravel",
  "angular", "vue", "django", "flask", "golang", "kotlin", "android", "ios",
  "salesforce", "sap", "python",
];

const num = (v: unknown) => (v == null ? null : Number(v));
const norm = (s: string) => s.toLowerCase().replace("gurgaon", "gurugram");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function variants(skill: string) {
  const s = skill.toLowerCase().trim();
  return [...new Set([s, s.replace(/[.\s-]/g, ""), s.replace(/\.?js$/, "")])].filter(
    (v) => v.length > 1
  );
}
function countMentions(text: string, skill: string) {
  let n = 0;
  for (const v of variants(skill)) {
    n += (text.match(new RegExp(`(^|[^a-z0-9])${esc(v)}(?![a-z0-9])`, "g")) ?? []).length;
  }
  return n;
}
const mentions = (text: string, skill: string) => countMentions(text, skill) > 0;

// ---------- hard reject ----------
export function hardReject(job: Job, profile: CandidateProfile): string | null {
  const title = job.title.toLowerCase();
  const hit = profile.excludedKeywords.find((k) => title.includes(k.toLowerCase()));
  return hit ? `Title contains excluded keyword "${hit}".` : null;
}

export function rejectedResult(reason: string): JobMatchResult {
  return {
    matchScore: 0, skillScore: 0, experienceScore: 0,
    salaryScore: 0, locationScore: 0, titleScore: 0,
    recommendation: "LOW", reasoning: reason, rejected: true,
  };
}

// ---------- skills ----------
function scoreSkills(job: Job, profile: CandidateProfile) {
  const title = job.title.toLowerCase();
  const text = `${title}\n${(job.description ?? "").toLowerCase()}`;
  const primary = profile.primarySkills;
  const secondary = profile.secondarySkills;
  const mine = [...primary, ...secondary].map((s) => s.toLowerCase());

  const pHits = primary.filter((s) => mentions(text, s));
  const sHits = secondary.filter((s) => mentions(text, s));

  const pDenom = Math.max(1, Math.min(primary.length, 5));
  let score = Math.min(100, (pHits.length / pDenom) * 85 + Math.min(sHits.length, 3) * 5);

  // stack conflict
  const conflicts = OTHER_STACKS.filter((t) => !mine.some((m) => m.includes(t.replace(".", ""))));
  const titleConflict = conflicts.find((t) => mentions(title, t));
  const conflictCount = conflicts.reduce((n, t) => n + countMentions(text, t), 0);
  const primaryCount = primary.reduce((n, s) => n + countMentions(text, s), 0);

  let note = "";
  if (titleConflict) {
    score = Math.min(score, 40);
    note = `Different stack in title (${titleConflict}).`;
  } else if (conflictCount > primaryCount) {
    score = Math.min(score, 45);
    note = "Description leans on other stacks more than yours.";
  }

  return { score: Math.round(score), matched: [...pHits, ...sHits], note };
}

// ---------- experience ----------
function requiredYears(text: string): { min: number; max?: number } | null {
  const range = text.match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*\+?\s*(?:years|yrs)/i);
  if (range) return { min: +range[1], max: +range[2] };
  const plus = text.match(/(\d{1,2})\s*\+?\s*(?:years|yrs)/i);
  return plus ? { min: +plus[1] } : null;
}

function scoreExperience(job: Job, profile: CandidateProfile) {
  const y = Number(profile.yearsExperience ?? 0);
  const req = requiredYears(job.description ?? "");

  if (!req) {
    const s = (job.experienceText ?? "").toLowerCase();
    if (s.includes("mid-senior")) return { score: 80, label: "no years stated (mid-senior)" };
    if (s.includes("associate")) return { score: 60, label: "no years stated (associate)" };
    if (s.includes("entry")) return { score: 20, label: "no years stated (entry level)" };
    return { score: 50, label: "no years stated" };
  }

  const label = req.max ? `${req.min}-${req.max} yrs` : `${req.min}+ yrs`;
  if (req.max) {
    if (y >= req.min - 1 && y <= req.max + 3) return { score: 100, label };
    if (y > req.max + 3) return { score: 70, label: `${label} (you may be overqualified)` };
    return { score: Math.max(10, 100 - (req.min - y) * 25), label };
  }
  if (y >= req.min) return { score: y - req.min <= 6 ? 100 : 75, label };
  return { score: Math.max(10, 100 - (req.min - y) * 25), label };
}

// ---------- title ----------
function scoreTitle(job: Job, profile: CandidateProfile) {
  const t = job.title.toLowerCase();
  if (/intern|trainee|junior|fresher|entry/.test(t)) return 15;

  let score = profile.targetRoles.some((r) => t.includes(r.toLowerCase())) ? 100 : 0;
  if (!score) {
    const keys = ["senior", "lead", "full stack", "fullstack", "frontend", "front-end",
      "front end", "react", "node", "typescript", "software engineer", "developer"];
    score = Math.min(90, 35 + keys.filter((k) => t.includes(k)).length * 15);
  }
  if (/director|vp |head of|principal/.test(t)) score = Math.min(score, 60);
  return score;
}

// ---------- location / salary ----------
function scoreLocation(job: Job, profile: CandidateProfile): number {
  const loc = norm(job.location ?? "");
  if (!loc) return 50;
  const prefs = profile.preferredLocations.map(norm);
  if (prefs.some((p) => loc.includes(p))) return 100;
  if (loc.includes("remote") || prefs.includes("remote")) return 90;
  const prefInNcr = prefs.some((p) => NCR.some((c) => p.includes(c)));
  if (prefInNcr && NCR.some((c) => loc.includes(c))) return 70;
  return 30;
}

function scoreSalary(job: Job, profile: CandidateProfile): number {
  const max = num(job.maxSalaryLpa);
  const floor = num(profile.minimumSalaryLpa);
  const target = num(profile.targetSalaryLpa);
  if (max == null || floor == null) return 50;
  if (max < floor) return 10;
  if (target != null && max >= target) return 100;
  return 75;
}

// ---------- combine ----------
export async function scoreJob(job: Job, profile: CandidateProfile): Promise<JobMatchResult> {
  const rejection = hardReject(job, profile);
  if (rejection) return rejectedResult(rejection);

  const skills = scoreSkills(job, profile);
  const exp = scoreExperience(job, profile);
  const titleScore = scoreTitle(job, profile);
  const locationScore = scoreLocation(job, profile);
  const salaryScore = scoreSalary(job, profile);

  let total =
    skills.score * WEIGHTS.skill +
    exp.score * WEIGHTS.experience +
    titleScore * WEIGHTS.title +
    locationScore * WEIGHTS.location +
    salaryScore * WEIGHTS.salary;

  if (skills.score < 40) total = Math.min(total, 49); // stack mismatch can't be rescued

  const matchScore = Math.round(total);
  const recommendation =
    matchScore >= HIGH_AT ? "HIGH" : matchScore >= MEDIUM_AT ? "MEDIUM" : "LOW";

  const reasoning = [
    skills.matched.length ? `Matched skills: ${skills.matched.join(", ")}.` : "No skills matched.",
    skills.note,
    `Experience: ${exp.label} (yours: ${profile.yearsExperience ?? "?"}).`,
    `Title alignment: ${titleScore}/100.`,
    `Location: ${job.location ?? "unknown"} (${locationScore}/100).`,
    `Salary alignment: ${salaryScore}/100${job.salaryText ? ` (${job.salaryText})` : " (salary not listed)"}.`,
  ].filter(Boolean).join(" ");

  return {
    matchScore,
    skillScore: skills.score,
    experienceScore: exp.score,
    salaryScore,
    locationScore,
    titleScore,
    recommendation,
    reasoning,
    rejected: false,
  };
}