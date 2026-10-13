import { ApifyClient } from "apify-client";
import type { JobInput } from "@/lib/validation/job";
import type { JobSearch } from "@/lib/validation/search";
import { cleanDescription } from "../utils";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });


function parseSalaryLpa(text?: string | null) {
  if (!text || !text.includes("₹")) return {};
  const periods = /\/yr/i.test(text) ? 1 : /\/mo/i.test(text) ? 12 : null;
  if (!periods) return {};
  const nums = [...text.matchAll(/₹\s?([\d,]+(?:\.\d+)?)/g)].map((m) =>
    Number(m[1].replace(/,/g, ""))
  );
  if (!nums.length) return {};
  const lpa = (n: number) => Math.round(((n * periods) / 100000) * 10) / 10;
  return { minSalaryLpa: lpa(Math.min(...nums)), maxSalaryLpa: lpa(Math.max(...nums)) };
}

function normalize(item: any): JobInput | null {
  const id = item.id ? String(item.id) : undefined;
  const url = id
    ? `https://www.linkedin.com/jobs/view/${id}`
    : typeof item.link === "string"
      ? item.link.split("?")[0]
      : undefined;
  const description = item.descriptionText ?? item.descriptionHtml;

  if (!url || !item.title || !item.companyName || !description) return null;

  const postedAt =
    item.postedAt && !Number.isNaN(Date.parse(item.postedAt))
      ? new Date(item.postedAt).toISOString()
      : null;

  return {
    source: "linkedin",
    externalId: id,
    url,
    title: item.title,
    company: item.companyName,
    location: item.location ?? null,
    description: cleanDescription(description),
    salaryText: item.salary || null,
    ...parseSalaryLpa(item.salary),
    experienceText: item.seniorityLevel ?? null,
    postedAt,
  };
}
export type SearchResult = {
  search: JobSearch;
  jobs: JobInput[];
  error?: string;
};

async function runSearch(search: JobSearch, limit: number): Promise<SearchResult> {
  const run = await client.actor(process.env.APIFY_LINKEDIN_ACTOR_ID!).call(
    {
      autoConvertToAiSearch: true,
      datePosted: search.datePosted,
      keywords: search.keywords,
      location: search.location,
      limitPerSource: limit,
      scrapeCompany: false, // faster and cheaper; flip to true if you want company details
      splitByLocation: false,
      under10Applicants: false,
    },
    { waitSecs: 240 }
  );

  const { items } = await client
    .dataset(run.defaultDatasetId)
    .listItems({ limit });

  const jobs = items.map(normalize).filter((j): j is JobInput => j !== null);
  return { search, jobs };
}

export async function fetchLinkedInJobs(
  searches: JobSearch[],
  maxItemsPerSearch: number
): Promise<SearchResult[]> {
  const settled = await Promise.allSettled(
    searches.map((s) => runSearch(s, maxItemsPerSearch))
  );

  const seen = new Set<string>(); // same job can match two searches
  return settled.map((r, i) => {
    if (r.status === "rejected") {
      console.error(`Search failed: ${searches[i].keywords}`, r.reason);
      return {
        search: searches[i],
        jobs: [],
        error: "This search could not be completed.",
      };
    }
    const jobs = r.value.jobs.filter((j) => !seen.has(j.url) && seen.add(j.url));
    return { search: searches[i], jobs };
  });
}