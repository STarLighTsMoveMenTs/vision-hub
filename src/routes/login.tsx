import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel } from "@/components/onboarding/auth-panel";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Enterprise Onboarding" }, { name: "description", content: "Sicherer Login und Zugangsanfrage für getrennte Onboarding-Bereiche." }] }),
  component: AuthPanel,
});
