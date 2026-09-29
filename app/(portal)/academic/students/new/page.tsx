"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import StudentForm, { EMPTY_STUDENT_PAYLOAD } from "@/components/students/student-form";
import { usePortal } from "@/components/portal-context";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import type { StudentPayload } from "@/lib/contracts";

export default function NewStudentPage() {
  const { profile } = usePortal();
  if (!profile) return null;
  return <NewStudentFormPage storagePrefix={`edu_student_form_${profile.institution.id}_${profile.user.id}`} />;
}

function restoreForm(draftStorageKey: string, academicStorageKey: string): StudentPayload {
  try {
    const draft = localStorage.getItem(draftStorageKey);
    const academic = localStorage.getItem(academicStorageKey);
    if (draft) {
      const parsed = JSON.parse(draft) as StudentPayload;
      return { ...EMPTY_STUDENT_PAYLOAD, ...parsed, enrollment: { ...EMPTY_STUDENT_PAYLOAD.enrollment, ...parsed.enrollment } };
    }
    if (academic) {
      return { ...EMPTY_STUDENT_PAYLOAD, enrollment: { ...EMPTY_STUDENT_PAYLOAD.enrollment, ...JSON.parse(academic) } };
    }
  } catch (e) {
    console.error("Failed to restore student form", e);
  }
  return EMPTY_STUDENT_PAYLOAD;
}

function NewStudentFormPage({ storagePrefix }: { storagePrefix: string }) {
  const router = useRouter();
  const draftStorageKey = `${storagePrefix}_draft`;
  const academicStorageKey = `${storagePrefix}_academic`;
  const [initialData] = useState<StudentPayload>(() => restoreForm(draftStorageKey, academicStorageKey));

  async function handleCreate(payload: StudentPayload, action: "save" | "save-and-add") {
    await portalApi.students.create(payload);
    try {
      localStorage.removeItem(draftStorageKey);
      localStorage.setItem(academicStorageKey, JSON.stringify(payload.enrollment));
    } catch {
      // A successful admission should not depend on browser storage.
    }
    if (action === "save-and-add") {
      toast.success("Student admitted successfully. Add another one.");
    } else {
      toast.success("Student admitted successfully.");
      router.push("/academic/students");
    }
  }

  function handleReset() {
    try {
      localStorage.removeItem(draftStorageKey);
      localStorage.removeItem(academicStorageKey);
      localStorage.removeItem("edu_last_academic_selection");
    } catch {
      // The visible form still resets if storage is unavailable.
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      {/* Page header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href="/academic/students">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-base font-bold text-slate-900">Add New Student</h1>
      </div>

      <StudentForm
        initialData={initialData}
        onSubmit={handleCreate}
        showSaveAndAdd
        draftStorageKey={draftStorageKey}
        onReset={handleReset}
        submitLabel="Save Student"
      />
    </div>
  );
}
