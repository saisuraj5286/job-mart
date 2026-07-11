"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from "~/lib/format";
import { JOB_TYPES, WORK_MODES } from "~/lib/job-filters";
import { jobInputSchema, type JobInput } from "~/lib/validators";
import { Badge } from "~/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD"] as const;

interface JobFormProps {
  mode: "create" | "edit";
  jobId?: string;
  defaultValues?: Partial<JobInput>;
}

export function JobForm({ mode, jobId, defaultValues }: JobFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");

  const form = useForm<JobInput>({
    resolver: zodResolver(jobInputSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      type: defaultValues?.type ?? "full_time",
      workMode: defaultValues?.workMode ?? "remote",
      location: defaultValues?.location ?? "",
      salaryMin: defaultValues?.salaryMin,
      salaryMax: defaultValues?.salaryMax,
      currency: defaultValues?.currency ?? "USD",
      tags: defaultValues?.tags ?? [],
      status: defaultValues?.status ?? "draft",
    },
  });

  const onSuccess = (message: string) => {
    toast.success(message);
    router.push("/dashboard/jobs");
    router.refresh();
  };
  const createMutation = api.job.create.useMutation({
    onSuccess: (job) =>
      onSuccess(
        job.status === "published"
          ? "Job published — it's live on the board!"
          : "Draft saved",
      ),
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = api.job.update.useMutation({
    onSuccess: () => onSuccess("Job updated"),
    onError: (err) => toast.error(err.message),
  });
  const isPending = createMutation.isPending || updateMutation.isPending;

  const submitWithStatus = (status: JobInput["status"]) => {
    form.setValue("status", status);
    void form.handleSubmit((values) => {
      if (mode === "edit" && jobId) {
        updateMutation.mutate({ ...values, id: jobId });
      } else {
        createMutation.mutate(values);
      }
    })();
  };

  const tags = form.watch("tags");
  const description = form.watch("description");

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/,+$/, "");
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagInput("");
      return;
    }
    if (tags.length >= 8) {
      toast.error("Up to 8 tags");
      return;
    }
    form.setValue("tags", [...tags, tag], { shouldValidate: true });
    setTagInput("");
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job title *</FormLabel>
              <FormControl>
                <Input placeholder="Senior Frontend Engineer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {JOB_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work mode</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WORK_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {WORK_MODE_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input placeholder="Remote (US) / Austin, TX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="salaryMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary min</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="120000"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : e.target.valueAsNumber,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salaryMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary max</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="160000"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : e.target.valueAsNumber,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Annual figures or hourly rates — leave blank if you&apos;d rather
            not disclose.
          </p>
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input
                  value={tagInput}
                  placeholder="react, typescript… (Enter to add)"
                  onChange={(e) => {
                    if (e.target.value.endsWith(",")) {
                      setTagInput(e.target.value);
                      addTag();
                    } else {
                      setTagInput(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                />
              </FormControl>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        aria-label={`Remove tag ${tag}`}
                        className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                        onClick={() =>
                          form.setValue(
                            "tags",
                            tags.filter((t) => t !== tag),
                          )
                        }
                      >
                        <XIcon className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormDescription>
                Skills and keywords candidates search for — up to 8.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (markdown) *</FormLabel>
              <Tabs defaultValue="write">
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write">
                  <FormControl>
                    <Textarea
                      rows={14}
                      placeholder={
                        "## About the role\n\nWhat will this person do?\n\n## What we're looking for\n\n- Requirement one\n- Requirement two"
                      }
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="prose prose-neutral dark:prose-invert min-h-40 max-w-none rounded-lg border px-4 py-3">
                    {description.trim() ? (
                      <ReactMarkdown>{description}</ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Nothing to preview yet — write some markdown first.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <FormDescription>
                Supports headings, lists, links, and emphasis.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap items-center gap-3">
          {mode === "create" ? (
            <>
              <Button
                type="button"
                onClick={() => submitWithStatus("published")}
                disabled={isPending}
              >
                {isPending && <Loader2Icon className="size-4 animate-spin" />}
                Publish job
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => submitWithStatus("draft")}
                disabled={isPending}
              >
                Save as draft
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => submitWithStatus(form.getValues("status"))}
              disabled={isPending}
            >
              {isPending && <Loader2Icon className="size-4 animate-spin" />}
              Save changes
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
