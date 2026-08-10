"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type EquipmentItem = {
  _id: string;
  name: string;
  quantityAvailable: number;
  lab?: { code: string };
};

export function BorrowButton({ item, isCleared }: { item: EquipmentItem; isCleared?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [requestedDays, setRequestedDays] = useState("7");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/transactions/borrow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipmentId: item._id,
        quantity: Number(quantity),
        requestedDays: Number(requestedDays),
        comment: comment || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    setOpen(false);
    startTransition(() => router.refresh());
  }

  if (item.quantityAvailable === 0) {
    return (
      <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
        Out of Stock
      </span>
    );
  }

  if (isCleared) {
    return (
      <button
        type="button"
        disabled
        title="Cannot request: No Dues Clearance granted"
        className="rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed"
      >
        Request
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null); setQuantity("1"); setRequestedDays("7"); setComment(""); }}
        disabled={isPending}
        className="rounded-md bg-[#022742] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#064463] disabled:opacity-50"
      >
        Request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#022742]">Borrow Request</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 rounded-md bg-[#e8edf4] p-3">
              <p className="text-sm font-semibold text-[#022742]">{item.name}</p>
              <p className="text-xs text-slate-500">Lab {item.lab?.code} · {item.quantityAvailable} available</p>
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={item.quantityAvailable}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#319f9a] focus:ring-1 focus:ring-[#319f9a]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Days Needed *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={180}
                    value={requestedDays}
                    onChange={(e) => setRequestedDays(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#319f9a] focus:ring-1 focus:ring-[#319f9a]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#319f9a] focus:ring-1 focus:ring-[#319f9a]"
                  placeholder="Reason for borrowing..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="rounded-md bg-[#022742] px-5 py-2 text-sm font-semibold text-white hover:bg-[#064463]">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
