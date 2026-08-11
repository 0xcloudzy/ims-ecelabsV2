"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import * as XLSX from "xlsx";

type EquipmentItem = {
  _id: string;
  name: string;
  description: string;
  type: string;
  link?: string;
  quantityTotal: number;
  quantityAvailable: number;
  isActive: boolean;
  isConsumable?: boolean;
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

type BulkModalMode = "closed" | "selecting" | "uploading" | "success" | "error";

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
  const [bulkMode, setBulkMode] = useState<BulkModalMode>("closed");
  const [bulkMessage, setBulkMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [myLabOnly, setMyLabOnly] = useState(false);
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
    setBulkMode("closed");
    setEditingId(null);
    setError(null);
    setBulkMessage("");
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkMode("uploading");
    setBulkMessage("Reading file...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // ── Helper to extract a value by trying multiple possible header names ──
        const getVal = (row: Record<string, string | number>, keys: string[]) => {
          const key = Object.keys(row).find((k) => keys.includes(k.toLowerCase().trim()));
          return key ? String(row[key] || "") : "";
        };

        // ── Parse Non-Consumables sheet ──
        const ncSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes("non-consumable"));
        let ncItems: { name: string; category: string; quantityTotal: number; description: string; link: string; isConsumable: boolean }[] = [];
        
        if (ncSheetName) {
          const ws = workbook.Sheets[ncSheetName];
          const rawJson = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: "" });
          
          ncItems = rawJson.map((row) => {
            const name = getVal(row, ["equipments/tools", "equipments/tools*", "name", "equipment name", "item"]);
            const category = getVal(row, ["category", "type", "equipment type"]);
            const qtyStr = getVal(row, ["quantity", "qty", "total", "count"]);
            const quantityTotal = qtyStr ? (parseInt(qtyStr, 10) || 1) : 1;

            const make = getVal(row, ["make"]);
            const modelVal = getVal(row, ["model"]);
            const additional = getVal(row, ["additional resources"]);
            const remarks = getVal(row, ["remarks"]);
            const faulty = getVal(row, ["faulty, if any", "faulty"]);

            const descParts: string[] = [];
            if (make) descParts.push(`Make: ${make}`);
            if (modelVal) descParts.push(`Model: ${modelVal}`);
            if (additional) descParts.push(`Resources: ${additional}`);
            if (remarks) descParts.push(`Remarks: ${remarks}`);
            if (faulty) descParts.push(`Faulty: ${faulty}`);
            const description = descParts.join(" | ");

            const urlRegex = /(https?:\/\/[^\s]+)/g;
            let link = "";
            const additionalMatches = additional.match(urlRegex);
            const remarksMatches = remarks.match(urlRegex);
            if (additionalMatches) link = additionalMatches[0];
            else if (remarksMatches) link = remarksMatches[0];
            else link = getVal(row, ["link", "url", "datasheet"]);

            return { name, category, quantityTotal, description, link, isConsumable: false };
          });
        }

        // ── Parse Consumables sheet ──
        const cSheetName = workbook.SheetNames.find(n => {
          const lower = n.toLowerCase();
          return lower.includes("consumable") && !lower.includes("non-consumable");
        });
        let cItems: { name: string; category: string; quantityTotal: number; description: string; link: string; isConsumable: boolean }[] = [];

        if (cSheetName) {
          const ws = workbook.Sheets[cSheetName];
          const rawJson = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: "" });

          cItems = rawJson.map((row) => {
            const name = getVal(row, ["equipments/tools", "equipments/tools*", "name", "equipment name", "item"]);
            const category = getVal(row, ["category", "type", "equipment type"]);
            const qtyStr = getVal(row, ["quantity", "qty", "total", "count"]);
            const quantityTotal = qtyStr ? (parseInt(qtyStr, 10) || 1) : 1;

            const currentStatus = getVal(row, ["current status", "status"]);
            const remarks = getVal(row, ["remarks"]);
            const poDate = getVal(row, ["date of p.o.", "date of po", "po date"]);

            const descParts: string[] = [];
            if (currentStatus) descParts.push(`Status: ${currentStatus}`);
            if (remarks) descParts.push(`Remarks: ${remarks}`);
            if (poDate) descParts.push(`P.O. Date: ${poDate}`);
            const description = descParts.join(" | ");

            return { name, category, quantityTotal, description, link: "", isConsumable: true };
          });
        }

        // ── Combine and fill-down categories for both sets ──
        function fillDownCategories(rawItems: typeof ncItems) {
          let lastCategory = "";
          return rawItems
            .map((item) => {
              if (item.category) lastCategory = item.category;
              return {
                name: item.name,
                type: lastCategory || "Uncategorized",
                quantityTotal: item.quantityTotal,
                description: item.description,
                link: item.link,
                isConsumable: item.isConsumable,
              };
            })
            .filter(item => item.name.trim() !== "");
        }

        const items = [
          ...fillDownCategories(ncItems),
          ...fillDownCategories(cItems),
        ];

        if (items.length === 0) {
          setBulkMode("error");
          setBulkMessage("No valid items found. Ensure you have 'Equipments/Tools', 'Category', and 'Quantity' columns.");
          return;
        }

        setBulkMessage(`Uploading ${items.length} items...`);

        const res = await fetch("/api/equipment/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });

        const resData = await res.json();

        if (!res.ok) {
          setBulkMode("error");
          setBulkMessage(resData.error || "Upload failed.");
          return;
        }

        setBulkMode("success");
        setBulkMessage(resData.message);
        startTransition(() => router.refresh());

      } catch (err) {
        setBulkMode("error");
        setBulkMessage("Failed to parse file. Please upload a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  }

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // My Lab Filter
      if (myLabOnly && item.lab._id !== adminLabId) return false;

      // Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesType = item.type.toLowerCase().includes(q);
        const matchesDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesType && !matchesDesc) return false;
      }

      return true;
    });
  }, [equipment, adminLabId, myLabOnly, searchQuery]);

  return (
    <>
      {/* Action Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-4 text-sm outline-none focus:border-[#319f9a] focus:ring-1 focus:ring-[#319f9a]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={myLabOnly}
              onChange={(e) => setMyLabOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#319f9a] focus:ring-[#319f9a]"
            />
            My Lab Only
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBulkMode("selecting")}
            className="rounded-md border border-[#022742] bg-white px-4 py-2.5 text-sm font-semibold text-[#022742] transition hover:bg-slate-50"
          >
            Upload Excel/CSV
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-md bg-[#022742] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#064463]"
          >
            + Add Equipment
          </button>
        </div>
      </div>

      {/* Equipment Table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No equipment found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-slate-50 ${isPending ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-4 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-4 max-w-[16rem]">
                      <div className="font-semibold text-slate-900 break-words">
                        {item.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#319f9a]">
                          {item.lab.code}
                        </span>
                        {item.isConsumable && (
                          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                            Consumable
                          </span>
                        )}
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
                    <td className="px-4 py-4 max-w-sm">
                      <div className="max-h-20 overflow-y-auto pr-2 text-xs leading-relaxed text-slate-600 custom-scrollbar">
                        {item.description || "—"}
                      </div>
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

      {/* Bulk Upload Modal */}
      {bulkMode !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#022742]">
                Bulk Upload Equipment
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {bulkMode === "selecting" && (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-slate-600">
                  Upload an Excel (.xlsx) or CSV file containing your equipment.
                </p>
                <div className="relative rounded-lg border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-[#319f9a] hover:bg-[#319f9a]/5">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                  />
                  <svg className="mx-auto h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-slate-700">Click or drag file here to upload</p>
                  <p className="text-xs text-slate-500">Supports .xlsx, .csv</p>
                </div>
              </div>
            )}

            {bulkMode === "uploading" && (
              <div className="mt-8 mb-4 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#319f9a]" />
                <p className="mt-4 text-sm font-semibold text-slate-700">{bulkMessage}</p>
              </div>
            )}

            {bulkMode === "error" && (
              <div className="mt-5">
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-semibold">Upload Failed</p>
                  <p className="mt-1">{bulkMessage}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setBulkMode("selecting")} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Try Again</button>
                </div>
              </div>
            )}

            {bulkMode === "success" && (
              <div className="mt-5">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <p className="font-semibold">Upload Successful</p>
                  <p className="mt-1">{bulkMessage}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={closeModal} className="rounded-md bg-[#022742] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064463]">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
