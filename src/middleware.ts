export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api|_next|login|register|favicon.ico).*)"],
};
