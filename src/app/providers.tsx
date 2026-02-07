"use client";

import { ConvexProvider } from "convex/react";
import { convexClient } from "@/lib/convexClient";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!convexClient) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
