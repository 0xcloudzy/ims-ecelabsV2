"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  label: string;
  icon: "dashboard" | "equipment" | "requests" | "profile";
};

type StudentNavigationProps = {
  items: NavigationItem[];
  variant: "sidebar" | "mobile";
};

function NavIcon({ icon }: { icon: NavigationItem["icon"] }) {
  if (icon === "dashboard") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M4 13h6V4H4v9Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 20h6V4h-6v16Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 20h6v-3H4v3Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === "equipment") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M6 7h12v10H6V7Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 12h6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === "requests") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M7 4h10v16H7V4Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 9h4M10 13h4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function StudentNavigation({ items, variant }: StudentNavigationProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#e8edf4] text-[#1e3a5f]"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-12 items-center gap-3 rounded-md px-4 text-sm font-semibold transition ${
              isActive
                ? "bg-white/16 text-white shadow-sm"
                : "text-white/86 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white/12 text-white">
              <NavIcon icon={item.icon} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
