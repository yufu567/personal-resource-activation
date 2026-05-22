import bcrypt from "bcryptjs";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

// In-memory user store — persists in process memory
const users = new Map<string, AuthUser>();
const emailIndex = new Map<string, string>(); // email → userId

function now() {
  return new Date().toISOString();
}

function nextId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createUser(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthUser> {
  if (emailIndex.has(email.toLowerCase())) {
    throw new Error("邮箱已被注册");
  }
  const id = nextId();
  const passwordHash = await bcrypt.hash(password, 12);
  const user: AuthUser = {
    id,
    email: email.toLowerCase(),
    displayName: displayName ?? email.split("@")[0],
    passwordHash,
    createdAt: now(),
  };
  users.set(id, user);
  emailIndex.set(user.email, id);
  return user;
}

export async function validateLogin(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const userId = emailIndex.get(email.toLowerCase());
  if (!userId) return null;
  const user = users.get(userId);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export function getUserById(userId: string): AuthUser | undefined {
  return users.get(userId);
}

// Seed a default demo user for development
export async function seedDemoUser(): Promise<AuthUser> {
  const existing = emailIndex.get("demo@example.com");
  if (existing) return users.get(existing)!;
  return createUser("demo@example.com", "demo123", "Demo");
}
