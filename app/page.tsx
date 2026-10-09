import Link from "next/link";

type NavigationIcon = "home" | "briefcase" | "bookmark" | "file" | "chart";

function NavigationGlyph({ name }: { name: NavigationIcon }) {
  const paths: Record<NavigationIcon, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </>
    ),
    bookmark: (
      <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.5L6 21V4.75Z" />
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 3 6-7" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
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

const navigation: { label: string; icon: NavigationIcon; href: string }[] = [
  { label: "Overview", icon: "home", href: "/" },
  { label: "Job matches", icon: "briefcase", href: "/dashboard" },
  { label: "Shortlist", icon: "bookmark", href: "/dashboard#shortlist" },
  { label: "Applications", icon: "file", href: "/dashboard#applications" },
  { label: "Insights", icon: "chart", href: "/dashboard#insights" },
];

const stats = [
  { label: "Jobs found", value: "0", note: "Ready to discover", tone: "violet" },
  { label: "Strong matches", value: "0", note: "Matched to your profile", tone: "mint" },
  { label: "Shortlisted", value: "0", note: "Roles saved for later", tone: "blue" },
  { label: "Applications", value: "0", note: "Tracked in one place", tone: "violet" },
];

const milestones = [
  "Candidate profile",
  "Job source connection",
  "Job deduplication",
  "AI-powered matching",
];

export default function Home() {
  return (
    <main className="dashboard-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link className="brand-mark" href="/" aria-label="Careerly home">
          <span>N</span>
        </Link>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const active = item.label === "Overview";
            return (
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`sidebar-link${active ? " sidebar-link-active" : ""}`}
                href={item.href}
                key={item.label}
                title={item.label}
              >
                <NavigationGlyph name={item.icon} />
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
            <span aria-hidden="true" className="home-sidebar-user">
              Y
            </span>
            <span className="sidebar-tooltip">Your profile</span>
          </Link>
          <Link
            aria-label="Settings"
            className="sidebar-link"
            href="/#settings"
            title="Settings"
          >
            <span aria-hidden="true" className="home-sidebar-settings">
              ⚙
            </span>
            <span className="sidebar-tooltip">Settings</span>
          </Link>
          <div className="avatar" aria-label="Profile placeholder">
            Y
          </div>
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
            <span className="avatar avatar-small" aria-hidden="true">
              Y
            </span>
          </div>
        </header>

        <div className="dashboard-main">
          <section className="welcome-row" id="overview">
            <div>
              <p className="eyebrow">YOUR CAREER, IN MOTION</p>
              <h1>Your job search, at a glance</h1>
              <p className="welcome-copy">
                Your personal AI job search, thoughtfully organized.
              </p>
            </div>
            <Link className="button button-primary" href="/profile">
              <span aria-hidden="true">✦</span>
              Complete your profile
              <span aria-hidden="true">↗</span>
            </Link>
          </section>

          <section
            aria-label="Job search overview"
            className="metric-grid home-metric-grid"
          >
            {stats.map((stat) => (
              <article className="metric-card" key={stat.label}>
                <div className={`metric-icon metric-icon-${stat.tone}`}>
                  <NavigationGlyph
                    name={
                      stat.label === "Jobs found" ||
                      stat.label === "Strong matches"
                        ? "briefcase"
                        : stat.label === "Shortlisted"
                          ? "bookmark"
                          : "file"
                    }
                  />
                </div>
                <div className="metric-details">
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                  <span>{stat.note}</span>
                </div>
                <span aria-hidden="true" className="metric-decoration">
                  <NavigationGlyph name="chart" />
                </span>
              </article>
            ))}
          </section>

          <div className="dashboard-grid home-dashboard-grid">
            <section
              aria-labelledby="milestone-title"
              className="panel home-milestone-panel"
              id="milestone"
            >
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">YOUR NEXT MOVE</p>
                  <h2 id="milestone-title">Connect your job sources</h2>
                </div>
                <span className="pill pill-pending">
                  <span className="status-dot status-dot-muted" />
                  Getting started
                </span>
              </div>

              <p className="home-panel-copy">
                Your workspace is ready. Connect a job source to start finding
                relevant roles, then we’ll organize and rank them around your
                experience and preferences.
              </p>

              <div className="home-milestone-list">
                {milestones.map((item, index) => (
                  <div className="home-milestone-item" key={item}>
                    <span className="home-milestone-icon">
                      {index === 0 ? "✓" : index + 1}
                    </span>
                    <span>{item}</span>
                    <span className="home-milestone-state">
                      {index === 0 ? "Ready" : "Coming up"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="home-milestone-actions">
                <Link className="button button-primary" href="/dashboard">
                  Open job matches
                  <span aria-hidden="true">↗</span>
                </Link>
                <span>Setup progress · 1 of 4 steps</span>
              </div>
            </section>

            <aside
              aria-labelledby="profile-title"
              className="panel home-profile-panel"
              id="profile"
            >
              <div className="home-profile-heading">
                <div className="home-profile-avatar" aria-hidden="true">
                  <NavigationGlyph name="briefcase" />
                </div>
                <div>
                  <p className="eyebrow">TARGET PROFILE</p>
                  <h2 id="profile-title">Your ideal next role</h2>
                </div>
              </div>

              <div className="home-role">
                <span>Preferred role</span>
                <strong>Senior Frontend / React</strong>
              </div>

              <div className="home-profile-details">
                <div>
                  <span>Experience</span>
                  <strong>8+ years</strong>
                </div>
                <div>
                  <span>Core skills</span>
                  <strong>React · TypeScript · JavaScript</strong>
                </div>
                <div>
                  <span>Also experienced in</span>
                  <strong>Node.js · REST APIs · Architecture</strong>
                </div>
                <div>
                  <span>Company preference</span>
                  <strong>Product-focused teams</strong>
                </div>
              </div>

              <Link className="home-profile-link" href="/profile">
                Personalize your search <span aria-hidden="true">↗</span>
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
