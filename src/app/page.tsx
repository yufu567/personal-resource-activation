import { Dashboard } from "./dashboard";
import { getResourceActivationService } from "@/server/resource-activation-service";

export default async function Home() {
  const snapshot = await getResourceActivationService().seedDemo("demo-user");
  return <Dashboard initialSnapshot={snapshot} />;
}
