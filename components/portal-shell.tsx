"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  PieChart,
  Search,
  Settings,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePortal } from "@/components/portal-context";
import { portalApi } from "@/lib/portal-api";
import { cn } from "@/lib/utils";

export type NavItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  href?: string;
  capability?: string;
  children?: NavItem[];
};

export const navigationItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    capability: "academic.read",
  },
  {
    id: "student-management",
    label: "Student Management",
    icon: Users,
    children: [
      { id: "all-students", label: "All Students", href: "/students" },
      { id: "add-student", label: "Add Student", href: "/students/new" },
      { id: "admission", label: "Admission", href: "/students/admission" },
      { id: "student-promotion", label: "Student Promotion", href: "/students/promotion" },
      {
        id: "certificates",
        label: "Certificates",
        children: [
          { id: "transfer-cert", label: "Transfer Certificate", href: "/students/certificates/transfer" },
          { id: "character-cert", label: "Character Certificate", href: "/students/certificates/character" },
          { id: "appreciation-cert", label: "Appreciation Certificate", href: "/students/certificates/appreciation" },
        ],
      },
      { id: "id-cards", label: "ID Cards", href: "/students/id-cards" },
    ],
  },
  {
    id: "academic-management",
    label: "Academic Management",
    icon: BookOpen,
    capability: "academic.read",
    children: [
      { id: "academic-years", label: "Academic Years", href: "/academic/years" },
      { id: "classes", label: "Classes", href: "/academic/classes" },
      { id: "departments", label: "Departments", href: "/academic/departments" },
      { id: "groups", label: "Groups", href: "/academic/groups" },
      { id: "sections", label: "Sections", href: "/academic/sections" },
      { id: "shifts", label: "Shifts", href: "/academic/shifts" },
      { id: "subjects", label: "Subjects", href: "/academic/subjects" },
      { id: "teacher-assignments", label: "Teacher Assignments", href: "/academic/teacher-assignments" },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    children: [
      { id: "student-attendance", label: "Student Attendance", href: "/attendance/students" },
      { id: "teacher-attendance", label: "Teacher Attendance", href: "/attendance/teachers" },
      { id: "attendance-reports", label: "Attendance Reports", href: "/attendance/reports" },
    ],
  },
  {
    id: "exam-management",
    label: "Exam Management",
    icon: Award,
    children: [
      { id: "exam-schedules", label: "Exam Schedules", href: "/exams/schedules" },
      { id: "admit-cards", label: "Admit Cards", href: "/exams/admit-cards" },
      { id: "seat-plans", label: "Seat Plans", href: "/exams/seat-plans" },
    ],
  },
  {
    id: "result-management",
    label: "Result Management",
    icon: BarChart3,
    children: [
      { id: "marks-entry", label: "Marks Entry", href: "/results/marks-entry" },
      { id: "tabulation-sheet", label: "Tabulation Sheet", href: "/results/tabulation" },
      { id: "publish-results", label: "Publish Results", href: "/results/publish" },
    ],
  },
  {
    id: "fees-accounts",
    label: "Fees & Accounts",
    icon: Wallet,
    children: [
      { id: "fee-structures", label: "Fee Structures", href: "/fees/structures" },
      { id: "fee-collection", label: "Fee Collection", href: "/fees/collect" },
      { id: "invoices", label: "Invoices", href: "/fees/invoices" },
      { id: "due-reports", label: "Due Reports", href: "/fees/due" },
    ],
  },
  {
    id: "teacher-management",
    label: "Teacher Management",
    icon: GraduationCap,
    children: [
      { id: "all-teachers", label: "All Teachers", href: "/teachers" },
      { id: "add-teacher", label: "Add Teacher", href: "/teachers/new" },
      { id: "teacher-routines", label: "Teacher Routines", href: "/teachers/routines" },
    ],
  },
  {
    id: "employee-management",
    label: "Employee Management",
    icon: User,
    children: [
      { id: "all-employees", label: "All Employees", href: "/employees" },
      { id: "designations", label: "Designations", href: "/employees/designations" },
      { id: "leave-management", label: "Leave Management", href: "/employees/leaves" },
    ],
  },
  {
    id: "guardian-management",
    label: "Guardian Management",
    icon: HeartHandshake,
    children: [
      { id: "all-guardians", label: "All Guardians", href: "/guardians" },
      { id: "link-guardians", label: "Guardian Linking", href: "/guardians/link" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: Bell,
    children: [
      { id: "notice-board", label: "Notice Board", href: "/communication/notices" },
      { id: "send-sms", label: "SMS Broadcast", href: "/communication/sms" },
      { id: "email-templates", label: "Email Notification", href: "/communication/emails" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: PieChart,
    children: [
      { id: "academic-reports", label: "Academic Reports", href: "/reports/academic" },
      { id: "attendance-summary", label: "Attendance Summary", href: "/reports/attendance" },
      { id: "financial-reports", label: "Financial Reports", href: "/reports/financial" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    children: [
      { id: "institution-profile", label: "Institution Profile", href: "/settings/institution" },
      { id: "roles-permissions", label: "Roles & Permissions", href: "/settings/roles" },
      { id: "system-logs", label: "System Logs", href: "/settings/logs" },
    ],
  },
];

function isRouteActive(href?: string, currentPath = ""): boolean {
  if (!href) return false;
  if (href === "/dashboard") {
    return currentPath === "/dashboard";
  }
  return currentPath === href || currentPath.startsWith(href + "/");
}

function hasActiveChild(item: NavItem, currentPath = ""): boolean {
  if (item.href && isRouteActive(item.href, currentPath)) return true;
  if (item.children) {
    return item.children.some((child) => hasActiveChild(child, currentPath));
  }
  return false;
}

function Navigation({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { profile } = usePortal();
  const pathname = usePathname();

  // Strict single-open accordion: only one menu folder can be open at a time
  const [openMenuId, setOpenMenuId] = useState<string | null>(() => {
    if (pathname === "/dashboard") return null;
    const activeItem = navigationItems.find(
      (item) =>
        item.children && item.children.length > 0 && hasActiveChild(item, pathname),
    );
    return activeItem ? activeItem.id : null;
  });

  const [openSubMenuId, setOpenSubMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/dashboard") {
      setOpenMenuId(null);
      setOpenSubMenuId(null);
      return;
    }

    const activeItem = navigationItems.find(
      (item) =>
        item.children && item.children.length > 0 && hasActiveChild(item, pathname),
    );
    if (activeItem) {
      setOpenMenuId(activeItem.id);
    }
  }, [pathname]);

  const toggleTopLevel = (id: string) => {
    setOpenMenuId((current) => {
      const next = current === id ? null : id;
      setOpenSubMenuId(null);
      return next;
    });
  };

  const toggleSubLevel = (id: string) => {
    setOpenSubMenuId((current) => (current === id ? null : id));
  };

  const permissions = new Set(profile?.permissions ?? []);

  const isPermitted = (item: NavItem): boolean => {
    if (!item.capability) return true;
    return permissions.has(item.capability);
  };

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigationItems.map((item) => {
        if (!isPermitted(item)) return null;

        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openMenuId === item.id;
        const active = isRouteActive(item.href, pathname);
        const childActive = hasActiveChild(item, pathname);
        const isHeaderActive = active || childActive || isOpen;

        // Top level direct link (e.g. Dashboard)
        if (!hasChildren && item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#FFF4EE] text-[#EA580C] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                collapsed && "justify-center px-2",
              )}
              aria-current={active ? "page" : undefined}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-colors",
                    active ? "text-[#EA580C]" : "text-slate-500",
                  )}
                  aria-hidden="true"
                />
              )}
              <span className={cn("truncate", collapsed && "sr-only")}>
                {item.label}
              </span>
            </Link>
          );
        }

        // Top level expandable folder (e.g. Student Management, Academic Management, etc.)
        return (
          <div key={item.id} className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggleTopLevel(item.id)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors text-left",
                isHeaderActive
                  ? "bg-[#FFF4EE] text-[#EA580C] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                collapsed && "justify-center px-2",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      isHeaderActive ? "text-[#EA580C]" : "text-slate-500",
                    )}
                    aria-hidden="true"
                  />
                )}
                <span className={cn("truncate", collapsed && "sr-only")}>
                  {item.label}
                </span>
              </div>
              {!collapsed && (
                isOpen ? (
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      isHeaderActive ? "text-[#EA580C]" : "text-slate-400",
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronRight
                    className="size-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                )
              )}
            </button>

            {/* Level 2 Submenu */}
            {isOpen && !collapsed && (
              <div className="ml-6 pl-3.5 border-l border-slate-200/90 py-1 space-y-0.5 mt-0.5">
                {item.children?.map((subItem) => {
                  if (!isPermitted(subItem)) return null;

                  const hasSubChildren =
                    subItem.children && subItem.children.length > 0;

                  // Level 2 item that is also expandable (e.g. Certificates)
                  if (hasSubChildren) {
                    const isSubOpen = openSubMenuId === subItem.id;
                    const isSubActive = hasActiveChild(subItem, pathname);

                    return (
                      <div key={subItem.id} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => toggleSubLevel(subItem.id)}
                          aria-expanded={isSubOpen}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors text-left",
                            isSubActive
                              ? "text-[#EA580C] font-semibold"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                          )}
                        >
                          <span className="truncate">{subItem.label}</span>
                          {isSubOpen ? (
                            <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {/* Level 3 Nested Submenu */}
                        {isSubOpen && (
                          <div className="ml-3 pl-3 border-l border-slate-200/80 py-1 space-y-0.5">
                            {subItem.children?.map((nested) => {
                              const nestedActive = isRouteActive(
                                nested.href,
                                pathname,
                              );
                              return (
                                <Link
                                  key={nested.id}
                                  href={nested.href || "#"}
                                  onClick={onNavigate}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                                    nestedActive
                                      ? "text-[#EA580C] font-semibold"
                                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
                                  )}
                                  aria-current={
                                    nestedActive ? "page" : undefined
                                  }
                                >
                                  {nestedActive && (
                                    <span className="w-1 h-3.5 bg-orange-600 rounded-full shrink-0" />
                                  )}
                                  <span className="truncate">{nested.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Normal Level 2 Link Item (e.g. All Students, Add Student, Academic Years, etc.)
                  const subActive = isRouteActive(subItem.href, pathname);

                  return (
                    <Link
                      key={subItem.id}
                      href={subItem.href || "#"}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors group",
                        subActive
                          ? "text-[#EA580C] font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                      )}
                      aria-current={subActive ? "page" : undefined}
                    >
                      {subActive && (
                        <span className="w-1 h-4 bg-orange-600 rounded-full shrink-0" />
                      )}
                      <span className="truncate">{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = usePortal();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await portalApi.logout();
    router.replace("/login");
  }

  if (loading || !profile) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-600">
        Loading your portal…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden border-r border-slate-200/80 bg-white lg:flex lg:flex-col z-30 transition-all duration-200",
          collapsed ? "w-20" : "w-72",
        )}
      >
        {/* Top Header / Branding */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 shrink-0">
          <div
            className={cn(
              "flex items-center gap-2.5 min-w-0",
              collapsed && "sr-only",
            )}
          >
            <div className="size-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              E
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight truncate">
              Edu Soft
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            className="text-slate-500 hover:text-slate-800"
          >
            <Menu className="size-5" />
          </Button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <Navigation collapsed={collapsed} />
        </div>

        {/* Bottom Help Center Card */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:bg-slate-100/80 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <CircleHelp className="size-5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    Need help?
                  </p>
                  <p className="text-xs text-slate-400 leading-tight mt-0.5 truncate">
                    Visit our help center
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-200",
          collapsed ? "lg:ml-20" : "lg:ml-72",
        )}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center justify-between border-b px-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                      E
                    </div>
                    <span className="font-bold text-slate-900 text-lg tracking-tight">
                      Edu Soft
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-3">
                  <Navigation onNavigate={() => setMobileOpen(false)} />
                </div>
                <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <CircleHelp className="size-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">
                          Need help?
                        </p>
                        <p className="text-xs text-slate-400 leading-tight mt-0.5">
                          Visit our help center
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">
              {profile.institution.name}
            </p>
            <p className="text-xs text-slate-500">
              {profile.institution.timezone}
            </p>
          </div>

          <label className="relative hidden max-w-sm flex-1 md:block">
            <span className="sr-only">Search portal</span>
            <Search
              className="absolute left-3 top-3 size-4 text-slate-400"
              aria-hidden="true"
            />
            <Input placeholder="Search (coming soon)" disabled className="pl-9" />
          </label>

          <Button variant="ghost" aria-label="Notifications">
            <Bell className="size-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Open user menu">
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-50 mt-2 rounded-lg border bg-white p-1 shadow-lg">
              <DropdownMenuItem
                onSelect={signOut}
                className="cursor-pointer rounded px-3 py-2 text-sm outline-none hover:bg-slate-100"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
