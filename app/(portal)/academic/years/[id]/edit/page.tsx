"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AcademicYearForm } from "@/components/academic/academic-year-form";
import { portalApi } from "@/lib/portal-api";
import type { AcademicYear } from "@/lib/contracts";

export default function EditAcademicYearPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [year, setYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    portalApi.academicYears
      .get(id)
      .then((data) => setYear(data))
      .catch((err: unknown) => {
        const msg =
          err instanceof Error
            ? err.message
            : "Academic year not found or could not be loaded.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-2.5">
          <Skeleton className="h-4 w-48" />
        </div>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-end gap-3 pt-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !year) {
    return (
      <div className="w-full">
        <Card className="p-8 text-center">
          <AlertCircle className="size-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">
            Unable to edit academic year
          </h2>
          <p className="mt-1 text-sm text-slate-500">{error ?? "Record not found."}</p>
          <Button size="sm" variant="outline" asChild className="mt-4">
            <Link href="/academic/years">
              <ArrowLeft className="mr-1.5 size-3.5" />
              Return to Academic Years
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return <AcademicYearForm initialData={year} isEdit />;
}
