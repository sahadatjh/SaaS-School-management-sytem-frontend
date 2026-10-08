"use client";

import type { FormEvent, ReactNode } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  AdmissionOptions,
  AdmissionSetup,
  AdmissionSetupErrors,
} from "@/lib/student-admission-setup";

type AdmissionSetupField = keyof AdmissionSetup;

type StudentAdmissionSetupProps = {
  value: AdmissionSetup;
  options: AdmissionOptions;
  errors: AdmissionSetupErrors;
  dependentOptionsLoading?: boolean;
  dependentOptionsError?: string;
  nextDisabled?: boolean;
  onChange: (field: AdmissionSetupField, value: string) => void;
  onSubmit: () => void;
};

function SetupField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

function setupSelectClass(error?: string) {
  return `h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 ${
    error
      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-orange-500 focus:ring-orange-100"
  }`;
}

export function StudentAdmissionSetup({
  value,
  options,
  errors,
  dependentOptionsLoading = false,
  dependentOptionsError,
  nextDisabled = false,
  onChange,
  onSubmit,
}: StudentAdmissionSetupProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Student admission setup
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose the academic context once. It will be reused for the next
          student admitted in this institution.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SetupField
            id="admission-academic-year"
            label="Academic Year"
            required
            error={errors.academic_year_id}
          >
            <select
              id="admission-academic-year"
              value={value.academic_year_id}
              onChange={(event) =>
                onChange("academic_year_id", event.target.value)
              }
              aria-invalid={Boolean(errors.academic_year_id)}
              aria-describedby={
                errors.academic_year_id
                  ? "admission-academic-year-error"
                  : undefined
              }
              className={setupSelectClass(errors.academic_year_id)}
            >
              <option value="">Select academic year</option>
              {options.academicYears.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </SetupField>

          <SetupField
            id="admission-medium"
            label="Medium / Version"
            required
            error={errors.medium_id}
          >
            <select
              id="admission-medium"
              value={value.medium_id}
              onChange={(event) => onChange("medium_id", event.target.value)}
              aria-invalid={Boolean(errors.medium_id)}
              aria-describedby={
                errors.medium_id ? "admission-medium-error" : undefined
              }
              className={setupSelectClass(errors.medium_id)}
            >
              <option value="">Select medium</option>
              {options.mediums.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </SetupField>

          <SetupField
            id="admission-shift"
            label="Shift"
            required
            error={errors.shift_id}
          >
            <select
              id="admission-shift"
              value={value.shift_id}
              onChange={(event) => onChange("shift_id", event.target.value)}
              aria-invalid={Boolean(errors.shift_id)}
              aria-describedby={
                errors.shift_id ? "admission-shift-error" : undefined
              }
              className={setupSelectClass(errors.shift_id)}
            >
              <option value="">Select shift</option>
              {options.shifts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </SetupField>

          <SetupField
            id="admission-class"
            label="Class"
            required
            error={errors.class_id}
          >
            <select
              id="admission-class"
              value={value.class_id}
              onChange={(event) => onChange("class_id", event.target.value)}
              aria-invalid={Boolean(errors.class_id)}
              aria-describedby={
                errors.class_id ? "admission-class-error" : undefined
              }
              className={setupSelectClass(errors.class_id)}
            >
              <option value="">Select class</option>
              {options.classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </SetupField>

          <SetupField
            id="admission-group"
            label="Group"
            error={errors.group_id}
          >
            <select
              id="admission-group"
              value={value.group_id}
              disabled={!value.class_id || dependentOptionsLoading}
              onChange={(event) => onChange("group_id", event.target.value)}
              aria-invalid={Boolean(errors.group_id)}
              aria-describedby={
                errors.group_id ? "admission-group-error" : undefined
              }
              className={`${setupSelectClass(errors.group_id)} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
            >
              <option value="">No group</option>
              {options.groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </SetupField>

          <SetupField
            id="admission-section"
            label="Section"
            error={errors.section_id}
          >
            <select
              id="admission-section"
              value={value.section_id}
              disabled={!value.class_id || dependentOptionsLoading}
              onChange={(event) => onChange("section_id", event.target.value)}
              aria-invalid={Boolean(errors.section_id)}
              aria-describedby={
                errors.section_id ? "admission-section-error" : undefined
              }
              className={`${setupSelectClass(errors.section_id)} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
            >
              <option value="">No section</option>
              {options.sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </SetupField>

          <SetupField
            id="admission-gender"
            label="Gender"
            error={errors.gender}
          >
            <select
              id="admission-gender"
              value={value.gender}
              onChange={(event) => onChange("gender", event.target.value)}
              aria-invalid={Boolean(errors.gender)}
              aria-describedby={
                errors.gender ? "admission-gender-error" : undefined
              }
              className={setupSelectClass(errors.gender)}
            >
              <option value="">No default gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </SetupField>

          <SetupField
            id="admission-nationality"
            label="Nationality"
            error={errors.nationality}
          >
            <Input
              id="admission-nationality"
              value={value.nationality}
              onChange={(event) => onChange("nationality", event.target.value)}
              aria-invalid={Boolean(errors.nationality)}
              aria-describedby={
                errors.nationality ? "admission-nationality-error" : undefined
              }
              placeholder="Bangladeshi"
              className="h-10 text-sm"
            />
          </SetupField>
        </div>

        {dependentOptionsLoading && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="size-3.5 animate-spin" />
            Loading groups and sections…
          </p>
        )}
        {dependentOptionsError && (
          <p role="alert" className="text-xs text-rose-600">
            {dependentOptionsError}
          </p>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" disabled={nextDisabled} className="gap-2">
            Go to Next
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}
