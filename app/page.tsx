import Link from "next/link";

const stats = [
  { label: "Jobs Found", value: "0" },
  { label: "Strong Matches", value: "0" },
  { label: "Shortlisted", value: "0" },
  { label: "Applications", value: "0" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-medium text-cyan-400">AI CAREER AGENT</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Your personal job intelligence system
            </h1>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            V1 Foundation
          </span>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section
          className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]"
          id="milestone"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm font-medium text-cyan-400">NEXT MILESTONE</p>
            <h2 className="mt-2 text-2xl font-semibold">Connect your job sources</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              The application foundation is ready. Next we will connect Apify,
              ingest jobs, normalize them, and score them against your candidate
              profile.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Candidate profile",
                "Apify job ingestion",
                "Job deduplication",
                "AI matching",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300"
                >
                  <span className="mr-2 text-cyan-400">○</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-slate-400">TARGET PROFILE</p>
            <h2 className="mt-2 text-xl font-semibold">Senior Frontend / React</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p>8+ years experience</p>
              <p>React · TypeScript · JavaScript</p>
              <p>Node.js · REST APIs · Architecture</p>
              <p>Product-company focus</p>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-6 text-sm text-slate-500">
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <span className="mx-2">·</span>
          Built for the AI Career Agent project
        </footer>
      </div>
    </main>
  );
}
