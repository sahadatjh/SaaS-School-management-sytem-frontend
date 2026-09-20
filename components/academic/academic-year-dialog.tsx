"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AcademicYearForm } from "@/components/academic/academic-year-form";
import type { AcademicYear } from "@/lib/contracts";

interface AcademicYearDialogProps {
  open: boolean;
  year?: AcademicYear;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AcademicYearDialog({
  open,
  year,
  onOpenChange,
  onSaved,
}: AcademicYearDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl focus:outline-none animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-950">
                {year ? `Edit Academic Year: ${year.name}` : "New Academic Year"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-slate-500">
                {year ? "Update the academic session details." : "Create an academic session for your institution."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close academic year dialog"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <AcademicYearForm
            key={year?.id ?? "new"}
            initialData={year}
            isEdit={Boolean(year)}
            onSaved={onSaved}
            onCancel={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}