import { auth } from "@/auth";
import { ConnectorsPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ConnectorsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "demo-user";
  const { getResourceActivationService } = await import("@/server/resource-activation-service");
  const snapshot = await getResourceActivationService().seedDemo(userId);
  return <ConnectorsPageClient snapshot={snapshot} />;
}
