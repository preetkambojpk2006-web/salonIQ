import Link from "next/link";
import { AuthAlert } from "@/components/auth/auth-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import { signUp } from "@/lib/auth/actions";

type SignupPageProps = {
  searchParams: { error?: string };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <div className="stack-6">
      <div className="stack-4 text-center">
        <p className="text-eyebrow">SalonIQ</p>
        <h1 className="heading-page">Create your account</h1>
        <p className="text-body">Start running your salon smarter</p>
      </div>

      <AuthAlert error={searchParams.error} />

      <form action={signUp} className="stack-4">
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
            autoComplete="new-password"
            required
            minLength={6}
            className="input-field"
            placeholder="At least 6 characters"
          />
        </div>

        <SubmitButton label="Create account" />
      </form>

      <p className="text-center text-body">
        Already have an account?{" "}
        <Link href="/login" className="link-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
