"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ReturnButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  async function handleReturn() {
    if (!confirm("Are you sure you want to initiate a return for this item?")) return;

    const res = await fetch(`/api/transactions/return/${transactionId}`, {
      method: "PATCH",
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Return request failed");
      return;
    }

    setDone(true);
    startTransition(() => router.refresh());
  }

  if (done) {
    return <span className="text-xs font-semibold text-violet-600">Return Requested ✓</span>;
  }

  return (
    <button
      onClick={handleReturn}
      disabled={isPending}
      className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
    >
      Initiate Return
    </button>
  );
}
