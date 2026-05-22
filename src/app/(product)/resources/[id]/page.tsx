import { ResourceWorkspace } from "@/components/resources/resource-workspace";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  return <ResourceWorkspace initialSnapshot={snapshot} initialSelectedResourceId={id} />;
}
