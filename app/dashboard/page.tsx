import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDashboardSession } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/db/prisma";
import SearchPanel from "./search-panel";

type IconName =
  | "home"
  | "briefcase"
  | "bookmark"
  | "chart"
  | "user"
  | "settings"
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
    settings: (
      <>
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" />
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

const navigation: { label: string; icon: IconName; href: string }[] = [
  { label: "Overview", icon: "home", href: "/" },
  { label: "Job matches", icon: "briefcase", href: "/dashboard" },
  { label: "Shortlist", icon: "bookmark", href: "/dashboard#shortlist" },
  { label: "Applications", icon: "file", href: "/dashboard#applications" },
  { label: "Insights", icon: "chart", href: "/dashboard#insights" },
];

const setupSteps = [
  { label: "Connect job sources", state: "Next up" },
  { label: "Complete your profile", state: "Locked" },
  { label: "Find your best matches", state: "Locked" },
  { label: "Review application settings", state: "Locked" },
];

export default async function DashboardPage() {
  if (!(await hasDashboardSession())) redirect("/login");

  const [jobs, totalJobs, shortlisted, applications] = await Promise.all([
    prisma.job.findMany({
      orderBy: { fetchedAt: "desc" },
      take: 100,
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
    prisma.jobMatch.count({ where: { status: "SHORTLISTED" } }),
    prisma.jobMatch.count({ where: { status: "APPLIED" } }),
  ]);

  const metrics = [
    {
      label: "Jobs found",
      value: totalJobs.toLocaleString(),
      note: "Opportunities saved to your workspace",
      icon: "briefcase" as const,
      tone: "violet",
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

  const dashboardJobs = jobs.map((job) => ({
    ...job,
    postedAt: job.postedAt?.toISOString() ?? null,
  }));

  return (
    <main className="dashboard-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link className="brand-mark" href="/" aria-label="Careerly home">
          <span>N</span>
        </Link>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const active = item.label === "Job matches";
            return (
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
                href={item.href}
                key={item.label}
                title={item.label}
              >
                <Icon name={item.icon} />
                <span className="sidebar-tooltip">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link
            aria-label="Your profile"
            className="sidebar-link"
            href="/profile"
            title="Your profile"
          >
            <Icon name="user" />
            <span className="sidebar-tooltip">Your profile</span>
          </Link>
          <Link
            aria-label="Settings"
            className="sidebar-link"
            href="/#settings"
            title="Settings"
          >
            <Icon name="settings" />
            <span className="sidebar-tooltip">Settings</span>
          </Link>
          <div className="avatar" aria-label="Profile placeholder">
            Y
          </div>
          <form action="/api/dashboard/logout" method="post">
            <button className="dashboard-mobile-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>

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
              <h1>Job discovery</h1>
              <p className="welcome-copy">
                A little closer to the role that feels like you.
              </p>
            </div>
            <Link className="button button-primary" href="/#milestone">
              <Icon className="h-4 w-4" name="spark" />
              Set up your agent
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
                  <h2 id="matches-title">Latest jobs</h2>
                </div>
                <span className="pill pill-neutral">
                  <Icon className="h-3.5 w-3.5" name="search" />
                  LinkedIn results
                </span>
              </div>

              <SearchPanel jobs={dashboardJobs} />
            </section>

            <aside className="panel setup-panel" aria-labelledby="setup-title">
              <div className="setup-heading">
                <div>
                  <p className="eyebrow">YOUR AI ASSISTANT</p>
                  <h2 id="setup-title">Agent setup</h2>
                </div>
                <span className="pill pill-pending">
                  <span className="status-dot status-dot-muted" />
                  Not started
                </span>
              </div>

              <div className="progress-summary">
                <div
                  aria-label="0 percent complete"
                  className="progress-ring"
                  role="img"
                >
                  <div className="progress-ring-inner">
                    <Icon className="h-7 w-7" name="spark" />
                    <strong>0%</strong>
                    <span>ready</span>
                  </div>
                </div>
                <div className="progress-copy">
                  <strong>Let’s get you started</strong>
                  <span>
                    Complete a few quick steps to unlock personalized matches.
                  </span>
                </div>
              </div>

              <div className="setup-divider" />

              <ol className="setup-list">
                {setupSteps.map((step, index) => (
                  <li className="setup-step" key={step.label}>
                    <span
                      className={`step-icon${index === 0 ? " step-icon-next" : ""}`}
                    >
                      {index === 0 ? (
                        <Icon className="h-3.5 w-3.5" name="arrow" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </span>
                    <span className="step-label">{step.label}</span>
                    <span
                      className={`step-state${index === 0 ? " step-state-next" : ""}`}
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
                    You’ll review and approve your preferences before anything
                    is submitted.
                  </p>
                </div>
              </div>

              <Link className="setup-link" href="/#milestone">
                Continue setup <Icon className="h-4 w-4" name="arrow" />
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
