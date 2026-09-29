"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StudentForm from "@/components/students/student-form";
import { portalApi } from "@/lib/portal-api";
import { toast } from "@/components/ui/sonner";
import type {
  EnrollmentHistory,
  Student,
  StudentPayload,
} from "@/lib/contracts";

/** Map the API Student + current_enrollment back into StudentPayload shape for the form. */
function studentToPayload(s: Student): StudentPayload {
  const e = s.current_enrollment;
  return {
    enrollment: {
      academic_year_id: e?.academic_year_id ?? "",
      class_id: e?.class_id ?? "",
      section_id: e?.section_id ?? "",
      shift_id: e?.shift_id ?? "",
      medium_id: e?.medium_id ?? "",
      roll_no: e?.roll_no ?? 0,
      group_id: e?.group_id ?? undefined,
      department_id: e?.department_id ?? undefined,
      registration_no: e?.registration_no ?? undefined,
    },
    name_english: s.name_english,
    name_bangla: s.name_bangla ?? "",
    date_of_birth: s.date_of_birth,
    gender: s.gender,
    status: s.status,
    blood_group: s.blood_group,
    nationality: s.nationality ?? "",
    religion: s.religion,
    admission_date: s.admission_date ?? "",
    photo_url: s.photo_url ?? "",
    prev_school_name: s.prev_school_name ?? "",
    prev_class: s.prev_class ?? "",
    prev_section: s.prev_section ?? "",
    prev_roll: s.prev_roll ?? "",
    prev_group: s.prev_group ?? "",
    prev_session: s.prev_session ?? "",
    tc_number: s.tc_number ?? "",
    present_village: s.present_village,
    present_thana: s.present_thana ?? "",
    present_district: s.present_district ?? "",
    present_division: s.present_division ?? "",
    present_post_code: s.present_post_code ?? "",
    permanent_village: s.permanent_village ?? "",
    permanent_thana: s.permanent_thana ?? "",
    permanent_district: s.permanent_district ?? "",
    permanent_division: s.permanent_division ?? "",
    permanent_post_code: s.permanent_post_code ?? "",
    is_same_address: s.is_same_address,
    primary_sms_number: s.primary_sms_number,
    secondary_sms_number: s.secondary_sms_number ?? "",
    sms_recipients: s.sms_recipients ?? [],
    parents_sms_number: s.parents_sms_number,
    father_name_bangla: s.father_name_bangla ?? "",
    father_name_english: s.father_name_english ?? "",
    father_occupation: s.father_occupation ?? "",
    father_occupation_details: s.father_occupation_details ?? "",
    father_mobile: s.father_mobile ?? "",
    father_nid: s.father_nid ?? "",
    father_annual_income: s.father_annual_income,
    mother_name_bangla: s.mother_name_bangla ?? "",
    mother_name_english: s.mother_name_english ?? "",
    mother_occupation: s.mother_occupation ?? "",
    mother_occupation_details: s.mother_occupation_details ?? "",
    mother_mobile: s.mother_mobile ?? "",
    mother_nid: s.mother_nid ?? "",
    mother_annual_income: s.mother_annual_income,
    local_guardian_name: s.local_guardian_name ?? "",
    local_guardian_contact: s.local_guardian_contact ?? "",
    remarks: s.remarks ?? "",
  };
}

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EnrollmentHistory[]>([]);

  useEffect(() => {
    portalApi.students
      .get(id)
      .then((s) => setStudent(s))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load student.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    portalApi.studentPromotions
      .history(id, new URLSearchParams({ page: "1", limit: "20" }))
      .then((result) => setHistory(result.items))
      .catch(() => undefined);
  }, [id]);

  async function handleUpdate(payload: StudentPayload) {
    const profile = { ...payload };
    Reflect.deleteProperty(profile, "enrollment");
    await portalApi.students.update(id, profile);
    toast.success("Student updated successfully.");
    router.push("/academic/students");
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-red-600">{error ?? "Student not found."}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/academic/students">← Back to Students</Link>
        </Button>
      </div>
    );
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
        <div>
          <h1 className="text-base font-bold text-slate-900">Edit Student</h1>
          <p className="text-xs text-slate-500">
            {student.name_english} — {student.student_id}
          </p>
        </div>
      </div>

      <StudentForm
        initialData={studentToPayload(student)}
        onSubmit={handleUpdate}
        submitLabel="Update Student"
        showAcademicInformation={false}
      />
      <Card className="space-y-2 p-4">
        <div>
          <h2 className="font-semibold text-slate-900">Enrollment history</h2>
          <p className="text-xs text-slate-500">
            Academic placement changes are recorded through promotion.
          </p>
        </div>
        {history.length ? (
          history.map((enrollment) => (
            <div
              key={enrollment.id}
              className="border-t pt-2 text-sm text-slate-700"
            >
              <span className="font-medium">{enrollment.status}</span>
              <span className="ml-2">Roll: {enrollment.roll_no ?? "—"}</span>
              {enrollment.end_reason && (
                <span className="ml-2 text-slate-500">
                  {enrollment.end_reason}
                </span>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">
            No enrollment history available.
          </p>
        )}
      </Card>
    </div>
  );
}
