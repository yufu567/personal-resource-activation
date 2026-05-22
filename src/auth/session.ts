import { auth } from "@/auth";

/** Get the current userId from Auth.js session, or fall back to demo-user */
export async function getCurrentUserId(): Promise<string> {
  try {
    const session = await auth();
    return session?.user?.id ?? "demo-user";
  } catch {
    return "demo-user";
  }
}
