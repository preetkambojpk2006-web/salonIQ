# SalonIQ — Context Handoff

> **Active path:** `~/Developer/salonIQ` (NOT `~/Desktop/salonIQ`)  
> **Stack:** Next.js 14.2.35 (App Router) + Supabase + TypeScript + Tailwind  
> **GitHub:** https://github.com/preetkambojpk2006-web/salonIQ (private, `main`)  
> **Supabase:** project `sygduucartcliotbnsuu` — migrations via Dashboard SQL Editor (CLI not installed)  
> **Timezone:** Asia/Kolkata (IST) for all salon-day boundaries  
> **UI tone:** casual Hinglish  
> **Multi-tenant:** every table has `business_id` + RLS via `current_user_business_ids()`

---

## LIVE STATUS

| Area | Status |
|------|--------|
| Auth + onboarding | ✅ Working |
| Calendar + bookings | ✅ Working |
| Payments (Cash/UPI) | ✅ Working |
| WhatsApp copy/send modals | ✅ Working (manual wa.me links, no Business API) |
| Online self-booking `/book/[slug]` | ✅ Working |
| Walk-in virtual queue | ✅ Working |
| Staff attendance + fines | ✅ Working |
| Inventory management | ✅ Working |
| Editable time slots + cascade | ✅ Working |
| Reminders automation (cron + WhatsApp API) | ❌ Not started (Phase 6) |

**Last updated:** 2026-06-06

---

## JO BAN CHUKA HAI

### Core platform
- Multi-tenant schema (`businesses`, `branches`, `staff`, `services`) + RLS
- Auth (Supabase) + onboarding flow
- Owner dashboard `/dashboard` (Today view)
- RBAC: `owner` / `admin` / `staff` via `business_members`; staff blocked from Money, Attendance, Inventory, Settings, etc.

### Calendar & appointments
- `/dashboard/calendar` — day/week/month views, new booking form, online pending filter
- Appointment lifecycle: pending → confirmed → completed / cancelled / no_show
- Payment modal on complete (Cash/UPI/Card)
- Customer reliability alerts (warning / blacklisted) on booking cards
- **Editable Time Slots + Cascade Delay** — "Time badlo ✏️" button on appointment detail modal (pending/confirmed, owner/admin only); forward + backward cascade preview (`lib/appointments/cascade.ts`); owner confirm via `CascadePreviewModal`; WhatsApp delay notify via `DelayWhatsAppModal` + `delayNotification()` template. Files: `edit-time-modal.tsx`, `cascade-preview-modal.tsx`, `DelayWhatsAppModal.tsx`, `lib/appointments/actions.ts` (`previewAppointmentTimeChange`, `applyAppointmentTimeCascade`). Calendar grid blocks sized by duration.

### Payments & Money
- `/dashboard/money` — revenue stats, Cash/UPI split, staff advances, staff payouts
- P&L placeholder bars (expenses tracking TODO)
- **Inventory Kharcha** section on Money tab — monthly purchase/usage cards + brand-wise spend table (`InventorySpendSummary.tsx`)

### Customers
- `/dashboard/customers` — list, add customer, phone validation
- Customer notes, reliability scoring, loyalty/rewards system

### Online booking
- Public page `/book/[slug]` — customer self-booking (anon RPCs)
- Booking link card + slug on Today dashboard
- Online pending requests panel on Calendar + Today

### WhatsApp (manual — no Business API)
- `lib/whatsapp/templates.ts` — Hinglish templates (booking, reminder, invoice, delay, queue, loyalty, etc.)
- `lib/whatsapp/sendLink.ts` — `buildWhatsAppLink()` with auto `91` prefix
- `components/whatsapp/MessageActions.tsx` — Copy + Send on WhatsApp
- Modals: `BookingWhatsAppModal`, `PaymentWhatsAppModal`, `DelayWhatsAppModal`

### Coach & insights
- `/dashboard/coach` — rule-based insights (`lib/coach/insights.ts`)
- Coach teaser on Today dashboard
- Staff leaderboard on Today

### Staff & payouts
- Staff commission tracking, earnings, payouts (`StaffPayouts`)
- Staff advances (`StaffAdvances`)
- **Staff Attendance + Fines** — `/dashboard/attendance`; daily Present/Absent/Late marking; auto fine on Late; monthly summary; payout deduction via `staff_fines`. Settings panel for `late_fine_amount`. Tables: `staff_attendance`, `staff_fines`. Column: `businesses.late_fine_amount`.

