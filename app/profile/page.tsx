import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDashboardSession } from "@/lib/auth/dashboard";
import DashboardSidebar from "@/components/dashboard-sidebar";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  if (!(await hasDashboardSession())) redirect("/login");

  return (
    <main className="dashboard-shell">
      <DashboardSidebar activePage="profile" />

      <div className="dashboard-content">
        <header className="topbar">
          <div className="topbar-brand">
            <span className="brand-mark brand-mark-small">C</span>
            <span>Careerly</span>
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
