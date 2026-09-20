"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { DepartmentForm } from "@/components/academic/department-form";
import type { Department } from "@/lib/contracts";

interface DepartmentDialogProps {
  open: boolean;
  department?: Department;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function DepartmentDialog({
  open,
  department,
  onOpenChange,
  onSaved,
}: DepartmentDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-xs animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl focus:outline-none animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <Dialog.Title className="text-base font-bold text-slate-950">
              {department ? `Edit Department: ${department.name}` : "New Department"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close department dialog"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <DepartmentForm
            key={department?.id ?? "new"}
            initialData={department}
            isEdit={Boolean(department)}
            onSaved={onSaved}
            onCancel={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
