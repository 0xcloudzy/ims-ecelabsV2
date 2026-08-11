"use client";

import { useMemo, useState } from "react";
import { BorrowButton } from "./borrow-button";
import type { Types } from "mongoose";

type EquipmentListItem = {
  _id: string;
  name: string;
  description?: string;
  type: string;
  link?: string;
  quantityAvailable: number;
  quantityTotal: number;
  isConsumable?: boolean;
  lab?: {
    _id: string;
    name: string;
    code: string;
  };
};

type LabFilterItem = {
  _id: string;
  name: string;
  code: string;
};

export function StudentEquipmentTable({
  equipment,
  labs,
  isCleared,
}: {
  equipment: EquipmentListItem[];
  labs: LabFilterItem[];
  isCleared: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLab, setSelectedLab] = useState("all");

  const labTabs = [{ _id: "all", code: "all", name: "All Labs" }, ...labs];

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      // 1. Lab filter
      if (selectedLab !== "all" && item.lab?._id !== selectedLab) {
        return false;
      }
      
      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) || false;
        const matchesType = item.type.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [equipment, selectedLab, searchQuery]);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
              Equipment List
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f2933]">
              Browse equipment
            </h1>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <label className="flex flex-1 items-center gap-2 sm:min-w-[360px] xl:flex-none">
              <span className="text-sm font-medium text-slate-700">Search</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment, description, type..."
                className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {labTabs.map((lab) => {
          const isActive = selectedLab === lab._id;
          return (
            <button
              key={lab._id}
              onClick={() => setSelectedLab(lab._id)}
              className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#319f9a] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lab.code === "all" ? "All Labs" : lab.code.toUpperCase()}
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Equipment Name</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">More Info</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No equipment matches this view.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item, index) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-4 max-w-[16rem]">
                      <div className="font-semibold text-slate-900 break-words">
                        {item.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium uppercase tracking-wide text-[#319f9a]">
                          {item.lab?.code ?? "unassigned"}
                        </span>
                        {item.isConsumable && (
                          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                            Consumable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-sm">
                      <div className="max-h-20 overflow-y-auto pr-2 text-xs leading-relaxed text-slate-600 custom-scrollbar">
                        {item.description || "No description provided."}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          Link
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{item.type}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-[#022742]">{item.quantityAvailable}</span>
                      <span className="text-slate-400"> / {item.quantityTotal}</span>
                    </td>
                    <td className="px-4 py-4">
                      <BorrowButton item={item} isCleared={isCleared} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
