"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import {
  createSalonService,
  createSalonStaffMember,
  saveServiceRecipe,
  saveStaffServicePrices,
  toggleSalonServiceActive,
  toggleSalonStaffActive,
  updateSalonService,
  updateSalonStaffMember,
} from "@/lib/salon/actions";
import type {
  RecipeProductOption,
  SalonBranchOption,
  SalonService,
  SalonStaff,
  ServiceRecipe,
  StaffServicePrice,
} from "@/lib/salon/types";
import { useT } from "@/lib/i18n/LanguageContext";

type SalonSetupViewProps = {
  services: SalonService[];
  staff: SalonStaff[];
  branches: SalonBranchOption[];
  staffServicePrices?: StaffServicePrice[];
  serviceRecipes?: ServiceRecipe[];
  recipeProducts?: RecipeProductOption[];
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
  const { t } = useT();
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
      {checked ? t("common.active") : t("common.inactive")}
    </label>
  );
}

function ServiceRow({
  service,
  products,
  recipes,
  onUpdated,
  onRecipeSaved,
  onError,
}: {
  service: SalonService;
  products: RecipeProductOption[];
  recipes: ServiceRecipe[];
  onUpdated: () => void;
  onRecipeSaved: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useT();
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
          <label className="field-label">{t("services.serviceNameLabel")}</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="field-label">{t("services.categoryLabel")}</label>
          <input
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("services.categoryPlaceholder")}
            style={fieldStyle}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">{t("services.durationLabel")}</label>
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
            <label className="field-label">{t("services.priceLabel")}</label>
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
            {saving ? t("common.saving") : t("common.save")}
          </button>
          <button
            type="button"
            className="demo-button"
            onClick={() => setEditing(false)}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            {t("common.cancel")}
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
            {t("common.edit")}
          </button>
        </div>
      </div>
      <ServiceRecipePanel
        service={service}
        products={products}
        recipes={recipes}
        onSaved={onRecipeSaved}
        onError={onError}
      />
    </article>
  );
}

