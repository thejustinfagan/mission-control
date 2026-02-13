import { JustinDashboard } from "@/components/justin-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getLiveStatus() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:3001";

    const res = await fetch(`${baseUrl}/api/status`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const liveData = await getLiveStatus();
  return <JustinDashboard liveData={liveData} />;
}
