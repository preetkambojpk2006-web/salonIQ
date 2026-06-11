"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import {
  createSalonService,
  createSalonStaffMember,
  toggleSalonServiceActive,
  toggleSalonStaffActive,
  updateSalonService,
  updateSalonStaffMember,
} from "@/lib/salon/actions";
import type {
  SalonBranchOption,
  SalonService,
  SalonStaff,
} from "@/lib/salon/types";

type SalonSetupViewProps = {
  services: SalonService[];
  staff: SalonStaff[];
  branches: SalonBranchOption[];
  bookingSlug?: string | null;
};

function formatRs(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const fieldStyle: React.CSSProperties = {
  borderRadius: 10,
  borderColor: "#E0DAD0",
};

function ActiveToggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        color: checked ? "#1FA873" : "#8A8A8A",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        style={{ accentColor: "#1FA873" }}
        aria-label={label}
      />
      {checked ? "Active" : "Inactive"}
    </label>
  );
}

function ServiceRow({
  service,
  onUpdated,
  onError,
}: {
  service: SalonService;
  onUpdated: () => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [name, setName] = useState(service.name);
  const [category, setCategory] = useState(service.category ?? "");
  const [duration, setDuration] = useState(String(service.duration_mins));
  const [price, setPrice] = useState(String(service.price));

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.set("service_id", service.id);
    formData.set("name", name);
    formData.set("category", category);
    formData.set("duration_mins", duration);
    formData.set("price", price);

    const result = await updateSalonService(formData);
    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setEditing(false);
    onUpdated();
  };

  const handleToggle = async (next: boolean) => {
    setToggling(true);
    const formData = new FormData();
    formData.set("service_id", service.id);
    formData.set("is_active", next ? "true" : "false");

    const result = await toggleSalonServiceActive(formData);
    setToggling(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onUpdated();
  };

  if (editing) {
    return (
      <article className="customer-card" style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="field-label">Service name</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="field-label">Category</label>
          <input
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Hair, Nails…"
            style={fieldStyle}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Duration (mins)</label>
            <input
              className="input-field"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label className="field-label">Price (₹)</label>
            <input
              className="input-field"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="demo-button"
            onClick={() => setEditing(false)}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            Cancel
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="customer-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong style={{ display: "block", fontSize: 15 }}>{service.name}</strong>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#8A8A8A" }}>
            {service.duration_mins} min · {formatRs(service.price)}
            {service.category ? ` · ${service.category}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ActiveToggle
            checked={service.is_active}
            disabled={toggling}
            onChange={handleToggle}
            label={`Toggle ${service.name}`}
          />
          <button
            type="button"
            className="demo-button"
            onClick={() => setEditing(true)}
            style={{ minHeight: 36, borderRadius: 10, fontSize: 13 }}
          >
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}

function StaffRow({
  staff,
  branches,
  onUpdated,
  onError,
}: {
  staff: SalonStaff;
  branches: SalonBranchOption[];
  onUpdated: () => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState(staff.role ?? "");
  const [phone, setPhone] = useState(staff.phone ?? "");
  const [branchId, setBranchId] = useState(staff.branch_id);
  const [commission, setCommission] = useState(String(staff.commission_percent));

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.set("staff_id", staff.id);
    formData.set("name", name);
    formData.set("role", role);
    formData.set("phone", phone);
    formData.set("branch_id", branchId);
    formData.set("commission_percent", commission);

    const result = await updateSalonStaffMember(formData);
    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    setEditing(false);
    onUpdated();
  };

  const handleToggle = async (next: boolean) => {
    setToggling(true);
    const formData = new FormData();
    formData.set("staff_id", staff.id);
    formData.set("is_active", next ? "true" : "false");

    const result = await toggleSalonStaffActive(formData);
    setToggling(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onUpdated();
  };

  if (editing) {
    return (
      <article className="customer-card" style={{ display: "grid", gap: 12 }}>
        <div>
          <label className="field-label">Name</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="field-label">Branch</label>
          <select
            className="input-field"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            style={fieldStyle}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Role</label>
            <input
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input
              className="input-field"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>
        <div>
          <label className="field-label">Commission (%)</label>
          <input
            className="input-field"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="demo-button"
            onClick={() => setEditing(false)}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            Cancel
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="customer-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong style={{ display: "block", fontSize: 15 }}>{staff.name}</strong>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#8A8A8A" }}>
            {staff.role || "Team member"}
            {staff.branch_name ? ` · ${staff.branch_name}` : ""}
            {staff.phone ? ` · ${staff.phone}` : ""}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A8A8A" }}>
            Commission: {staff.commission_percent}%
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ActiveToggle
            checked={staff.is_active}
            disabled={toggling}
            onChange={handleToggle}
            label={`Toggle ${staff.name}`}
          />
          <button
            type="button"
            className="demo-button"
            onClick={() => setEditing(true)}
            style={{ minHeight: 36, borderRadius: 10, fontSize: 13 }}
          >
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}

export function SalonSetupView({
  services,
  staff,
  branches,
  bookingSlug = null,
}: SalonSetupViewProps) {
  const router = useRouter();
  const [showServiceForm, setShowServiceForm] = useState(services.length === 0);
  const [showStaffForm, setShowStaffForm] = useState(staff.length === 0);
  const [savingService, setSavingService] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  const activeServices = useMemo(
    () => services.filter((service) => service.is_active).length,
    [services]
  );
  const activeStaff = useMemo(
    () => staff.filter((member) => member.is_active).length,
    [staff]
  );
  const bookingReady = activeServices > 0 && activeStaff > 0;

  const showToast = (message: string, variant: "success" | "error") => {
    setToast({ show: true, message, variant });
  };

  const refresh = () => {
    router.refresh();
  };

  const handleCreateService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingService(true);

    const formData = new FormData(event.currentTarget);
    const result = await createSalonService(formData);
    setSavingService(false);

    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }

    event.currentTarget.reset();
    setShowServiceForm(false);
    showToast("Service add ho gayi ✓", "success");
    refresh();
  };

  const handleCreateStaff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingStaff(true);

    const formData = new FormData(event.currentTarget);
    const result = await createSalonStaffMember(formData);
    setSavingStaff(false);

    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }

    event.currentTarget.reset();
    setShowStaffForm(false);
    showToast("Staff add ho gaya ✓", "success");
    refresh();
  };

  return (
    <>
      <div className="view-stack">
        {!bookingReady ? (
          <section
            className="panel"
            style={{
              borderColor: "#1FA873",
              background: "#D4E8DD",
            }}
          >
            <p className="eyebrow" style={{ color: "#1A1A1A" }}>
              Online booking
            </p>
            <h2 style={{ marginTop: 4, fontSize: 18 }}>
              Public booking ke liye setup complete karein
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8A8A8A", lineHeight: 1.5 }}>
              Kam se kam 1 active service aur 1 active staff member chahiye.
              {bookingSlug
                ? " Tabhi customers aapki booking link se appointment request kar payenge."
                : " Settings se booking link copy kar sakte ho."}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#1A1A1A" }}>
              Active services: {activeServices} · Active staff: {activeStaff}
            </p>
          </section>
        ) : null}

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Services</p>
              <h2>Aapki services</h2>
            </div>
            {services.length > 0 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowServiceForm((value) => !value)}
                style={{ minHeight: 40, borderRadius: 10 }}
              >
                {showServiceForm ? "Form band karein" : "Nayi service"}
              </button>
            ) : null}
          </div>

          {services.length === 0 && !showServiceForm ? (
            <EmptyState
              icon="calendar"
              title="Abhi koi service nahi"
              description="Pehli service add karein — price aur duration yahan set hoga."
              actionLabel="Pehli service add karein"
              onAction={() => setShowServiceForm(true)}
            />
          ) : null}

          {showServiceForm ? (
            <form
              onSubmit={handleCreateService}
              style={{
                display: "grid",
                gap: 14,
                maxWidth: 520,
                marginBottom: services.length > 0 ? 16 : 0,
              }}
            >
              <div>
                <label htmlFor="new-service-name" className="field-label">
                  Service name
                </label>
                <input
                  id="new-service-name"
                  name="name"
                  required
                  className="input-field"
                  placeholder="e.g. Haircut"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label htmlFor="new-service-category" className="field-label">
                  Category (optional)
                </label>
                <input
                  id="new-service-category"
                  name="category"
                  className="input-field"
                  placeholder="Hair, Nails, Spa"
                  style={fieldStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-service-duration" className="field-label">
                    Duration (mins)
                  </label>
                  <input
                    id="new-service-duration"
                    name="duration_mins"
                    type="number"
                    min={1}
                    required
                    className="input-field"
                    placeholder="45"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label htmlFor="new-service-price" className="field-label">
                    Price (₹)
                  </label>
                  <input
                    id="new-service-price"
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className="input-field"
                    placeholder="499"
                    style={fieldStyle}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingService}
                className="primary-button"
                style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
              >
                {savingService ? "Saving…" : "Service save karein"}
              </button>
            </form>
          ) : null}

          {services.length > 0 ? (
            <div className="customer-grid stagger-list">
              {services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  onUpdated={() => {
                    showToast("Service update ho gayi ✓", "success");
                    refresh();
                  }}
                  onError={(message) => showToast(message, "error")}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Staff</p>
              <h2>Aapki team</h2>
            </div>
            {staff.length > 0 && branches.length > 0 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowStaffForm((value) => !value)}
                style={{ minHeight: 40, borderRadius: 10 }}
              >
                {showStaffForm ? "Form band karein" : "Naya staff"}
              </button>
            ) : null}
          </div>

          {branches.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Pehle branch chahiye"
              description="Staff add karne ke liye kam se kam ek branch honi chahiye."
              actionLabel="Branches dekho"
              actionHref="/dashboard/branches"
            />
          ) : staff.length === 0 && !showStaffForm ? (
            <EmptyState
              icon="customers"
              title="Abhi koi staff nahi"
              description="Pehla staff add karein — online booking aur calendar dono ke liye zaroori hai."
              actionLabel="Pehla staff add karein"
              onAction={() => setShowStaffForm(true)}
            />
          ) : null}

          {showStaffForm && branches.length > 0 ? (
            <form
              onSubmit={handleCreateStaff}
              style={{
                display: "grid",
                gap: 14,
                maxWidth: 520,
                marginBottom: staff.length > 0 ? 16 : 0,
              }}
            >
              <div>
                <label htmlFor="new-staff-branch" className="field-label">
                  Branch
                </label>
                <select
                  id="new-staff-branch"
                  name="branch_id"
                  required
                  className="input-field"
                  defaultValue={branches[0]?.id}
                  style={fieldStyle}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="new-staff-name" className="field-label">
                  Name
                </label>
                <input
                  id="new-staff-name"
                  name="name"
                  required
                  className="input-field"
                  placeholder="e.g. Priya Sharma"
                  style={fieldStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-staff-role" className="field-label">
                    Role
                  </label>
                  <input
                    id="new-staff-role"
                    name="role"
                    className="input-field"
                    placeholder="Senior stylist"
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label htmlFor="new-staff-phone" className="field-label">
                    Phone
                  </label>
                  <input
                    id="new-staff-phone"
                    name="phone"
                    type="tel"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    style={fieldStyle}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="new-staff-commission" className="field-label">
                  Commission (%)
                </label>
                <input
                  id="new-staff-commission"
                  name="commission_percent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  defaultValue={30}
                  className="input-field"
                  style={fieldStyle}
                />
              </div>
              <button
                type="submit"
                disabled={savingStaff}
                className="primary-button"
                style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
              >
                {savingStaff ? "Saving…" : "Staff save karein"}
              </button>
            </form>
          ) : null}

          {staff.length > 0 ? (
            <div className="customer-grid stagger-list">
              {staff.map((member) => (
                <StaffRow
                  key={member.id}
                  staff={member}
                  branches={branches}
                  onUpdated={() => {
                    showToast("Staff update ho gaya ✓", "success");
                    refresh();
                  }}
                  onError={(message) => showToast(message, "error")}
                />
              ))}
            </div>
          ) : null}

          {branches.length > 0 ? (
            <p className="text-body" style={{ marginTop: 16, fontSize: 14 }}>
              Branch details badalne ke liye{" "}
              <Link href="/dashboard/branches" style={{ color: "#1FA873", fontWeight: 700 }}>
                Branches
              </Link>{" "}
              kholo.
            </p>
          ) : null}
        </section>
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((current) => ({ ...current, show: false }))}
      />
    </>
  );
}
