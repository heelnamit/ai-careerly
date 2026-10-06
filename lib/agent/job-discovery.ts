export type RawJob = {
  externalId?: string;
  source: string;
  url: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salaryText?: string;
  experienceText?: string;
  postedAt?: Date;
};

export async function discoverJobs(): Promise<RawJob[]> {
  // Apify integration will be implemented in the next milestone.
  return [];
}
