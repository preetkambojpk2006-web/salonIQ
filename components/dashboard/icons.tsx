import { Icon } from "@/components/dashboard/icon";

type IconComponentProps = {
  className?: string;
  size?: number;
};

export function IconRevenue({ className, size = 20 }: IconComponentProps) {
  return (
    <Icon className={className} size={size}>
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Icon>
  );
}

export function IconBookings({ className, size = 20 }: IconComponentProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </Icon>
  );
}

export function IconPayments({ className, size = 20 }: IconComponentProps) {
  return (
    <Icon className={className} size={size}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M2 10h20" />
    </Icon>
  );
}

export function IconAppointments({ className, size = 20 }: IconComponentProps) {
  return (
    <Icon className={className} size={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6" />
      <path d="M16 14h-4" />
    </Icon>
  );
}

export function IconHome({ className, size = 22 }: IconComponentProps) {
  return (
    <Icon className={className} size={size}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </Icon>
  );
}

export function IconMenu({ className, size = 22 }: IconComponentProps) {
  return (
    <Icon className={className} size={size}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Icon>
  );
}
