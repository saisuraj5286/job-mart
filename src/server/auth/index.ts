import "server-only";

import { cache } from "react";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia, type Session, type User } from "lucia";
import { cookies } from "next/headers";

import { db } from "~/server/db";
import { sessions, users } from "~/server/db/schema";

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    // Next.js can't extend cookies from server components, so no expiry —
    // Lucia treats it as a session cookie and extends it on validation
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      name: attributes.name,
      email: attributes.email,
      role: attributes.role,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  name: string;
  email: string;
  role: "seeker" | "employer";
}

export type AuthUser = User;
export type AuthSession = Session;

/**
 * Validate the session cookie of the current request. Cached per request so
 * pages, server actions, and the tRPC context share a single DB lookup.
 *
 * Per the Lucia docs: use in pages/actions/route handlers, not layout.tsx.
 */
export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
      return { user: null, session: null };
    }

    const result = await lucia.validateSession(sessionId);
    // next.js throws when you attempt to set a cookie when rendering a page
    try {
      if (result.session?.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookieStore.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookieStore.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {}
    return result;
  },
);
