import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef4f4] px-6 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/60">
        <p className="text-sm font-semibold uppercase text-[#3fada8]">
          ECE Lab IMS
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
          Access unavailable
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Your IIITD account is not assigned to this system yet. Contact the lab
          coordinator if you need access.
        </p>

        <Link
          href="/"
          className="mt-8 flex h-11 items-center justify-center rounded-md bg-[#022742] px-4 text-sm font-semibold text-white transition hover:bg-[#064463]"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}