function ServiceRecipePanel({
  service,
  products,
  recipes,
  onSaved,
  onError,
}: {
  service: SalonService;
  products: RecipeProductOption[];
  recipes: ServiceRecipe[];
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const recipeByProductId = useMemo(() => {
    const map = new Map<string, ServiceRecipe>();
    for (const row of recipes) {
      if (row.service_id === service.id) {
        map.set(row.product_id, row);
      }
    }
    return map;
  }, [recipes, service.id]);

  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const product of products) {
      const recipe = recipeByProductId.get(product.id);
      next[product.id] = recipe ? String(recipe.quantity) : "";
    }
    setQtyInputs(next);
  }, [products, recipeByProductId, service.id]);

  const handleSave = async () => {
    setSaving(true);
    const entries = products.map((product) => {
      const raw = qtyInputs[product.id]?.trim() ?? "";
      return {
        product_id: product.id,
        quantity: raw ? Number.parseFloat(raw) : null,
        unit: product.unit_type || null,
      };
    });

    const formData = new FormData();
    formData.set("service_id", service.id);
    formData.set("recipe_json", JSON.stringify(entries));

    const result = await saveServiceRecipe(formData);
    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onSaved();
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #E0DAD0", paddingTop: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: 0,
          border: 0,
          background: "transparent",
          color: "#1A1A1A",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>{t("services.recipe")}</span>
        <span style={{ color: "#8A8A8A", fontSize: 12 }}>{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#8A8A8A", lineHeight: 1.5 }}>
            {t("services.recipeHelp")}
          </p>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 96px 56px",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, color: "#1A1A1A", fontWeight: 600 }}>
                {product.name}
                <span style={{ color: "#8A8A8A", fontWeight: 400 }}>
                  {product.brand_name ? ` · ${product.brand_name}` : ""}
                </span>
              </span>
              <input
                type="number"
                min={0}
                step="any"
                className="input-field"
                value={qtyInputs[product.id] ?? ""}
                placeholder={t("services.recipeQty")}
                aria-label={t("services.recipeIngredient", {
                  product: product.name,
                })}
                onChange={(event) =>
                  setQtyInputs((current) => ({
                    ...current,
                    [product.id]: event.target.value,
                  }))
                }
                style={fieldStyle}
              />
              <span
                style={{ fontSize: 13, color: "#8A8A8A" }}
                aria-label={t("services.recipeUnit")}
              >
                {product.unit_type || "—"}
              </span>
            </div>
          ))}
          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
            style={{ minHeight: 40, borderRadius: 10, justifySelf: "start" }}
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StaffServicePricesPanel({
  staff,
  services,
  overrides,
  onSaved,
  onError,
}: {
  staff: SalonStaff;
  services: SalonService[];
  overrides: StaffServicePrice[];
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeServices = useMemo(
    () => services.filter((service) => service.is_active),
    [services]
  );
  const overrideByServiceId = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of overrides) {
      if (row.staff_id === staff.id) {
        map.set(row.service_id, row.price);
      }
    }
    return map;
  }, [overrides, staff.id]);

  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const service of activeServices) {
      const override = overrideByServiceId.get(service.id);
      next[service.id] =
        override !== undefined ? String(override) : "";
    }
    setPriceInputs(next);
  }, [activeServices, overrideByServiceId, staff.id]);

  const handleSave = async () => {
    setSaving(true);
    const entries = activeServices.map((service) => {
      const raw = priceInputs[service.id]?.trim() ?? "";
      return {
        service_id: service.id,
        price: raw ? Number.parseFloat(raw) : null,
      };
    });

    const formData = new FormData();
    formData.set("staff_id", staff.id);
    formData.set("prices_json", JSON.stringify(entries));

    const result = await saveStaffServicePrices(formData);
    setSaving(false);

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onSaved();
  };

  if (activeServices.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid #E0DAD0", paddingTop: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: 0,
          border: 0,
          background: "transparent",
          color: "#1A1A1A",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>{t("staff.servicePrices")}</span>
        <span style={{ color: "#8A8A8A", fontSize: 12 }}>{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {activeServices.map((service) => (
            <div
              key={service.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, color: "#1A1A1A", fontWeight: 600 }}>
                {service.name}
              </span>
              <input
                type="number"
                min={0}
                step={1}
                className="input-field"
                value={priceInputs[service.id] ?? ""}
                placeholder={t("staff.priceOverridePlaceholder", {
                  amount: formatRs(service.price),
                })}
                aria-label={t("staff.priceOverride", { service: service.name })}
                onChange={(event) =>
                  setPriceInputs((current) => ({
                    ...current,
                    [service.id]: event.target.value,
                  }))
                }
                style={fieldStyle}
              />
            </div>
          ))}
          <button
            type="button"
            className="primary-button"
            onClick={handleSave}
            disabled={saving}
            style={{ minHeight: 40, borderRadius: 10, justifySelf: "start" }}
          >
            {saving ? t("common.saving") : t("staff.saveServicePrices")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StaffRow({
  staff,
  branches,
  services,
  staffServicePrices,
  onUpdated,
  onPricesSaved,
  onError,
}: {
  staff: SalonStaff;
  branches: SalonBranchOption[];
  services: SalonService[];
  staffServicePrices: StaffServicePrice[];
  onUpdated: () => void;
  onPricesSaved: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useT();
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
          <label className="field-label">{t("services.nameLabel")}</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div>
          <label className="field-label">{t("services.branchLabel")}</label>
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
            <label className="field-label">{t("services.roleLabel")}</label>
            <input
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label className="field-label">{t("services.phoneLabel")}</label>
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
          <label className="field-label">{t("services.commissionLabel")}</label>
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
            {saving ? t("common.saving") : t("common.save")}
          </button>
          <button
            type="button"
            className="demo-button"
            onClick={() => setEditing(false)}
            style={{ minHeight: 40, borderRadius: 10 }}
          >
            {t("common.cancel")}
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
            {staff.role || t("services.teamMember")}
            {staff.branch_name ? ` · ${staff.branch_name}` : ""}
            {staff.phone ? ` · ${staff.phone}` : ""}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A8A8A" }}>
            {t("services.commissionValue", {
              percent: String(staff.commission_percent),
            })}
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
            {t("common.edit")}
          </button>
        </div>
      </div>
      <StaffServicePricesPanel
        staff={staff}
        services={services}
        overrides={staffServicePrices}
        onSaved={onPricesSaved}
        onError={onError}
      />
    </article>
  );
}

export function SalonSetupView({
  services,
  staff,
  branches,
  staffServicePrices = [],
  serviceRecipes = [],
  recipeProducts = [],
  bookingSlug = null,
}: SalonSetupViewProps) {
  const { t } = useT();
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
    showToast(t("services.serviceAddedToast"), "success");
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
    showToast(t("services.staffAddedToast"), "success");
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
              {t("services.onlineBookingEyebrow")}
            </p>
            <h2 style={{ marginTop: 4, fontSize: 18 }}>
              {t("services.publicBookingSetup")}
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8A8A8A", lineHeight: 1.5 }}>
              {t("services.bookingNeed")}
              {bookingSlug
                ? t("services.bookingNeedReady")
                : t("services.bookingNeedSettings")}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#1A1A1A" }}>
              {t("services.activeCounts", {
                services: String(activeServices),
                staff: String(activeStaff),
              })}
            </p>
          </section>
        ) : null}

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("services.servicesEyebrow")}</p>
              <h2>{t("services.yours")}</h2>
            </div>
            {services.length > 0 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowServiceForm((value) => !value)}
                style={{ minHeight: 40, borderRadius: 10 }}
              >
                {showServiceForm ? t("services.closeForm") : t("services.newService")}
              </button>
            ) : null}
          </div>

          {services.length === 0 && !showServiceForm ? (
            <EmptyState
              icon="calendar"
              title={t("services.noServices")}
              description={t("services.noServicesDesc")}
              actionLabel={t("services.addFirstService")}
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
                  {t("services.serviceNameLabel")}
                </label>
                <input
                  id="new-service-name"
                  name="name"
                  required
                  className="input-field"
                  placeholder={t("services.serviceNamePlaceholder")}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label htmlFor="new-service-category" className="field-label">
                  {t("services.categoryOptionalLabel")}
                </label>
                <input
                  id="new-service-category"
                  name="category"
                  className="input-field"
                  placeholder={t("services.categoryPlaceholder2")}
                  style={fieldStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-service-duration" className="field-label">
                    {t("services.durationLabel")}
                  </label>
                  <input
                    id="new-service-duration"
                    name="duration_mins"
                    type="number"
                    min={1}
                    required
                    className="input-field"
                    placeholder={t("services.durationPlaceholder")}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label htmlFor="new-service-price" className="field-label">
                    {t("services.priceLabel")}
                  </label>
                  <input
                    id="new-service-price"
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className="input-field"
                    placeholder={t("services.pricePlaceholder")}
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
                {savingService ? t("common.saving") : t("services.saveService")}
              </button>
            </form>
          ) : null}

          {services.length > 0 ? (
            <div className="customer-grid stagger-list">
              {services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  products={recipeProducts}
                  recipes={serviceRecipes}
                  onUpdated={() => {
                    showToast(t("services.serviceUpdatedToast"), "success");
                    refresh();
                  }}
                  onRecipeSaved={() => {
                    showToast(t("services.recipeSaved"), "success");
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
              <p className="eyebrow">{t("services.staffEyebrow")}</p>
              <h2>{t("services.team")}</h2>
            </div>
            {staff.length > 0 && branches.length > 0 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowStaffForm((value) => !value)}
                style={{ minHeight: 40, borderRadius: 10 }}
              >
                {showStaffForm ? t("services.closeForm") : t("services.newStaff")}
              </button>
            ) : null}
          </div>

          {branches.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={t("services.needBranchTitle")}
              description={t("services.needBranchDesc")}
              actionLabel={t("services.needBranchAction")}
              actionHref="/dashboard/branches"
            />
          ) : staff.length === 0 && !showStaffForm ? (
            <EmptyState
              icon="customers"
              title={t("services.noStaff")}
              description={t("services.noStaffDesc")}
              actionLabel={t("services.addFirstStaff")}
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
                  {t("services.branchLabel")}
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
                  {t("services.nameLabel")}
                </label>
                <input
                  id="new-staff-name"
                  name="name"
                  required
                  className="input-field"
                  placeholder={t("services.staffNamePlaceholder")}
                  style={fieldStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-staff-role" className="field-label">
                    {t("services.roleLabel")}
                  </label>
                  <input
                    id="new-staff-role"
                    name="role"
                    className="input-field"
                    placeholder={t("services.rolePlaceholder")}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label htmlFor="new-staff-phone" className="field-label">
                    {t("services.phoneLabel")}
                  </label>
                  <input
                    id="new-staff-phone"
                    name="phone"
                    type="tel"
                    className="input-field"
                    placeholder={t("services.phonePlaceholder")}
                    style={fieldStyle}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="new-staff-commission" className="field-label">
                  {t("services.commissionLabel")}
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
                {savingStaff ? t("common.saving") : t("services.saveStaff")}
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
                  services={services}
                  staffServicePrices={staffServicePrices}
                  onUpdated={() => {
                    showToast(t("services.staffUpdatedToast"), "success");
                    refresh();
                  }}
                  onPricesSaved={() => {
                    showToast(t("staff.servicePricesSaved"), "success");
                    refresh();
                  }}
                  onError={(message) => showToast(message, "error")}
                />
              ))}
            </div>
          ) : null}

          {branches.length > 0 ? (
            <p className="text-body" style={{ marginTop: 16, fontSize: 14 }}>
              {t("services.branchHintBefore")}{" "}
              <Link href="/dashboard/branches" style={{ color: "#1FA873", fontWeight: 700 }}>
                Branches
              </Link>{" "}
              {t("services.branchHintAfter")}
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
