import Link from "next/link";
import ProfileForm from "./profile-form";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Job matches", href: "/dashboard" },
];

export default function ProfilePage() {
  return (
    <main className="dashboard-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <Link className="brand-mark" href="/" aria-label="Careerly home">
          <span>N</span>
        </Link>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              aria-label={item.label}
              className="sidebar-link"
              href={item.href}
              key={item.label}
              title={item.label}
            >
              <span aria-hidden="true" className="profile-nav-glyph">
                {item.label === "Overview" ? "⌂" : "▣"}
              </span>
              <span className="sidebar-tooltip">{item.label}</span>
            </Link>
          ))}
          <Link
            aria-current="page"
            aria-label="Your profile"
            className="sidebar-link sidebar-link-active"
            href="/profile"
            title="Your profile"
          >
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
              <circle cx="12" cy="8" r="4" />
              <path d="M5 21a7 7 0 0 1 14 0" />
            </svg>
            <span className="sidebar-tooltip">Your profile</span>
          </Link>
        </nav>
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

        <div className="dashboard-main profile-main">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">MAKE IT PERSONAL</p>
              <h1>Your candidate profile</h1>
              <p className="welcome-copy">
                Shape the roles we find around your experience and goals.
              </p>
            </div>
            <Link className="button button-secondary" href="/">
              <span aria-hidden="true">←</span>
              Back to overview
            </Link>
          </section>

          <section className="panel profile-panel">
            <div className="profile-panel-heading">
              <div>
                <p className="eyebrow">YOUR CAREER, YOUR TERMS</p>
                <h2>Tell us what a great next role looks like</h2>
                <p>
                  Your answers are saved to your candidate profile and used to
                  personalize your job search.
                </p>
              </div>
              <span className="profile-heading-mark" aria-hidden="true">
                ✦
              </span>
            </div>
            <ProfileForm />
          </section>

          <footer className="dashboard-footer">
            <span>Made for your next chapter.</span>
            <span>AI-powered job search, with you in control.</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
