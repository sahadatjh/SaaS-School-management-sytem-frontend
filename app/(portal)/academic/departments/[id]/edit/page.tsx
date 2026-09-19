"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { DepartmentForm } from "@/components/academic/department-form";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import type { Department } from "@/lib/contracts";

export default function EditDepartmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDepartment() {
      try {
        const department = await portalApi.departments.get(id as string);
        setData(department);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load department.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
    loadDepartment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <AlertCircle className="size-8 text-rose-500" />
        <p className="text-sm font-medium text-slate-700">
          {error || "Department not found."}
        </p>
        <button
          onClick={() => router.push("/academic/departments")}
          className="text-sm font-semibold text-orange-600 hover:underline"
        >
          Return to Departments
        </button>
      </div>
    );
  }

  return <DepartmentForm initialData={data} isEdit />;
}
