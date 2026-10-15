import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { hasDashboardSession } from "@/lib/auth/dashboard";

export default async function SettingsPage() {
  if (!(await hasDashboardSession())) redirect("/login");

  return (
    <main className="dashboard-shell">
      <DashboardSidebar activePage="settings" />

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
              <button className="dashboard-signout" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="dashboard-main settings-main">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h1>Settings</h1>
              <p className="welcome-copy">
                Manage your profile and see how this workspace is configured.
              </p>
            </div>
            <Link className="button button-secondary" href="/dashboard">
              View job matches <span aria-hidden="true">↗</span>
            </Link>
          </section>

          <section aria-label="Workspace settings" className="settings-grid">
            <article className="panel settings-card">
              <span className="settings-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 21a7 7 0 0 1 14 0" />
                </svg>
              </span>
              <div>
                <p className="eyebrow">PERSONALIZATION</p>
                <h2>Candidate profile</h2>
                <p>
                  Your skills, experience, target roles, and preferences are
                  used to calculate job-fit scores.
                </p>
              </div>
              <Link className="settings-card-link" href="/profile">
                Review profile <span aria-hidden="true">↗</span>
              </Link>
            </article>

            <article className="panel settings-card">
              <span className="settings-card-icon settings-card-icon-green" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
                </svg>
              </span>
              <div>
                <p className="eyebrow">ACCOUNT ACCESS</p>
                <h2>Private workspace</h2>
                <p>
                  Your dashboard is protected by the password configured for
                  this app. To change it, update <code>DASHBOARD_PASSWORD</code>{" "}
                  in the server environment and restart the app.
                </p>
              </div>
              <form action="/api/dashboard/logout" method="post">
                <button className="settings-card-link settings-signout" type="submit">
                  Sign out of this device <span aria-hidden="true">↗</span>
                </button>
              </form>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
