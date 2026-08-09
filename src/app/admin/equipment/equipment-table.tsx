"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type EquipmentItem = {
  _id: string;
  name: string;
  description: string;
  type: string;
  link?: string;
  quantityTotal: number;
  quantityAvailable: number;
  isActive: boolean;
  lab: {
    _id: string;
    code: string;
    name: string;
  };
};

type FormData = {
  name: string;
  description: string;
  type: string;
  quantityTotal: string;
  link: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  type: "",
  quantityTotal: "",
  link: "",
};

type ModalMode = "closed" | "add" | "edit";

export function AdminEquipmentTable({
  equipment,
  adminLabId,
}: {
  equipment: EquipmentItem[];
  adminLabId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setModalMode("add");
  }

  function openEdit(item: EquipmentItem) {
    setForm({
      name: item.name,
      description: item.description,
      type: item.type,
      quantityTotal: String(item.quantityTotal),
      link: item.link ?? "",
    });
    setEditingId(item._id);
    setError(null);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode("closed");
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      quantityTotal: Number(form.quantityTotal),
      link: form.link || undefined,
    };

    try {
      const url = modalMode === "add" ? "/api/equipment" : `/api/equipment/${editingId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      closeModal();
      startTransition(() => router.refresh());
    } catch {
      setError("Network error — please try again");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this equipment?")) {
      return;
    }

    setDeletingId(id);

    try {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Delete failed");
        return;
      }

      startTransition(() => router.refresh());
    } catch {
      alert("Network error — please try again");
    } finally {
      setDeletingId(null);
    }
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      {/* Action Bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">
          Showing {equipment.length} item{equipment.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-md bg-[#022742] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#064463]"
        >
          + Add Equipment
        </button>
      </div>

      {/* Equipment Table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="w-36 px-4 py-3 font-semibold">Type</th>
                <th className="w-28 px-4 py-3 font-semibold">Qty</th>
                <th className="w-24 px-4 py-3 font-semibold">Status</th>
                <th className="w-44 px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No equipment yet. Click &quot;+ Add Equipment&quot; to get started.
                  </td>
                </tr>
              ) : (
                equipment.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-slate-50 ${isPending ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#319f9a]">
                          {item.lab.code}
                        </span>
                        {item.link && (
                          <>
                            <span className="text-slate-300">•</span>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800"
                            >
                              Datasheet ↗
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-slate-600 leading-relaxed">
                      {item.description || "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.type}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-[#022742]">
                        {item.quantityAvailable}
                      </span>
                      <span className="text-slate-400"> / {item.quantityTotal}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${
                          item.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {item.lab._id === adminLabId ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === item._id ? "..." : "Delete"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Modal */}
      {modalMode !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#022742]">
                {modalMode === "add" ? "Add Equipment" : "Edit Equipment"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
                  placeholder="e.g. Digital Oscilloscope"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
                  placeholder="Brief description of the equipment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Type *</label>
                  <input
                    type="text"
                    required
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
                    placeholder="e.g. Instrument"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Total Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.quantityTotal}
                    onChange={(e) => updateField("quantityTotal", e.target.value)}
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => updateField("link", e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
                  placeholder="https://example.com/datasheet"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#022742] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#064463]"
                >
                  {modalMode === "add" ? "Add Equipment" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
