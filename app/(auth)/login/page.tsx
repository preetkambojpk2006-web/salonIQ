import Link from "next/link";
import { AuthAlert } from "@/components/auth/auth-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import { signIn } from "@/lib/auth/actions";

type LoginPageProps = {
  searchParams: { error?: string; message?: string; redirect?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirect = searchParams.redirect ?? "/dashboard";

  return (
    <div className="stack-6">
      <div className="stack-4 text-center">
        <p className="text-eyebrow">SalonIQ</p>
        <h1 className="heading-page">Welcome back</h1>
        <p className="text-body">Sign in to manage your salon</p>
      </div>

      <AuthAlert error={searchParams.error} message={searchParams.message} />

      <form action={signIn} className="stack-4">
        <input type="hidden" name="redirect" value={redirect} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            placeholder="you@salon.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-field"
            placeholder="••••••••"
          />
        </div>

        <SubmitButton label="Sign in" />
      </form>

      <p className="text-center text-body">
        New here? <Link href="/signup" className="link-accent">Create an account</Link>
      </p>
    </div>
  );
}
