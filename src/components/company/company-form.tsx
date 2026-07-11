"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { companyInputSchema, type CompanyInput } from "~/lib/validators";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

interface CompanyFormProps {
  defaultValues?: Partial<CompanyInput>;
  isNew: boolean;
  /** Where to go after a successful first-time setup. */
  nextPath?: string;
}

export function CompanyForm({
  defaultValues,
  isNew,
  nextPath,
}: CompanyFormProps) {
  const router = useRouter();

  const form = useForm<CompanyInput>({
    resolver: zodResolver(companyInputSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      website: defaultValues?.website ?? "",
      location: defaultValues?.location ?? "",
      logoUrl: defaultValues?.logoUrl ?? "",
      about: defaultValues?.about ?? "",
    },
  });

  const upsertMutation = api.company.upsert.useMutation({
    onSuccess: () => {
      toast.success(
        isNew ? "Company profile created!" : "Company profile saved",
        isNew ? { description: "You can post jobs now." } : undefined,
      );
      router.refresh();
      if (isNew && nextPath) router.push(nextPath);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}
        className="space-y-5"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name *</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://acme.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Headquarters</FormLabel>
                <FormControl>
                  <Input placeholder="Austin, TX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://acme.com/logo.png" {...field} />
              </FormControl>
              <FormDescription>
                A square image works best — shown on your job posts.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About the company</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What do you build? What's the team like?"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Shown on every job you post. {field.value?.length ?? 0}/2000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={upsertMutation.isPending}>
          {upsertMutation.isPending && (
            <Loader2Icon className="size-4 animate-spin" />
          )}
          {isNew ? "Create profile" : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
