import { auth } from "@/auth";
import { ResourceWorkspace } from "@/components/resources/resource-workspace";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? "demo-user";
  const snapshot = await getResourceActivationService().seedDemo(userId);
  return <ResourceWorkspace initialSnapshot={snapshot} initialSelectedResourceId={id} />;
}
