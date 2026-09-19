"use client";
import * as Dialog from "@radix-ui/react-dialog";
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export function SheetContent({ children }: { children: React.ReactNode }) { return <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/45" /><Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl focus:outline-none">{children}</Dialog.Content></Dialog.Portal>; }
