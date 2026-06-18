import { JustinDashboard } from "@/components/justin-dashboard";
import { GET as getStatusResponse } from "./api/status/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getLiveStatus() {
  try {
    // Do not self-fetch the public Railway URL during server render. In Railway,
    // that hairpin request can fail even while /api/status works for browsers,
    // leaving the homepage stuck on the workspace-files error shell.
    const res = await getStatusResponse();
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Mission Control status load failed", error);
    return null;
  }
}

export default async function Home() {
  const liveData = await getLiveStatus();
  return <JustinDashboard liveData={liveData} />;
}
