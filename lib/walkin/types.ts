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
  status: "waiting" | "called" | "in_service" | "done" | "left" | "no_show";
  existing_entry: boolean;
};
