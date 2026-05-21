import { ResourceWorkspace } from "@/components/resources/resource-workspace";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  return <ResourceWorkspace initialSnapshot={snapshot} />;
}
