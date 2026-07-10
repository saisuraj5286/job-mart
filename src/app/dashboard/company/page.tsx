import { type Metadata } from "next";

import { requireRole } from "~/server/auth/guards";
import { CompanyForm } from "~/components/company/company-form";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/server";

export const metadata: Metadata = {
  title: "Company profile",
};

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await requireRole("employer", "/dashboard/company");
  const [company, { next }] = await Promise.all([
    api.company.mine(),
    searchParams,
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {company ? "Company profile" : "Set up your company"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {company
            ? "This is what candidates see on your job posts."
            : "One quick step before you can post jobs — tell candidates who's hiring."}
        </p>
      </header>
      <Card>
        <CardContent className="p-6">
          <CompanyForm
            isNew={!company}
            nextPath={next?.startsWith("/") ? next : "/dashboard/jobs"}
            defaultValues={
              company
                ? {
                    name: company.name,
                    website: company.website ?? "",
                    location: company.location ?? "",
                    logoUrl: company.logoUrl ?? "",
                    about: company.about ?? "",
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
