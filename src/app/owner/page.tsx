import { auth } from "@/auth";

export default async function OwnerPage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-[#eef4f4] px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase text-[#3fada8]">
          Faculty Owner Workspace
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Owner dashboard
        </h1>

        <p className="mt-4 text-sm text-slate-600">
          Signed in as {session?.user?.email}
        </p>
      </section>
    </main>
  );
}