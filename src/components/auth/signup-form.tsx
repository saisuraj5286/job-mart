"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  BriefcaseBusinessIcon,
  CircleAlertIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react";

import { signup, type ActionResult } from "~/server/auth/actions";
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

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Join JobMart to find your next role or your next hire
        </CardDescription>
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
          <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">
              I want to…
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="seeker"
                  defaultChecked
                  className="peer sr-only"
                />
                <span className="peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-muted/50 flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-4 text-center transition-colors">
                  <SearchIcon className="size-5" />
                  <span className="text-sm font-medium">Find work</span>
                  <span className="text-muted-foreground text-xs">
                    Browse and apply to jobs
                  </span>
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="employer"
                  className="peer sr-only"
                />
                <span className="peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-muted/50 flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-4 text-center transition-colors">
                  <BriefcaseBusinessIcon className="size-5" />
                  <span className="text-sm font-medium">Hire talent</span>
                  <span className="text-muted-foreground text-xs">
                    Post jobs and review applicants
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ada Lovelace"
              autoComplete="name"
              required
            />
          </div>
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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Create account
          </Button>
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
