import { createFileRoute } from "@tanstack/react-router";
import { SignatureWorkspace } from "@/components/onboarding/signature-workspace";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team-Kameraden Hub" }, { name: "description", content: "Team-Onboarding mit Aufgabenstatus, Kurzmodulen und Signaturfluss." }] }),
  component: () => <SignatureWorkspace role="team" />,
});
