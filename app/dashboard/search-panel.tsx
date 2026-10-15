"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { rankJobs } from "@/lib/agent/job-ranking";
import type { JobSearch } from "@/lib/validation/search";

type JobMatch = {
  matchScore: number;
  skillScore: number | null;
  experienceScore: number | null;
  salaryScore: number | null;
  locationScore: number | null;
  titleScore: number | null;
  recommendation: string | null;
  aiReasoning: string | null;
  status: string;
};

type DashboardJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: string;
  salaryText: string | null;
  postedAt: string | null;
  match: JobMatch | null;
};

type SearchEntry = JobSearch & { id: number };

type SearchCompletion = {
  found: number;
  saved: number | null;
  scored: number | null;
  rejected: number | null;
  profileConfigured: boolean;
  scoringError: string | null;
  results: { keywords: string; count: number; error?: string }[];
};

type ScoreFilter =
  | "all"
  | "high"
  | "medium"
  | "low"
  | "unscored"
  | "excluded"
  | "shortlisted"
  | "applied";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(payload: unknown) {
  return isRecord(payload) && typeof payload.error === "string"
    ? payload.error
    : "Job search failed. Please try again.";
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function scoreTier(score: number): Exclude<ScoreFilter, "all" | "unscored" | "excluded"> {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function tierLabel(tier: string) {
  if (tier === "high") return "Strong match";
  if (tier === "medium") return "Good potential";
  return "Lower match";
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const score = value ?? 0;
  return (
    <div className="match-score-dimension">
      <div className="match-score-label">
        <span>{label}</span>
        <strong>{value === null ? "—" : `${value}%`}</strong>
      </div>
      <div
        aria-label={`${label}: ${value === null ? "not available" : `${value}%`}`}
        className="match-score-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
      >
        <span style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function SearchPanel({
  jobs,
  hasProfile,
  initialFilter = "all",
}: {
  jobs: DashboardJob[];
  hasProfile: boolean;
  initialFilter?: "all" | "shortlisted" | "applied";
}) {
  const router = useRouter();
  const [searches, setSearches] = useState<SearchEntry[]>([
    { id: 0, keywords: "", location: "India", datePosted: "past24Hours" },
  ]);
  const [maxItemsPerSearch, setMaxItemsPerSearch] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<SearchCompletion | null>(null);
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>(initialFilter);
  const [scoring, setScoring] = useState(false);
  const [scoreNotice, setScoreNotice] = useState<string | null>(null);

  function updateSearch(id: number, field: keyof JobSearch, value: string) {
    setSearches((current) =>
      current.map((search) =>
        search.id === id ? { ...search, [field]: value } : search,
      ),
    );
    setError(null);
    setCompletion(null);
  }

  function addSearch() {
    setSearches((current) =>
      current.length >= 5
        ? current
        : [
            ...current,
            {
              id: Math.max(...current.map((search) => search.id)) + 1,
              keywords: "",
              location: "India",
              datePosted: "past24Hours",
            },
          ],
    );
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validSearches = searches
      .filter((search) => search.keywords.trim())
      .map(({ keywords, location, datePosted }) => ({
        keywords: keywords.trim(),
        location: location.trim(),
        datePosted,
      }));

    if (!validSearches.length) {
      setError("Add at least one job title or keyword to search.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setCompletion(null);
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searches: validSearches,
          maxItemsPerSearch,
          save: true,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload));
      if (
        !isRecord(payload) ||
        !isRecord(payload.summary) ||
        !Array.isArray(payload.results) ||
        typeof payload.summary.found !== "number" ||
        (payload.summary.saved !== null &&
          typeof payload.summary.saved !== "number") ||
        typeof payload.summary.profileConfigured !== "boolean" ||
        (payload.summary.scored !== null &&
          typeof payload.summary.scored !== "number") ||
        (payload.summary.rejected !== null &&
          typeof payload.summary.rejected !== "number") ||
        (payload.summary.scoringError !== null &&
          typeof payload.summary.scoringError !== "string")
      ) {
        throw new Error("The search returned an invalid response.");
      }

      const results = payload.results.flatMap((result) => {
        if (
          !isRecord(result) ||
          typeof result.keywords !== "string" ||
          typeof result.count !== "number"
        ) {
          return [];
        }
        return [{
          keywords: result.keywords,
          count: result.count,
          error: typeof result.error === "string" ? result.error : undefined,
        }];
      });
      setCompletion({
        found: payload.summary.found,
        saved: payload.summary.saved,
        scored: payload.summary.scored,
        rejected: payload.summary.rejected,
        profileConfigured: payload.summary.profileConfigured,
        scoringError: payload.summary.scoringError,
        results,
      });
      router.refresh();
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Job search failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function rescoreJobs() {
    setScoring(true);
    setScoreNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/jobs/score", { method: "POST" });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload));
      if (
        !isRecord(payload) ||
        !isRecord(payload.summary) ||
        typeof payload.summary.scored !== "number" ||
        typeof payload.summary.rejected !== "number"
      ) {
        throw new Error("The scoring request returned an invalid response.");
      }
      setScoreNotice(
        `Scored ${payload.summary.scored} jobs against your latest profile. ${payload.summary.rejected} excluded by your profile settings.`,
      );
      router.refresh();
    } catch (scoreError) {
      setError(
        scoreError instanceof Error
          ? scoreError.message
          : "Could not score the saved jobs.",
      );
    } finally {
      setScoring(false);
    }
  }

  const rankedJobs = rankJobs(
    jobs.map((job) => ({ ...job, matchScore: job.match?.matchScore ?? -1 })),
  );
  const visibleJobs = rankedJobs.filter((job) => {
    if (scoreFilter === "all") return true;
    if (scoreFilter === "unscored") return !job.match;
    if (scoreFilter === "excluded") return job.match?.status === "SKIPPED";
    if (scoreFilter === "shortlisted") return job.match?.status === "SHORTLISTED";
    if (scoreFilter === "applied") return job.match?.status === "APPLIED";
    return (
      job.match?.status !== "SKIPPED" &&
      job.match !== null &&
      scoreTier(job.match.matchScore) === scoreFilter
    );
  });

  return (
    <div className="job-search-content">
      <form className="job-search-form" onSubmit={submitSearch}>
        <div className="job-search-form-heading">
          <div>
            <h3>Search LinkedIn jobs</h3>
            <p>Add up to five role and location combinations.</p>
          </div>
          <button
            className="button button-secondary add-search-button"
            disabled={searches.length >= 5 || submitting}
            onClick={addSearch}
            type="button"
          >
            + Add search
          </button>
        </div>

        <div className="job-search-rows">
          {searches.map((search, index) => (
            <fieldset className="job-search-row" key={search.id} disabled={submitting}>
              <legend>Search {index + 1}</legend>
              <label>
                Job title or keywords
                <input
                  autoComplete="off"
                  minLength={2}
                  onChange={(event) =>
                    updateSearch(search.id, "keywords", event.target.value)
                  }
                  placeholder="e.g. Product Designer"
                  value={search.keywords}
                />
              </label>
              <label>
                Location
                <input
                  minLength={2}
                  onChange={(event) =>
                    updateSearch(search.id, "location", event.target.value)
                  }
                  required={Boolean(search.keywords.trim())}
                  value={search.location}
                />
              </label>
              <label>
                Posted
                <select
                  onChange={(event) =>
                    updateSearch(search.id, "datePosted", event.target.value)
                  }
                  value={search.datePosted}
                >
                  <option value="past24Hours">Past 24 hours</option>
                  <option value="pastWeek">Past week</option>
                  <option value="pastMonth">Past month</option>
                </select>
              </label>
              {searches.length > 1 && (
                <button
                  aria-label={`Remove search ${index + 1}`}
                  className="remove-search-button"
                  onClick={() =>
                    setSearches((current) =>
                      current.filter((entry) => entry.id !== search.id),
                    )
                  }
                  type="button"
                >
                  Remove
                </button>
              )}
            </fieldset>
          ))}
        </div>

        <div className="job-search-actions">
          <label className="results-limit">
            Jobs per search
            <select
              onChange={(event) => setMaxItemsPerSearch(Number(event.target.value))}
              value={maxItemsPerSearch}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <button className="button button-primary" disabled={submitting} type="submit">
            {submitting ? "Searching LinkedIn..." : "Find jobs"}
          </button>
        </div>
        {submitting && (
          <p className="job-search-progress" role="status">
            Searches can take a few minutes while LinkedIn results are collected.
          </p>
        )}
        {error && <p className="profile-feedback profile-feedback-error" role="alert">{error}</p>}
        {completion && (
          <div className="job-search-feedback" role="status">
            <strong>
              Found {completion.found} {completion.found === 1 ? "job" : "jobs"}
              {completion.saved !== null && ` · Saved ${completion.saved}`}
            </strong>
            {completion.scoringError ? (
              <span className="job-search-result-error">
                {completion.scoringError} Use “Refresh scores” to retry without running the search again.
              </span>
            ) : completion.profileConfigured && completion.scored !== null ? (
              <span>
                Scored {completion.scored} saved jobs
                {completion.rejected ? ` · ${completion.rejected} excluded by your profile` : ""}
              </span>
            ) : (
              <span>
                {hasProfile
                  ? "No profile-based scores were saved."
                  : "Add a candidate profile to score and rank these jobs."}
              </span>
            )}
            {completion.results.map((result, index) => (
              <span
                className={result.error ? "job-search-result-error" : undefined}
                key={`${result.keywords}-${index}`}
              >
                {result.keywords}:{" "}
                {result.error ?? `${result.count} ${result.count === 1 ? "job" : "jobs"}`}
              </span>
            ))}
          </div>
        )}
      </form>

      <div className="job-results-heading">
        <div>
          <p className="eyebrow">RANKED AGAINST YOUR PROFILE</p>
          <h3>Job matches</h3>
        </div>
        <div className="job-results-heading-actions">
          <button
            className="rescore-button"
            disabled={!hasProfile || scoring || jobs.length === 0}
            onClick={rescoreJobs}
            type="button"
          >
            {scoring ? "Scoring..." : "Refresh scores"}
          </button>
          <span>{visibleJobs.length} of {jobs.length}</span>
        </div>
      </div>
      {jobs.length > 0 && hasProfile && (
        <p className="job-score-legend">
          Scores combine skills (40%), experience (20%), role title (20%),
          location (10%), and salary (10%). Strong matches start at 70.
        </p>
      )}
      {scoreNotice && <p className="job-search-feedback" role="status">{scoreNotice}</p>}
      {!hasProfile && jobs.length > 0 && (
        <p className="match-profile-prompt">
          Scores use your saved candidate profile.{" "}
          <a href="/profile">Create or complete your profile</a> to rank these jobs.
        </p>
      )}
      {jobs.length > 0 && (
        <div aria-label="Filter job matches by score" className="job-score-filters">
          {([
            ["all", `All (${jobs.length})`],
            ["high", `Strong (${jobs.filter((job) => job.match && job.match.status !== "SKIPPED" && scoreTier(job.match.matchScore) === "high").length})`],
            ["medium", `Potential (${jobs.filter((job) => job.match && job.match.status !== "SKIPPED" && scoreTier(job.match.matchScore) === "medium").length})`],
            ["low", `Lower (${jobs.filter((job) => job.match && job.match.status !== "SKIPPED" && scoreTier(job.match.matchScore) === "low").length})`],
            ["shortlisted", `Shortlist (${jobs.filter((job) => job.match?.status === "SHORTLISTED").length})`],
            ["applied", `Applied (${jobs.filter((job) => job.match?.status === "APPLIED").length})`],
            ["unscored", `Unscored (${jobs.filter((job) => !job.match).length})`],
            ["excluded", `Excluded (${jobs.filter((job) => job.match?.status === "SKIPPED").length})`],
          ] as [ScoreFilter, string][]).map(([filter, label]) => (
            <button
              aria-pressed={scoreFilter === filter}
              className={`job-score-filter${scoreFilter === filter ? " job-score-filter-active" : ""}`}
              key={filter}
              onClick={() => setScoreFilter(filter)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {visibleJobs.length ? (
        <div className="job-results-list">
          {visibleJobs.map((job) => {
            const postedAt = formatDate(job.postedAt);
            const tier = job.match
              ? scoreTier(job.match.matchScore)
              : null;
            const excluded = job.match?.status === "SKIPPED";
            return (
              <article className="job-result-card" key={job.id}>
                <div className="job-result-top">
                  <div className="job-result-main">
                    <p className="job-result-company">{job.company}</p>
                    <h4>{job.title}</h4>
                    <div className="job-result-meta">
                      {job.location && <span>{job.location}</span>}
                      {job.salaryText && <span>{job.salaryText}</span>}
                      {postedAt && <span>Posted {postedAt}</span>}
                    </div>
                  </div>
                  <div className={`job-match-score${tier ? ` job-match-score-${tier}` : ""}${excluded ? " job-match-score-excluded" : ""}`}>
                    <strong>{job.match ? `${Math.round(job.match.matchScore)}` : "—"}</strong>
                    <span>{excluded ? "Excluded" : tier ? tierLabel(tier) : "Unscored"}</span>
                  </div>
                </div>
                {job.match && (
                  <>
                    <div className="job-match-breakdown">
                      <ScoreBar label="Skills" value={job.match.skillScore} />
                      <ScoreBar label="Experience" value={job.match.experienceScore} />
                      <ScoreBar label="Title" value={job.match.titleScore} />
                      <ScoreBar label="Location" value={job.match.locationScore} />
                      <ScoreBar label="Salary" value={job.match.salaryScore} />
                    </div>
                    {job.match.aiReasoning && (
                      <details className="job-match-reasoning">
                        <summary>Why this score?</summary>
                        <p>{job.match.aiReasoning}</p>
                      </details>
                    )}
                  </>
                )}
                <div className="job-result-footer">
                  {excluded && (
                    <span className="job-exclusion-note">
                      Excluded by profile settings
                    </span>
                  )}
                  <a
                    aria-label={`View ${job.title} at ${job.company}`}
                    className="button button-secondary job-view-link"
                    href={job.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View job <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state job-empty-state">
          <div className="empty-art" aria-hidden="true">
            <div className="empty-art-orbit" />
            <div className="empty-art-card empty-art-card-back" />
            <div className="empty-art-card empty-art-card-front">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
              </svg>
            </div>
            <span className="empty-art-spark empty-art-spark-one">✦</span>
            <span className="empty-art-spark empty-art-spark-two">✧</span>
          </div>
          <h3>{jobs.length ? "No jobs in this score range" : "Your next great role is out there"}</h3>
          <p>
            {jobs.length
              ? "Choose another score filter to see more saved jobs."
              : "Run a LinkedIn search above to bring new opportunities into your dashboard."}
          </p>
        </div>
      )}
    </div>
  );
}
