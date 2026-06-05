type AuthAlertProps = {
  error?: string;
  message?: string;
};

export function AuthAlert({ error, message }: AuthAlertProps) {
  if (!error && !message) return null;

  if (message === "check-email") {
    return (
      <div role="status" className="alert-success">
        Check your email to confirm your account, then sign in.
      </div>
    );
  }

  if (error) {
    const text =
      error === "missing-fields"
        ? "Please enter your email and password."
        : error === "auth-callback-failed"
          ? "Sign-in link expired or invalid. Please try again."
          : decodeURIComponent(error);

    return (
      <div role="alert" className="alert-danger">
        {text}
      </div>
    );
  }

  return null;
}
