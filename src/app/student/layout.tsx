import { signOut } from "@/auth";
import { StudentNavigation } from "@/components/layout/student-navigation";
import { requireStudentUser } from "@/lib/auth/current-user";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const navigationItems = [
  { href: "/student", label: "Dashboard", icon: "dashboard" },
  { href: "/student/equipment", label: "Equipment List", icon: "equipment" },
  { href: "/student/requests", label: "Request Status", icon: "requests" },
] as const;

const profileNavigationItem = [
  { href: "/student/profile", label: "Profile", icon: "profile" },
] as const;

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await requireStudentUser();

  return (
    <main className="min-h-screen bg-[#f3f7f7] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex h-20 items-center justify-between gap-5 px-2 sm:px-7">
          <Link href="/student" className="flex min-w-0 items-center gap-2">
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
      </header>

      <div className="flex min-h-[calc(100vh-5rem)]">
        <aside className="hidden w-64 shrink-0 border-r border-[#1e3a5f] bg-[#022742] lg:block">
          <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col">
            <div className="mx-auto w-[90%] border-b border-white/10 p-3">
              <StudentNavigation items={[...navigationItems]} variant="sidebar" />
            </div>

            <div className="mx-auto mt-auto w-[90%] border-t border-white/10 p-3">
              <StudentNavigation items={[...profileNavigationItem]} variant="sidebar" />
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <StudentNavigation
            items={[...navigationItems, ...profileNavigationItem]}
            variant="mobile"
          />

          <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}