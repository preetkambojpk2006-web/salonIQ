export type PublicQueueContext = {
  salon_name: string;
  opening_hours_display: string;
  is_open: boolean;
  setup_complete: boolean;
  active_staff_count: number;
  has_services: boolean;
  queue_length: number;
  estimated_wait_mins: number;
  closed_message: string | null;
};

export type WalkinJoinResult = {
  public_token: string;
  daily_token_number: number;
  position: number;
  estimated_wait_mins: number;
  status: WalkinQueueStatus;
  existing_entry: boolean;
};

export type WalkinQueueStatus =
  | "waiting"
  | "called"
  | "in_service"
  | "done"
  | "left"
  | "no_show";

export type WalkinQueueRow = {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  public_token: string;
  daily_token_number: number;
  status: WalkinQueueStatus;
  joined_at: string;
  called_at: string | null;
  service_started_at: string | null;
  completed_at: string | null;
  estimated_wait_mins: number | null;
};

export type WalkinQueueStatusResult = {
  salon_name: string;
  daily_token_number: number;
  status: WalkinQueueStatus;
  position: number;
  estimated_wait_mins: number;
  joined_at: string;
  called_at: string | null;
  service_started_at: string | null;
  completed_at: string | null;
};
