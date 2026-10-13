import { redirect } from "next/navigation";
import { hasDashboardSession } from "@/lib/auth/dashboard";
import LoginForm from "./login-form";

export default async function LoginPage() {
  if (await hasDashboardSession()) redirect("/dashboard");

  return (
    <main className="login-shell">
      <section aria-labelledby="login-title" className="login-card">
        <span aria-hidden="true" className="brand-mark login-brand">N</span>
        <p className="eyebrow">YOUR CAREER, IN MOTION</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-copy">
          Sign in to your private Careerly workspace.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