### Walk-in Virtual Queue
- Public QR join page `/queue/[slug]` — customer self-join (name + phone)
- Status tracking page `/queue/[slug]/t/[token]` — 30s polling via `get_walkin_queue_status`
- Owner dashboard panel on Today (`WalkinQueuePanel`) — action buttons: Bulao / Shuru karo / Done / No-show / Hata do
- WhatsApp "Aapki baari" template (`queueYourTurn()` in `lib/whatsapp/templates.ts`)
- QR card + print on Today (`WalkinQrCard`) and Settings
- RPCs: `get_public_queue_context`, `join_walkin_queue`, `get_walkin_queue_status`
- Table: `walkin_queue`

### Stock & Inventory Management
- `/dashboard/inventory` — 3 tabs: Stock / Kharcha / History
- Brand-wise products, Stock In / Stock Use, weighted avg cost
- Low stock detection (`getLowStockProducts`)
- **Money tab spend summary** — `InventorySpendSummary` on `/dashboard/money`
- **Today low-stock widget** — `LowStockAlerts` on `/dashboard` (owner/admin, only when items exist)
- Tables: `inventory_brands`, `inventory_products`, `inventory_transactions`

### Settings
- Salon profile, branches, loyalty settings, attendance fine amount, walk-in QR

### Design tokens (locked)
- Beige `#EDE8DF`, green `#1FA873`, text `#1A1A1A`, border `#E0DAD0`, 16px card radius, Hinglish copy

---

## KEY SCHEMA

### businesses
```
id, owner_id, name, logo_url, phone, email, opening_hours, created_at,
booking_slug, google_review_link, daily_revenue_target,
reward_enabled, reward_type, reward_threshold, reward_description,
late_fine_amount numeric
```

### branches
```
id, business_id, name, address, phone
```

### staff
```
id, business_id, branch_id, name, role, phone, is_active
```

### services
```
id, business_id, name, category, duration_mins, price, is_active
```

### customers
```
id, business_id, name, phone, gender, birthday, notes, tags,
total_spend, visit_count, last_visit_at, created_at,
reward_pending, reward_earned_at, reward_notified_at, reward_redeemed_at,
loyalty_baseline_visits, loyalty_baseline_spend
```

### appointments
```
id, business_id, branch_id, customer_id, staff_name, service_name,
start_time, end_time, status, notes, total_amount, payment_status,
source, created_at
```

### payments
```
id, business_id, appointment_id, amount, method, status, paid_at, created_at
```

### business_members
```
id, business_id, user_id, app_role, created_at
```

### walkin_queue
```
id, business_id, customer_name, customer_phone, public_token,
daily_token_number, status, joined_at, called_at, service_started_at,
completed_at, estimated_wait_mins
```

### staff_attendance
```
id, business_id, staff_id, staff_name, attendance_date, status,
marked_at, notes
```

### staff_fines
```
id, business_id, staff_id, staff_name, attendance_id, amount, reason,
fine_date, status, deducted_at
```

### inventory_brands
```
id, business_id, name, is_active, created_at
```

### inventory_products
```
id, business_id, brand_id, name, unit_type, current_quantity,
min_quantity, avg_unit_cost, is_active
```

### inventory_transactions
```
id, business_id, product_id, txn_type, quantity, unit_cost, total_cost,
txn_date, notes
```

### Other tables (existing)
- `staff_earnings`, `staff_advances`, `staff_commission_rules` — payout pipeline
- RPCs: `sum_paid_payments_today`, public booking RPCs, walk-in queue RPCs

---

## ABHI NAHI BANA (next phases)

- Phase 6: Reminders automation (cron + WhatsApp Business API)
- Expenses tracking (Money tab P&L is placeholder)
- Cross-day appointment time edits
- Supabase CLI / local migration workflow

---

## PATTERNS TO FOLLOW

- Server actions: `requireOwnerOrAdmin()` for sensitive ops; return `{ ok: true/false, error? }`
- IST day bounds: `calendarDayInTimezone()`, `getDayBoundsIso()` from `lib/payments/date-utils`
- Staff name matching: trim + case-insensitive (`normalizeStaffName()`)
- WhatsApp: always reuse `templates.ts` + `MessageActions.tsx` — never duplicate
- Migrations: additive SQL files in `supabase/migrations/`; user applies via Supabase Dashboard
- Do NOT commit unless explicitly asked
