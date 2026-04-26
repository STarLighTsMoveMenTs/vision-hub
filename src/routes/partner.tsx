import { createFileRoute } from "@tanstack/react-router";
import { SignatureWorkspace } from "@/components/onboarding/signature-workspace";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Partner-Onboarding" }, { name: "description", content: "Partnerbereich für Compliance, Zusammenarbeit, Partnership Request und digitale Signatur." }] }),
  component: () => <SignatureWorkspace role="partner" />,
});
