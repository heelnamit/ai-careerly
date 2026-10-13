"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import type { JobSearch } from "@/lib/validation/search";

type DashboardJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: string;
  salaryText: string | null;
  postedAt: string | null;
};

type SearchEntry = JobSearch & { id: number };

type SearchCompletion = {
  found: number;
  saved: number | null;
  results: { keywords: string; count: number; error?: string }[];
};

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

export default function SearchPanel({ jobs }: { jobs: DashboardJob[] }) {
  const router = useRouter();
  const [searches, setSearches] = useState<SearchEntry[]>([
    { id: 0, keywords: "", location: "India", datePosted: "past24Hours" },
  ]);
  const [maxItemsPerSearch, setMaxItemsPerSearch] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completion, setCompletion] = useState<SearchCompletion | null>(null);

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
          typeof payload.summary.saved !== "number")
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
          <p className="eyebrow">YOUR LATEST FINDS</p>
          <h3>Job results</h3>
        </div>
        <span>{jobs.length} shown</span>
      </div>
      {jobs.length ? (
        <div className="job-results-list">
          {jobs.map((job) => {
            const postedAt = formatDate(job.postedAt);
            return (
              <article className="job-result-card" key={job.id}>
                <div className="job-result-main">
                  <p className="job-result-company">{job.company}</p>
                  <h4>{job.title}</h4>
                  <div className="job-result-meta">
                    {job.location && <span>{job.location}</span>}
                    {job.salaryText && <span>{job.salaryText}</span>}
                    {postedAt && <span>Posted {postedAt}</span>}
                  </div>
                </div>
                <a
                  aria-label={`View ${job.title} at ${job.company}`}
                  className="button button-secondary job-view-link"
                  href={job.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View job <span aria-hidden="true">↗</span>
                </a>
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
          <h3>Your next great role is out there</h3>
          <p>Run a LinkedIn search above to bring new opportunities into your dashboard.</p>
        </div>
      )}
    </div>
  );
}
