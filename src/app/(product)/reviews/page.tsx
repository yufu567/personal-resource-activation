import { auth } from "@/auth";
import { ReviewsPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "demo-user";
  const { getResourceActivationService } = await import("@/server/resource-activation-service");
  const snapshot = await getResourceActivationService().seedDemo(userId);
  return <ReviewsPageClient snapshot={snapshot} />;
}
