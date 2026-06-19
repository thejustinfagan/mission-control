import { TruthCockpit } from "@/components/truth/truth-cockpit";
import { buildMissionControlSnapshot } from "@/lib/truth/snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const snapshot = await buildMissionControlSnapshot();
  return <TruthCockpit snapshot={snapshot} />;
}
