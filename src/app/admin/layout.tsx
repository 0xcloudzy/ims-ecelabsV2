import { signOut } from "@/auth";
import { AdminNavigation } from "@/components/layout/admin-navigation";
import { requireAdminUser } from "@/lib/auth/current-user";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const navigationItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/equipment", label: "Equipment", icon: "equipment" },
  { href: "/admin/borrow-requests", label: "Borrow Requests", icon: "borrow" },
  { href: "/admin/return-requests", label: "Return Requests", icon: "return" },
  { href: "/admin/history", label: "History", icon: "history" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/logs", label: "Inventory Logs", icon: "logs" },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminUser();

  const labName =
    typeof user.assignedLab === "object" && user.assignedLab !== null
      ? (user.assignedLab as { name: string }).name
      : "Unassigned";

  return (
    <main className="min-h-screen bg-[#f3f7f7] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex h-20 items-center justify-between gap-5 px-2 sm:px-7">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
            <Image
              src="/brand/ecelabs-logo.png"
              alt="ECE Labs"
              width={384}
              height={132}
              priority
              className="h-10 w-64 shrink-0 sm:w-54"
            />
            <div className="hidden border-l border-slate-200 pl-5 lg:block">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#319f9a]">
                Inventory Management System
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">IIIT-Delhi ECE Labs</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#022742]">{labName}</p>
              <p className="text-xs text-slate-500">Lab Admin</p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-[#319f9a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#247f7b] focus:outline-none focus:ring-2 focus:ring-[#319f9a] focus:ring-offset-2"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-5rem)]">
        <aside className="hidden w-64 shrink-0 border-r border-[#1e3a5f] bg-[#022742] lg:block">
          <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col">
            <div className="mx-auto w-[90%] border-b border-white/10 p-3">
              <AdminNavigation items={[...navigationItems]} variant="sidebar" />
            </div>

            <div className="mx-auto mt-auto w-[90%] border-t border-white/10 p-3">
              <div className="rounded-md border border-white/15 bg-white/8 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white/18 text-base font-semibold">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-white/65">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <AdminNavigation
            items={[...navigationItems]}
            variant="mobile"
          />

          <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
