"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  id: string;
  type: "borrow" | "return";
  status: string;
};

export function AdminTransactionActions({ id, type, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [openModal, setOpenModal] = useState<"pickup" | "dropoff" | null>(null);
  const [timeSlot, setTimeSlot] = useState("");

  const minDateTime = new Date().toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm

  async function executeAction(action: string, payloadTimeSlot?: string) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, timeSlot: payloadTimeSlot }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Action failed");
      return;
    }

    setOpenModal(null);
    setDone(true);
    startTransition(() => router.refresh());
  }

  async function handleConfirmAction(action: string, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    await executeAction(action);
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!timeSlot) return;
    
    if (openModal === "pickup") {
      await executeAction("approve_for_pickup", timeSlot);
    } else if (openModal === "dropoff") {
      await executeAction("approve_for_dropoff", timeSlot);
    }
  }

  if (done) {
    return <span className="text-xs font-semibold text-emerald-600">Done ✓</span>;
  }

  const renderModal = (title: string, label: string) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#022742]">{title}</h2>
        <form onSubmit={handleModalSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{label} *</label>
            <input
              type="datetime-local"
              required
              min={minDateTime}
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#319f9a] focus:ring-1 focus:ring-[#319f9a]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setOpenModal(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (type === "borrow") {
    if (status === "requested") {
      return (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setOpenModal("pickup")}
              disabled={isPending}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleConfirmAction("decline", "Decline this borrow request?")}
              disabled={isPending}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
          {openModal === "pickup" && renderModal("Schedule Pickup", "Pickup Date & Time")}
        </>
      );
    }

    if (status === "approved_for_pickup") {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleConfirmAction("issue", "Mark this item as physically issued to the student?")}
            disabled={isPending}
            className="rounded-md bg-[#022742] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#064463] disabled:opacity-50"
          >
            Mark Issued
          </button>
          <button
            onClick={() => handleConfirmAction("decline", "Cancel this request and restore stock?")}
            disabled={isPending}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      );
    }
  }

  if (type === "return") {
    if (status === "return_requested") {
      return (
        <>
          <button
            onClick={() => setOpenModal("dropoff")}
            disabled={isPending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Approve Dropoff
          </button>
          {openModal === "dropoff" && renderModal("Schedule Dropoff", "Dropoff Date & Time")}
        </>
      );
    }

    if (status === "approved_for_dropoff") {
      return (
        <button
          onClick={() => handleConfirmAction("complete_return", "Confirm item was returned and restore stock?")}
          disabled={isPending}
          className="rounded-md bg-[#022742] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#064463] disabled:opacity-50"
        >
          Confirm Returned
        </button>
      );
    }
  }

  return <span className="text-xs text-slate-400">—</span>;
}
