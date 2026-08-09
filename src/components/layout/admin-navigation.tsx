"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = {
  href: string;
  label: string;
  icon: "dashboard" | "equipment" | "borrow" | "return" | "history" | "students" | "logs";
};

type AdminNavigationProps = {
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

  if (icon === "borrow") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === "return") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 19V5M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === "history") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (icon === "students") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path d="M16 14a4 4 0 0 1 4 4v1H4v-1a4 4 0 0 1 4-4h8Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  // logs
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M5 4h14v16H5V4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 13h6M8 17h4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function AdminNavigation({ items, variant }: AdminNavigationProps) {
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
