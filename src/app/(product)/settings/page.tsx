import { auth } from "@/auth";
import { SettingsPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "demo-user";
  const { getResourceActivationService } = await import("@/server/resource-activation-service");
  const snapshot = await getResourceActivationService().seedDemo(userId);
  return <SettingsPageClient snapshot={snapshot} />;
}
