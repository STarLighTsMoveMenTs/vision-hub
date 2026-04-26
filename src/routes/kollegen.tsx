import { createFileRoute } from "@tanstack/react-router";
import { SignatureWorkspace } from "@/components/onboarding/signature-workspace";

export const Route = createFileRoute("/kollegen")({
  head: () => ({ meta: [{ title: "Kollegen-Onboarding" }, { name: "description", content: "Kollegenbereich für Vision Style, Zusammenarbeit, Verhalten und Teamregeln." }] }),
  component: () => <SignatureWorkspace role="colleague" />,
});
