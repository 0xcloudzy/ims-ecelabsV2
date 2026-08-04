import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#eef4f4] text-slate-950 lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#022742] lg:block">
        <Image
          src="/brand/ece-banner.jpg"
          alt="ECE lab workspace at IIIT-Delhi"
          fill
          priority
          sizes="58vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#022742]/82" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:34px_34px]" />

        <div className="relative flex min-h-screen flex-col justify-between px-16 py-14 text-white">
          <div>
            <Image
              src="/brand/iiitd-logo.png"
              alt="IIIT-Delhi"
              width={278}
              height={110}
              priority
              className="h-auto w-48 brightness-0 invert"
            />
          </div>

          <div className="max-w-2xl">
            <h1 className="text-6xl font-semibold leading-[1.05] tracking-tight">
              Lab Inventory Management System
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-100">
              A central access point for ECE lab equipment requests, approvals,
              returns, and dues clearance.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/20 pt-8 text-sm text-slate-200">
            <span>Authorized IIITD access only</span>
            <span>ECE Labs</span>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/60">
          <Image
            src="/brand/iiitd-logo.png"
            alt="IIIT-Delhi"
            width={278}
            height={110}
            priority
            className="h-auto w-44"
          />

          <h1 className="mt-10 text-3xl font-semibold tracking-tight text-[#1f2933]">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Continue with your institute Google account to access the ECE Lab
            IMS.
          </p>

          <a
            href="/api/auth/signin/google"
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-[#3fada8] hover:bg-[#f7fbfb] focus:outline-none focus:ring-2 focus:ring-[#3fada8] focus:ring-offset-2"
          >
            <span className="text-lg font-bold text-[#4285f4]">G</span>
            Sign in with Google
          </a>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            Only @iiitd.ac.in accounts are accepted.
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm font-medium text-slate-900">
              Your workspace is selected automatically.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your approved database role determines which dashboard opens
              after sign-in.
            </p>
          </div>

          <p className="mt-8 text-xs text-slate-400">
            Electronics and Communications Engineering, IIIT-Delhi
          </p>
        </div>
      </section>
    </main>
  );
}
