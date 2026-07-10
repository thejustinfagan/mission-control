import { BeastModeHealth } from "@/components/beast-mode-health";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getHealthData() {
  try {
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:3001";
    const authorization = headers().get("authorization");

    const res = await fetch(`${baseUrl}/api/status`, {
      cache: "no-store",
      headers: authorization ? { authorization } : undefined,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HealthPage() {
  const data = await getHealthData();
  return <BeastModeHealth data={data} />;
}
