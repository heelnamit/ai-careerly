export function rankJobs<T extends { matchScore: number }>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => b.matchScore - a.matchScore);
}
