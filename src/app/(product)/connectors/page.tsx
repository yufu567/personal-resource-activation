import { ConnectorsPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ConnectorsPage() {
  const { getResourceActivationService } = await import("@/server/resource-activation-service");
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  return <ConnectorsPageClient snapshot={snapshot} />;
}
