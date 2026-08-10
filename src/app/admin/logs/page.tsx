export default async function AdminLogsPage(
  props: { searchParams?: Promise<{ q?: string }> }
) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || "";

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
            Inventory Logs
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
            Equipment Change Logs
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This page will display equipment inventory change logs. Coming in Stage 5.
          </p>
        </div>
        <form className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto" action="/admin/logs">
          <label className="flex flex-1 items-center gap-2 sm:min-w-[320px] xl:flex-none">
            <span className="sr-only">Search</span>
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search logs..."
              className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[#022742] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#064463]"
          >
            Search
          </button>
        </form>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-10 text-center text-sm text-slate-500">
          Logs table is under construction.
        </div>
      </section>
    </section>
  );
}
