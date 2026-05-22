import { auth } from "@/auth";
import { ResourceWorkspace } from "@/components/resources/resource-workspace";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "demo-user";
  const snapshot = await getResourceActivationService().seedDemo(userId);
  return <ResourceWorkspace initialSnapshot={snapshot} />;
}
