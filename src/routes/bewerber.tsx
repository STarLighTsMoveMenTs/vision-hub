import { createFileRoute } from "@tanstack/react-router";
import { SignatureWorkspace } from "@/components/onboarding/signature-workspace";

export const Route = createFileRoute("/bewerber")({
  head: () => ({ meta: [{ title: "Bewerber-Onboarding" }, { name: "description", content: "Bewerberbereich mit Kurzmodulen, Formularstatus und rechtlich dokumentierter Signatur." }] }),
  component: () => <SignatureWorkspace role="applicant" />,
});
