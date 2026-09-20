import Link from "next/link";
import { Card } from "@/components/ui/card";

const areas = [
  ["Academic years", "Create the school calendar first.", "/academic/years"],
  ["Departments", "Configure streams or departments.", "/academic/departments"],
  ["Shifts", "Add teaching shifts and their times.", "/academic/shifts"],
  ["Classes", "Create classes before sections or groups.", "/academic/classes"],
  ["Sections", "Add sections to active classes.", "/academic/sections"],
  ["Groups", "Add class groups such as Science or Humanities.", "/academic/groups"],
  ["Subjects", "Configure the subject catalogue.", "/academic/subjects"],
] as const;

export default function AcademicSetupPage() {
  return <div className="space-y-6"><div><p className="text-sm font-medium text-orange-600">Institution administration</p><h1 className="text-2xl font-bold text-slate-950">Academic setup</h1><p className="mt-1 text-slate-600">Configure your academic structure in order before student and teaching workflows begin.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{areas.map(([title, description, href], index) => <Link key={href} href={href}><Card className="h-full p-5 transition hover:border-orange-300 hover:shadow-sm"><p className="text-xs font-semibold text-orange-600">Step {index + 1}</p><h2 className="mt-2 font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></Card></Link>)}</div></div>;
}
