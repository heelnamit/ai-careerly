import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDashboardSession } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/db/prisma";
import DashboardSidebar from "@/components/dashboard-sidebar";
import SearchPanel from "./search-panel";

type IconName =
  | "home"
  | "briefcase"
  | "bookmark"
  | "chart"
  | "user"
  | "spark"
  | "check"
  | "arrow"
  | "search"
  | "file";

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
      </>
    ),
    bookmark: (
      <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.5L6 21V4.75Z" />
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 3 6-7" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    spark: (
      <path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Zm7 12 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (!(await hasDashboardSession())) redirect("/login");
  const { view } = await searchParams;
  const initialView =
    view === "shortlisted" || view === "applied" || view === "insights"
      ? view
      : "all";

  const profile = await prisma.candidateProfile.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  const [
    scoredMatches,
    unscoredJobs,
    totalJobs,
    matchCounts,
    scoredJobs,
    highMatches,
  ] = await Promise.all([
    profile
      ? prisma.jobMatch.findMany({
          where: {
            candidateProfileId: profile.id,
            ...(initialView === "shortlisted"
              ? { status: "SHORTLISTED" as const }
              : initialView === "applied"
                ? { status: "APPLIED" as const }
                : {}),
          },
          orderBy: [{ matchScore: "desc" }, { updatedAt: "desc" }],
          take:
            initialView === "shortlisted" || initialView === "applied"
              ? undefined
              : 100,
          select: {
            matchScore: true,
            skillScore: true,
            experienceScore: true,
            salaryScore: true,
            locationScore: true,
            titleScore: true,
            recommendation: true,
            aiReasoning: true,
            status: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                location: true,
                url: true,
                source: true,
                salaryText: true,
                postedAt: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    initialView === "shortlisted" || initialView === "applied"
      ? Promise.resolve([])
      : prisma.job.findMany({
          where: profile
            ? { matches: { none: { candidateProfileId: profile.id } } }
            : undefined,
          orderBy: { fetchedAt: "desc" },
          take: profile ? 25 : 100,
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            url: true,
            source: true,
            salaryText: true,
            postedAt: true,
          },
        }),
    prisma.job.count(),
    profile
      ? prisma.jobMatch.groupBy({
          by: ["status"],
          where: { candidateProfileId: profile.id },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    profile
      ? prisma.jobMatch.count({
          where: { candidateProfileId: profile.id },
        })
      : Promise.resolve(0),
    profile
      ? prisma.jobMatch.count({
          where: {
            candidateProfileId: profile.id,
            recommendation: "HIGH",
          },
        })
      : Promise.resolve(0),
  ]);
  const shortlisted =
    matchCounts.find((match) => match.status === "SHORTLISTED")?._count._all ??
    0;
  const applications =
    matchCounts.find((match) => match.status === "APPLIED")?._count._all ?? 0;
  const profileReadyPercent =
    profile && totalJobs > 0
      ? Math.min(100, Math.round((scoredJobs / totalJobs) * 100))
      : 0;

  const metrics = [
    {
      label: "Jobs found",
      value: totalJobs.toLocaleString(),
      note: "Opportunities saved to your workspace",
      icon: "briefcase" as const,
      tone: "violet",
    },
    {
      label: "Strong matches",
      value: highMatches.toLocaleString(),
      note: "Scored against your profile",
      icon: "spark" as const,
      tone: "blue",
    },
    {
      label: "Shortlisted",
      value: shortlisted.toLocaleString(),
      note: "Roles you’ve marked as a favorite",
      icon: "bookmark" as const,
      tone: "mint",
    },
    {
      label: "Applications",
      value: applications.toLocaleString(),
      note: "Applications tracked in your workspace",
      icon: "file" as const,
      tone: "blue",
    },
  ];

  const dashboardJobs = [
    ...scoredMatches.map(({ job, ...match }) => ({
      ...job,
      postedAt: job.postedAt?.toISOString() ?? null,
      match,
    })),
    ...unscoredJobs.map((job) => ({
      ...job,
      postedAt: job.postedAt?.toISOString() ?? null,
      match: null,
    })),
  ];

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        activePage={
          initialView === "shortlisted"
            ? "shortlist"
            : initialView === "applied"
              ? "applications"
              : initialView === "insights"
                ? "insights"
                : "jobs"
        }
      />

      <div className="dashboard-content">
        <header className="topbar">
          <div className="topbar-brand">
            <span className="brand-mark brand-mark-small">N</span>
            <span>Careerly</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-status">
              <span className="status-dot" />
              Your workspace
            </span>
            <form action="/api/dashboard/logout" method="post">
              <button className="dashboard-signout" type="submit">Sign out</button>
            </form>
          </div>
        </header>

        <div className="dashboard-main">
          <section className="welcome-row" id="overview">
            <div>
              <p className="eyebrow">YOUR CAREER, IN MOTION</p>
              <h1>Job matches</h1>
              <p className="welcome-copy">
                See how each role fits your skills, experience, and preferences.
              </p>
            </div>
            <Link
              className="button button-primary dashboard-profile-action"
              href="/profile"
            >
              <Icon className="h-4 w-4" name="user" />
              Edit profile
              <Icon className="h-4 w-4" name="arrow" />
            </Link>
          </section>

          <section aria-label="Job search overview" className="metric-grid">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className={`metric-icon metric-icon-${metric.tone}`}>
                  <Icon className="h-5 w-5" name={metric.icon} />
                </div>
                <div className="metric-details">
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                  <span>{metric.note}</span>
                </div>
                <span className="metric-decoration" aria-hidden="true">
                  <Icon className="h-6 w-6" name={metric.icon} />
                </span>
              </article>
            ))}
          </section>

          <div className="dashboard-grid">
            <section aria-labelledby="matches-title" className="panel matches-panel" id="jobs">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">YOUR NEXT MOVE</p>
                  <h2 id="matches-title">Scored job results</h2>
                </div>
                <span
                  className={`profile-rank-badge${profile ? "" : " profile-rank-badge-pending"}`}
                  title={profile ? "Scores are based on your saved candidate profile" : "Add a candidate profile to score jobs"}
                >
                  <Icon
                    className="profile-rank-badge-icon"
                    name={profile ? "check" : "user"}
                  />
                  <span>{profile ? "Ranked for you" : "Add profile"}</span>
                </span>
              </div>

              <SearchPanel
                hasProfile={Boolean(profile)}
                initialFilter={
                  initialView === "insights" ? "all" : initialView
                }
                key={initialView}
                jobs={dashboardJobs}
              />
            </section>

            <aside
              className="panel setup-panel"
              aria-labelledby="setup-title"
              id="insights"
            >
              <div className="setup-heading">
                <div>
                  <p className="eyebrow">YOUR AI ASSISTANT</p>
                  <h2 id="setup-title">Matching overview</h2>
                </div>
                <span className={profile ? "pill pill-neutral" : "pill pill-pending"}>
                  <span className={`status-dot${profile ? "" : " status-dot-muted"}`} />
                  {profile ? `${scoredJobs} scored` : "Profile required"}
                </span>
              </div>

              <div className="progress-summary">
                <div
                  aria-label={`${profileReadyPercent} percent of saved jobs scored`}
                  className="progress-ring"
                  role="img"
                  style={{
                    background: `conic-gradient(#7263f0 ${profileReadyPercent * 3.6}deg, #eae9fa 0deg)`,
                  }}
                >
                  <div className="progress-ring-inner">
                    <Icon className="h-7 w-7" name="spark" />
                    <strong>{profileReadyPercent}%</strong>
                    <span>scored</span>
                  </div>
                </div>
                <div className="progress-copy">
                  <strong>
                    {profile
                      ? `${highMatches} strong ${highMatches === 1 ? "match" : "matches"}`
                      : "Add your candidate profile"}
                  </strong>
                  <span>
                    {profile
                      ? `${scoredJobs} of ${totalJobs} saved jobs scored against your profile.`
                      : "Job-fit scores use your skills, experience, and preferences."}
                  </span>
                </div>
              </div>

              <div className="setup-divider" />

              <ol className="setup-list">
                {[
                  {
                    label: "Candidate profile",
                    state: profile ? "Ready" : "Set up next",
                    complete: Boolean(profile),
                  },
                  {
                    label: "Saved jobs scored",
                    state: `${scoredJobs}/${totalJobs}`,
                    complete: totalJobs > 0 && scoredJobs === totalJobs,
                  },
                  {
                    label: "Strong matches",
                    state: highMatches.toLocaleString(),
                    complete: highMatches > 0,
                  },
                  {
                    label: "Shortlist and applications",
                    state: `${shortlisted} / ${applications}`,
                    complete: shortlisted + applications > 0,
                  },
                ].map((step, index) => (
                  <li className="setup-step" key={step.label}>
                    <span
                      className={`step-icon${index === 0 && !profile ? " step-icon-next" : ""}`}
                    >
                      {step.complete ? (
                        <Icon className="h-3.5 w-3.5" name="check" />
                      ) : index === 0 && !profile ? (
                        <Icon className="h-3.5 w-3.5" name="arrow" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </span>
                    <span className="step-label">{step.label}</span>
                    <span
                      className={`step-state${index === 0 && !profile ? " step-state-next" : ""}`}
                    >
                      {step.state}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="profile-tip" id="profile">
                <div className="profile-tip-icon">
                  <Icon className="h-4 w-4" name="check" />
                </div>
                <div>
                  <strong>Your profile stays yours</strong>
                  <p>
                    Match scores are guidance for your search. You stay in
                    control of which roles to pursue.
                  </p>
                </div>
              </div>

              <Link className="setup-link" href={profile ? "#jobs" : "/profile"}>
                {profile ? "Review job scores" : "Create your profile"}{" "}
                <Icon className="h-4 w-4" name="arrow" />
              </Link>
            </aside>
          </div>

          <footer className="dashboard-footer">
            <span>Made for your next chapter.</span>
            <span>AI-powered job search, with you in control.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
