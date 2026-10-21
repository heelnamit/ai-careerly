import Link from "next/link";

type SidebarPage =
  | "overview"
  | "jobs"
  | "shortlist"
  | "applications"
  | "insights"
  | "profile"
  | "settings";

type IconName =
  | "home"
  | "briefcase"
  | "bookmark"
  | "file"
  | "chart"
  | "user"
  | "settings"
  | "logout";

const mainLinks: {
  label: string;
  icon: IconName;
  href: string;
  page: SidebarPage;
}[] = [
  { label: "Overview", icon: "home", href: "/", page: "overview" },
  { label: "Job matches", icon: "briefcase", href: "/dashboard#jobs", page: "jobs" },
  {
    label: "Shortlist",
    icon: "bookmark",
    href: "/dashboard?view=shortlisted#jobs",
    page: "shortlist",
  },
  {
    label: "Applications",
    icon: "file",
    href: "/dashboard?view=applied#jobs",
    page: "applications",
  },
  {
    label: "Insights",
    icon: "chart",
    href: "/dashboard?view=insights#insights",
    page: "insights",
  },
];

function SidebarIcon({
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
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
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

export default function DashboardSidebar({
  activePage,
}: {
  activePage: SidebarPage;
}) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <Link className="brand-mark sidebar-brand" href="/" aria-label="Careerly overview">
        <span>C</span>
      </Link>

      <nav aria-label="Workspace" className="sidebar-nav">
        {mainLinks.map((item) => (
          <Link
            aria-current={activePage === item.page ? "page" : undefined}
            aria-label={item.label}
            className={`sidebar-link${activePage === item.page ? " sidebar-link-active" : ""}`}
            href={item.href}
            key={item.page}
            title={item.label}
          >
            <SidebarIcon name={item.icon} />
            <span className="sidebar-tooltip">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <Link
          aria-current={activePage === "profile" ? "page" : undefined}
          aria-label="Your profile"
          className={`sidebar-link${activePage === "profile" ? " sidebar-link-active" : ""}`}
          href="/profile"
          title="Your profile"
        >
          <SidebarIcon name="user" />
          <span className="sidebar-tooltip">Your profile</span>
        </Link>
        <Link
          aria-current={activePage === "settings" ? "page" : undefined}
          aria-label="Settings"
          className={`sidebar-link${activePage === "settings" ? " sidebar-link-active" : ""}`}
          href="/settings"
          title="Settings"
        >
          <SidebarIcon name="settings" />
          <span className="sidebar-tooltip">Settings</span>
        </Link>
        <form action="/api/dashboard/logout" method="post">
          <button
            aria-label="Sign out"
            className="sidebar-link sidebar-signout"
            title="Sign out"
            type="submit"
          >
            <SidebarIcon name="logout" />
            <span className="sidebar-tooltip">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
