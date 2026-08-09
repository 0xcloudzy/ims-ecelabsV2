import Image from "next/image";
import { auth, signIn } from "@/auth";
import { User } from "@/db/models/user";
import { classifyUserEmail } from "@/lib/auth/user-classification";
import { redirect } from "next/navigation";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default async function LoginPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (email) {
    try {
      const classifiedUser = await classifyUserEmail(email);

      if (classifiedUser.status === "student") {
        const existingUser = await User.exists({ email: classifiedUser.email });

        if (existingUser) {
          redirect("/student");
        }

        redirect("/onboarding");
      }

      if (classifiedUser.status === "staff") {
        if (classifiedUser.role === "lab_admin") {
          redirect("/admin");
        }

        if (classifiedUser.role === "faculty_owner") {
          redirect("/owner");
        }
      }

      redirect("/unauthorized");
    } catch (error) {
      // redirect() throws internally — let it propagate
      const isRedirect =
        error instanceof Error &&
        "digest" in error &&
        typeof (error as { digest?: string }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");

      if (isRedirect) {
        throw error;
      }

      console.error("[login] classification failed, showing login page:", error);
      // Fall through to render the login form
    }
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
            <h1 className="mt-5 text-6xl font-semibold leading-[1.02] tracking-tight">
              ECE Lab Inventory
            </h1>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-300/60">
          <div className="relative h-36 lg:hidden">
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
              className="mx-auto h-auto w-full max-w-[320px]"
            />

            <form
              action={async () => {
                "use server";
                await signIn("google");
              }}
            >
              <button
                type="submit"
                className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3fada8] focus:ring-offset-2"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            </form>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Only @iiitd.ac.in accounts are accepted.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
