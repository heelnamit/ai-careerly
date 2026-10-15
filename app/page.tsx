import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDashboardSession } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/db/prisma";
import DashboardSidebar from "@/components/dashboard-sidebar";

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

export default async function Home() {
  if (!(await hasDashboardSession())) redirect("/login");

  const profile = await prisma.candidateProfile.findFirst({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      headline: true,
      yearsExperience: true,
      currentRole: true,
      primarySkills: true,
      secondarySkills: true,
      targetRoles: true,
      preferredLocations: true,
      companyPreferences: true,
    },
  });
  const [jobsFound, matchCount, shortlisted, applications] =
    await Promise.all([
      prisma.job.count(),
      profile
        ? prisma.jobMatch.count({
            where: { candidateProfileId: profile.id },
          })
        : Promise.resolve(0),
      profile
        ? prisma.jobMatch.count({
            where: {
              candidateProfileId: profile.id,
              status: "SHORTLISTED",
            },
          })
        : Promise.resolve(0),
      profile
        ? prisma.jobMatch.count({
            where: {
              candidateProfileId: profile.id,
              status: "APPLIED",
            },
          })
        : Promise.resolve(0),
    ]);

  const hasJobSource =
    Boolean(process.env.APIFY_API_TOKEN) &&
    Boolean(process.env.APIFY_LINKEDIN_ACTOR_ID);
  const stats = [
    {
      label: "Jobs found",
      value: jobsFound.toLocaleString(),
      note: "Saved from LinkedIn searches",
      icon: "briefcase" as const,
      tone: "violet",
    },
    {
      label: "Jobs scored",
      value: matchCount.toLocaleString(),
      note: "Scored against your candidate profile",
      icon: "briefcase" as const,
      tone: "mint",
    },
    {
      label: "Shortlisted",
      value: shortlisted.toLocaleString(),
      note: "Roles saved for later",
      icon: "bookmark" as const,
      tone: "blue",
    },
    {
      label: "Applications",
      value: applications.toLocaleString(),
      note: "Tracked in your workspace",
      icon: "file" as const,
      tone: "violet",
    },
  ];
  const milestones = [
    {
      label: "Candidate profile",
      state: profile ? "Saved" : "Set up next",
      complete: Boolean(profile),
    },
    {
      label: "LinkedIn job search",
      state: hasJobSource ? "Ready to search" : "Needs configuration",
      complete: hasJobSource,
    },
    {
      label: "Job collection",
      state: jobsFound
        ? `${jobsFound.toLocaleString()} saved`
        : "Waiting for search",
      complete: jobsFound > 0,
    },
    {
      label: "Personalized matching",
      state: matchCount
        ? `${matchCount.toLocaleString()} matches`
        : "Not connected yet",
      complete: matchCount > 0,
    },
  ];
  const completedSteps = milestones.filter((step) => step.complete).length;

  const profileSkills = [
    ...(profile?.primarySkills ?? []),
    ...(profile?.secondarySkills ?? []),
  ];
  const profileRoles = profile?.targetRoles ?? [];
  const profileLocations = profile?.preferredLocations ?? [];
  const profileCompanies = profile?.companyPreferences ?? [];

  return (
    <main className="dashboard-shell">
      <DashboardSidebar activePage="overview" />

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
            {profile?.name && (
              <span className="overview-user-name">{profile.name}</span>
            )}
            <form action="/api/dashboard/logout" method="post">
              <button className="dashboard-signout" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="dashboard-main">
          <section className="welcome-row" id="overview">
            <div>
              <p className="eyebrow">YOUR CAREER, IN MOTION</p>
              <h1>
                {profile?.name
                  ? `Welcome back, ${profile.name}`
                  : "Your job search, at a glance"}
              </h1>
              <p className="welcome-copy">
                Your LinkedIn job discovery workspace, profile, and saved activity.
              </p>
            </div>
            <Link
              className="button button-primary"
              href={profile ? "/dashboard" : "/profile"}
            >
              <span aria-hidden="true">{profile ? "⌕" : "✦"}</span>
              {profile ? "Search jobs" : "Complete your profile"}
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
                  <NavigationGlyph name={stat.icon} />
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
                <span
                  className={`pill ${completedSteps === milestones.length ? "pill-neutral" : "pill-pending"}`}
                >
                  <span
                    className={`status-dot${completedSteps === milestones.length ? "" : " status-dot-muted"}`}
                  />
                  {completedSteps} of {milestones.length} steps
                </span>
              </div>

              <p className="home-panel-copy">
                Your LinkedIn search, saved jobs, and candidate profile are
                connected here. Profile-based ranking is not connected yet.
              </p>

              <div className="home-milestone-list">
                {milestones.map((item, index) => (
                  <div
                    className={`home-milestone-item${item.complete ? " home-milestone-item-complete" : ""}`}
                    key={item.label}
                  >
                    <span className="home-milestone-icon">
                      {item.complete ? "✓" : index + 1}
                    </span>
                    <span>{item.label}</span>
                    <span
                      className={`home-milestone-state${item.complete ? " home-milestone-state-complete" : ""}`}
                    >
                      {item.state}
                    </span>
                  </div>
                ))}
              </div>

              <div className="home-milestone-actions">
                <Link className="button button-primary" href="/dashboard">
                  Open job search
                  <span aria-hidden="true">↗</span>
                </Link>
                <span>Workspace setup · {completedSteps} of {milestones.length} ready</span>
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
                  <h2 id="profile-title">
                    {profile
                      ? "Your candidate profile"
                      : "Build your candidate profile"}
                  </h2>
                </div>
              </div>

              {profile ? (
                <>
                  <div className="home-role">
                    <span>Target roles</span>
                    <strong>
                      {profileRoles.length
                        ? profileRoles.join(" · ")
                        : profile.currentRole ??
                          profile.headline ??
                          "Add target roles"}
                    </strong>
                  </div>

                  <div className="home-profile-details">
                    <div>
                      <span>Experience</span>
                      <strong>
                        {profile.yearsExperience}{" "}
                        {profile.yearsExperience === 1 ? "year" : "years"}
                      </strong>
                    </div>
                    <div>
                      <span>Skills</span>
                      <strong>
                        {profileSkills.length
                          ? profileSkills.join(" · ")
                          : "No skills added yet"}
                      </strong>
                    </div>
                    <div>
                      <span>Preferred locations</span>
                      <strong>
                        {profileLocations.length
                          ? profileLocations.join(" · ")
                          : "No locations added yet"}
                      </strong>
                    </div>
                    <div>
                      <span>Company preferences</span>
                      <strong>
                        {profileCompanies.length
                          ? profileCompanies.join(" · ")
                          : "Open to opportunities"}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="home-panel-copy">
                  Add your target roles, skills, and locations. They’ll be
                  available here to guide your job search.
                </p>
              )}

              <Link className="home-profile-link" href="/profile">
                {profile
                  ? "Edit candidate profile"
                  : "Create candidate profile"}{" "}
                <span aria-hidden="true">↗</span>
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
