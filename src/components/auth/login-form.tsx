"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CircleAlertIcon, Loader2Icon } from "lucide-react";

import { login, type ActionResult } from "~/server/auth/actions";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const initialState: ActionResult = { error: null };

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your JobMart account</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <CircleAlertIcon className="size-4 shrink-0" />
              {state.error}
            </div>
          )}
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Sign in
          </Button>
          <p className="text-muted-foreground text-sm">
            New to JobMart?{" "}
            <Link
              href="/signup"
              className="text-foreground font-medium underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
