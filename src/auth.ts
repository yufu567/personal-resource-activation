import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { validateLogin, seedDemoUser } from "@/auth/store";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "邮箱", type: "email" },
      password: { label: "密码", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const email = credentials.email as string;
      const password = credentials.password as string;

      if (!isCredentialValid(email, password)) return null;

      try {
        if (email === "demo@example.com") {
          const demoUser = await seedDemoUser();
          await ensurePostgresUser(demoUser.id, demoUser.email, demoUser.displayName, "demo");
          return { id: demoUser.id, email: demoUser.email, name: demoUser.displayName };
        }
        const user = await validateLogin(email, password);
        if (!user) return null;
        await ensurePostgresUser(user.id, user.email, user.displayName, "email");
        return { id: user.id, email: user.email, name: user.displayName };
      } catch {
        return null;
      }
    },
  }),
];

// GitHub OAuth — only enabled when credentials are configured
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

async function ensurePostgresUser(
  userId: string,
  email: string,
  displayName?: string,
  authProvider = "email",
) {
  if (process.env.STORE !== "postgres") return;
  try {
    const { getDb } = await import("@/db");
    const { users } = await import("@/db/schema");
    const db = getDb();
    await db
      .insert(users)
      .values({
        id: userId,
        email,
        displayName: displayName ?? null,
        authProvider,
      })
      .onConflictDoNothing();
  } catch {
    // ignore — user may already exist
  }
}

function isCredentialValid(email: string, password: string): boolean {
  if (email === "demo@example.com" && password === "demo123") return true;
  return password.length >= 4;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        const email = user.email ?? `github-${user.id}@users.local`;
        await ensurePostgresUser(user.id!, email, user.name ?? undefined, "github");
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? `github-${user.id}@users.local`;
        if (user.name) token.name = user.name;
      }
      if (account?.provider === "github") {
        token.githubLogin = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) ?? "";
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
});
