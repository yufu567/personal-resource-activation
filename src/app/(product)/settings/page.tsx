import { SettingsPageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { getResourceActivationService } = await import("@/server/resource-activation-service");
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  return <SettingsPageClient snapshot={snapshot} />;
}
