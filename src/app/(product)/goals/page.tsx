import { GoalsPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const { getResourceActivationService } = await import("@/server/resource-activation-service");
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  return <GoalsPageClient snapshot={snapshot} />;
}
