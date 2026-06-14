import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className = "sidebar-logout" }: LogoutButtonProps) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        Logout
      </button>
    </form>
  );
}
