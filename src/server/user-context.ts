export const DEFAULT_DEMO_USER_ID = "demo-user";

export type AuthProvider = "demo" | "authjs" | "better-auth" | "api";

export interface ServerUserContext {
  userId: string;
  authProvider: AuthProvider;
}

export function createServerUserContext(input?: Partial<ServerUserContext>): ServerUserContext {
  return {
    userId: input?.userId ?? DEFAULT_DEMO_USER_ID,
    authProvider: input?.authProvider ?? "demo"
  };
}
