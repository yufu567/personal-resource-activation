import { ReviewsPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const { getResourceActivationService } = await import("@/server/resource-activation-service");
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  return <ReviewsPageClient snapshot={snapshot} />;
}
