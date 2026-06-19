import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";
import { TruthCockpit } from "@/components/truth/truth-cockpit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // Build the evidence-backed snapshot directly — no round-trip through
  // /api/status, no raw STATUS.md. The homepage renders only verified truth.
  const snapshot = await buildMissionControlSnapshot();
  return <TruthCockpit snapshot={snapshot} />;
}
