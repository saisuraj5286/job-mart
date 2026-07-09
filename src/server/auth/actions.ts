"use server";

import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { lucia, validateRequest } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export interface ActionResult {
  error: string | null;
}

// hash parameters from the lucia tutorial (OWASP minimums)
const ARGON2_OPTS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(255),
  role: z.enum(["seeker", "employer"], {
    errorMap: () => ({ message: "Pick how you'll use JobMart" }),
  }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(255),
});

async function createSessionForUser(userId: string): Promise<void> {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}

export async function signup(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, role } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hash(password, ARGON2_OPTS);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning({ id: users.id });

  await createSessionForUser(user!.id);

  revalidatePath("/", "layout");
  redirect(role === "employer" ? "/dashboard/jobs" : "/jobs");
}

export async function login(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    // same message as a wrong password so valid emails can't be enumerated
    return { error: "Incorrect email or password" };
  }

  const validPassword = await verify(user.passwordHash, password, ARGON2_OPTS);
  if (!validPassword) {
    return { error: "Incorrect email or password" };
  }

  await createSessionForUser(user.id);

  revalidatePath("/", "layout");
  const redirectTo = formData.get("redirectTo");
  redirect(
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : user.role === "employer"
        ? "/dashboard/jobs"
        : "/jobs",
  );
}

export async function logout(): Promise<ActionResult> {
  const { session } = await validateRequest();
  if (!session) {
    return { error: "Unauthorized" };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  revalidatePath("/", "layout");
  redirect("/login");
}
