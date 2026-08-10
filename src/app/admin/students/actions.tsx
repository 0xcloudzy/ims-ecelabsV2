"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  studentId: string;
  isCleared: boolean;
  activeBorrows: number;
};

export function DuesActionButtons({ studentId, isCleared, activeBorrows }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "clear" | "revoke") {
    if (action === "clear" && activeBorrows > 0) {
      alert("Cannot clear dues. The student still has active transactions.");
      return;
    }

    const confirmMsg = action === "clear"
      ? "Grant 'No Dues' clearance to this student?"
      : "Revoke 'No Dues' clearance from this student?";
      
    if (!confirm(confirmMsg)) return;

    setError(null);
    const res = await fetch(`/api/students/${studentId}/dues`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Action failed");
      return;
    }

    startTransition(() => router.refresh());
  }

  if (error) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-red-600">{error}</span>
        <button onClick={() => setError(null)} className="text-xs text-slate-500 underline">Dismiss</button>
      </div>
    );
  }

  if (isCleared) {
    return (
      <button
        onClick={() => handleAction("revoke")}
        disabled={isPending}
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        Revoke
      </button>
    );
  }

  return (
    <button
      onClick={() => handleAction("clear")}
      disabled={isPending || activeBorrows > 0}
      title={activeBorrows > 0 ? "Cannot clear dues: student has active items" : ""}
      className="rounded-md bg-[#022742] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#064463] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50"
    >
      Clear Dues
    </button>
  );
}
