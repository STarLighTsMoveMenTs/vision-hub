import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, FileSignature, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { managementMetrics, publicModules, roleLabels, roleRoutes, type AppRole } from "@/lib/onboarding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Enterprise Onboarding & Compliance Hub" },
      { name: "description", content: "Rollenbasierte Onboarding-Webseite für Bewerber, Partner, Mitarbeiter, Teams, Management und Admin mit digitalen Signaturen." },
      { property: "og:title", content: "Enterprise Onboarding & Compliance Hub" },
      { property: "og:description", content: "Kurzmodule, Management-Status, Formulare und sichere Signatur-Ablage für Unternehmens-Onboarding." },
    ],
  }),
  component: Index,
});

const roleOrder: AppRole[] = ["applicant", "partner", "employee", "colleague", "team", "management", "admin"];

function Index() {
  return (
    <main className="aura-shell relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="matrix-rain" aria-hidden="true" />
      <div className="star-stream" aria-hidden="true" />
      <div className="pearl-rain" aria-hidden="true" />
      <div className="lightning-bolt" aria-hidden="true" />
      <header className="relative border-b border-border bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></span>
            Enterprise Onboarding
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <Link to="/management" className="hover:text-foreground">Management</Link>
            <Link to="/admin" className="hover:text-foreground">Admin</Link>
            <Link to="/login" className="hover:text-foreground">Login</Link>
          </nav>
          <Button asChild size="sm"><Link to="/login">Zugang <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </header>

      <section className="relative px-6 py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-md border border-border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">Vision Style · Compliance · Assigned Management</p>
            <h1 className="metallic-text mt-6 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">Onboarding, das Unternehmensregeln verständlich und nachweisbar macht.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Kurze Themenmodule aus den Regulatorien, getrennte Rollenbereiche, Management-Status und rechtlich dokumentierte digitale Bestätigungen.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link to="/login">Login oder Zugang beantragen</Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/management">Management-Ansicht</Link></Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {managementMetrics.map((metric) => (
              <div key={metric.label} className="glass-panel rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-3 text-4xl font-semibold">{metric.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{metric.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-border bg-secondary/40 px-6 py-10 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <div className="glass-panel flex gap-4 rounded-lg border p-5"><ShieldCheck className="h-6 w-6 text-primary" /><div><h2 className="font-semibold">Nur Kurzversion öffentlich</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Sensibler Vollinhalt bleibt hinter Login und Rollenprüfung.</p></div></div>
          <div className="glass-panel flex gap-4 rounded-lg border p-5"><FileSignature className="h-6 w-6 text-primary" /><div><h2 className="font-semibold">Signatur als sicherer Wert</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Name, Rolle, Version, Bestätigung, Signaturdaten und Hash werden gespeichert.</p></div></div>
          <div className="glass-panel flex gap-4 rounded-lg border p-5"><UsersRound className="h-6 w-6 text-primary" /><div><h2 className="font-semibold">Getrennte Rollenbereiche</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Bewerber, Partner, Mitarbeiter, Kollegen, Team, Management und Admin.</p></div></div>
        </div>
      </section>

      <section className="relative px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Themenbasierte Inhalte</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">Aus den Regulatorien abgeleitete Kurzmodule, publikationssicher und rollenbasiert weiterführbar.</p>
            </div>
            <Link to="/login" className="text-sm font-medium text-primary">Module zuweisen <ArrowRight className="inline h-4 w-4" /></Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publicModules.map((module) => (
              <article key={module.slug} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <p className="text-xs font-medium uppercase text-muted-foreground">Kurzversion · {module.audience}</p>
                <h3 className="mt-3 text-lg font-semibold">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{module.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-semibold tracking-tight">Zugangsbereiche</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roleOrder.map((role) => (
              <Link key={role} to={roleRoutes[role]} className="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent">
                <p className="font-semibold">{roleLabels[role]}</p>
                <p className="mt-2 text-sm text-muted-foreground">Separater Bereich mit Status, Formularen und Signaturfluss.</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
