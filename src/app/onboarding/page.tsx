import { auth } from "@/auth";
import { saveOnboardingProfile } from "@/app/onboarding/actions";
import Image from "next/image";
import { redirect } from "next/navigation";

const departments = [
  { value: "cse", label: "CSE" },
  { value: "cb", label: "CB" },
  { value: "mathematics", label: "Mathematics" },
  { value: "design", label: "Design" },
  { value: "ece", label: "ECE" },
  { value: "ssh", label: "SSH" },
];

const programmes = [
  { value: "btech", label: "B.Tech" },
  { value: "mtech", label: "M.Tech" },
  { value: "phd", label: "PhD" },
  { value: "organisation", label: "Organisation" },
];

const onboardingErrorMessages: Record<string, string> = {
  "invalid-profile": "Please check all fields and select a valid department and programme.",
  "save-failed": "We could not save your profile. Please try again in a moment.",
  "duplicate-profile": "This email or roll number is already linked to a profile.",
};

type OnboardingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await auth();
  const params = await searchParams;
  const email = session?.user?.email;
  const errorMessage = params?.error
    ? (onboardingErrorMessages[params.error] ?? "Something went wrong. Please try again.")
    : null;

  if (!email) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#eef4f4] text-slate-950 lg:grid lg:grid-cols-[minmax(0,0.98fr)_minmax(430px,0.72fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#022742] lg:block">
        <Image
          src="/brand/ece-corridor-login.jpg"
          alt="ECE labs corridor at IIIT-Delhi"
          fill
          priority
          sizes="58vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#031b2b]/92 via-[#022742]/72 to-[#022742]/38" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/36 via-transparent to-black/18" />

        <div className="relative flex min-h-screen flex-col px-14 py-12 text-white xl:px-16">
          <Image
            src="/brand/iiitd-logo.png"
            alt="IIIT-Delhi"
            width={278}
            height={110}
            priority
            className="h-auto w-44 brightness-0 invert"
          />

          <div className="mt-auto max-w-2xl pb-16">
            <p className="text-sm font-semibold uppercase text-[#8ee1dc]">
              Electronics and Communications Engineering
            </p>
            <h2 className="mt-5 text-6xl font-semibold leading-[1.02] tracking-tight">
              ECE Lab Inventory
            </h2>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-300/60">
          <div className="relative h-32 lg:hidden">
            <Image
              src="/brand/ece-corridor-login.jpg"
              alt="ECE labs corridor at IIIT-Delhi"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#022742]/42" />
          </div>

          <div className="p-8">
            <Image
              src="/brand/ecelabs-logo.png"
              alt="ECE Labs"
              width={640}
              height={220}
              priority
              className="h-auto w-full max-w-[320px]"
            />

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#1f2933]">
              Complete your profile
            </h1>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {errorMessage}
              </div>
            ) : null}

            <form action={saveOnboardingProfile} className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700" htmlFor="email">
                  Institute email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  readOnly
                  className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-slate-100 px-3 text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="mt-1.5 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#3fada8] focus:ring-2 focus:ring-[#3fada8]/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-700" htmlFor="rollNumber">
                    Roll number / ID
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    className="mt-1.5 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#3fada8] focus:ring-2 focus:ring-[#3fada8]/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700" htmlFor="phoneNumber">
                    Phone number
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    className="mt-1.5 h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#3fada8] focus:ring-2 focus:ring-[#3fada8]/20"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-700" htmlFor="department">
                    Department
                  </label>
                  <select
                    id="department"
                    name="department"
                    required
                    defaultValue=""
                    className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#3fada8] focus:ring-2 focus:ring-[#3fada8]/20"
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {departments.map((department) => (
                      <option key={department.value} value={department.value}>
                        {department.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700" htmlFor="programme">
                    Programme
                  </label>
                  <select
                    id="programme"
                    name="programme"
                    required
                    defaultValue=""
                    className="mt-1.5 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#3fada8] focus:ring-2 focus:ring-[#3fada8]/20"
                  >
                    <option value="" disabled>
                      Select programme
                    </option>
                    {programmes.map((programme) => (
                      <option key={programme.value} value={programme.value}>
                        {programme.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-1 h-9 rounded-md bg-[#022742] px-4 text-sm font-semibold text-white transition hover:bg-[#064463] focus:outline-none focus:ring-2 focus:ring-[#3fada8] focus:ring-offset-2"
              >
                Save profile
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}