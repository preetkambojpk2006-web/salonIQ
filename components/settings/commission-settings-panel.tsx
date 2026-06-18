"use client";

import { Percent, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { saveCommissionConfig } from "@/lib/commission/actions";
import type { CommissionSlab } from "@/lib/commission/slab-calculations";
import { useT } from "@/lib/i18n/LanguageContext";

type CommissionMode = "flat" | "slab";

type SlabRow = {
  key: string;
  minAmount: string;
  maxAmount: string;
  rate: string;
  andAbove: boolean;
};

type CommissionSettingsPanelProps = {
  initialMode?: CommissionMode;
  initialSlabs?: CommissionSlab[];
};

let slabRowCounter = 0;

function nextSlabKey(): string {
  slabRowCounter += 1;
  return `slab-${slabRowCounter}`;
}

function defaultSlabRows(): SlabRow[] {
  return [
    {
      key: nextSlabKey(),
      minAmount: "0",
      maxAmount: "50000",
      rate: "10",
      andAbove: false,
    },
    {
      key: nextSlabKey(),
      minAmount: "50000",
      maxAmount: "",
      rate: "15",
      andAbove: true,
    },
  ];
}

function slabsToRows(slabs: CommissionSlab[]): SlabRow[] {
  if (slabs.length === 0) {
    return [];
  }

  return slabs.map((slab, index) => ({
    key: nextSlabKey(),
    minAmount: String(slab.min_amount),
    maxAmount: slab.max_amount != null ? String(slab.max_amount) : "",
    rate: String(slab.rate),
    andAbove: index === slabs.length - 1 && slab.max_amount === null,
  }));
}

function syncRowMins(rows: SlabRow[]): SlabRow[] {
  return rows.map((row, index) => {
    if (index === 0) {
      return { ...row, minAmount: "0" };
    }

    const previousMax = rows[index - 1]?.maxAmount.trim();
    return {
      ...row,
      minAmount: previousMax || row.minAmount,
    };
  });
}

function rowsToSlabs(rows: SlabRow[]): CommissionSlab[] {
  const synced = syncRowMins(rows);

  return synced.map((row, index) => {
    const isLast = index === synced.length - 1;
    const min_amount = index === 0 ? 0 : Number(synced[index - 1].maxAmount);
    const max_amount =
      isLast && row.andAbove
        ? null
        : row.maxAmount.trim()
          ? Number(row.maxAmount)
          : NaN;

    return {
      min_amount,
      max_amount,
      rate: Number(row.rate),
    };
  });
}

export function CommissionSettingsPanel({
  initialMode = "flat",
  initialSlabs = [],
}: CommissionSettingsPanelProps) {
  const { t } = useT();
  const router = useRouter();
  const [mode, setMode] = useState<CommissionMode>(initialMode);
  const [slabRows, setSlabRows] = useState<SlabRow[]>(() =>
    initialSlabs.length > 0 ? slabsToRows(initialSlabs) : []
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    setMode(initialMode);
    setSlabRows(initialSlabs.length > 0 ? slabsToRows(initialSlabs) : []);
  }, [initialMode, initialSlabs]);

  const handleModeChange = useCallback(
    (nextMode: CommissionMode) => {
      setMode(nextMode);
      if (nextMode === "slab" && slabRows.length === 0) {
        setSlabRows(defaultSlabRows());
      }
    },
    [slabRows.length]
  );

  const updateSlabRow = (index: number, patch: Partial<SlabRow>) => {
    setSlabRows((current) => {
      const next = current.map((row, i) =>
        i === index ? { ...row, ...patch } : { ...row }
      );

      if (patch.maxAmount != null) {
        for (let i = index + 1; i < next.length; i++) {
          next[i] = {
            ...next[i],
            minAmount: next[i - 1].maxAmount,
          };
        }
      }

      if (patch.andAbove === true) {
        return next.map((row, i) =>
          i === index
            ? { ...row, andAbove: true, maxAmount: "" }
            : { ...row, andAbove: false }
        );
      }

      return syncRowMins(next);
    });
  };

  const addTier = () => {
    setSlabRows((current) => {
      if (current.length === 0) {
        return defaultSlabRows();
      }

      const next = current.map((row, index) =>
        index === current.length - 1
          ? { ...row, andAbove: false, maxAmount: row.maxAmount || "50000" }
          : row
      );

      const lastMax = next[next.length - 1]?.maxAmount || "50000";

      return syncRowMins([
        ...next,
        {
          key: nextSlabKey(),
          minAmount: lastMax,
          maxAmount: "",
          rate: "15",
          andAbove: true,
        },
      ]);
    });
  };

  const removeTier = (index: number) => {
    setSlabRows((current) => {
      if (current.length <= 1) {
        return current;
      }

      const next = current.filter((_, i) => i !== index);
      if (next.length > 0) {
        next[next.length - 1] = {
          ...next[next.length - 1],
          andAbove: true,
          maxAmount: "",
        };
      }
      return syncRowMins(next);
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const formData = new FormData();
    formData.set("mode", mode);

    if (mode === "slab") {
      formData.set("slabs", JSON.stringify(rowsToSlabs(slabRows)));
    }

    const result = await saveCommissionConfig(formData);
    setSaving(false);

    if (!result.ok) {
      setToast({ show: true, message: result.error, variant: "error" });
      return;
    }

    setToast({
      show: true,
      message: t("settings.commissionSaved"),
      variant: "success",
    });
    router.refresh();
  };

  return (
    <>
      <section className="panel" id="commission-settings-panel">
        <div className="panel-header">
          <div>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: 0,
              }}
            >
              <Percent size={16} strokeWidth={1.5} aria-hidden />
              {t("settings.commissionTitle")}
            </h2>
          </div>
        </div>

        <div style={{ maxWidth: 640, display: "grid", gap: 14 }}>
          <div>
            <p className="field-label" style={{ marginBottom: 8 }}>
              {t("settings.commissionModeLabel")}
            </p>
            <div className="segmented" style={{ borderRadius: 10 }}>
              <button
                type="button"
                className={mode === "flat" ? "active" : undefined}
                style={
                  mode === "flat"
                    ? {
                        flex: 1,
                        minHeight: 40,
                        borderRadius: 8,
                        background: "#1FA873",
                        color: "#fff",
                      }
                    : { flex: 1, minHeight: 40, borderRadius: 8 }
                }
                onClick={() => handleModeChange("flat")}
              >
                {t("settings.commissionModeFlat")}
              </button>
              <button
                type="button"
                className={mode === "slab" ? "active" : undefined}
                style={
                  mode === "slab"
                    ? {
                        flex: 1,
                        minHeight: 40,
                        borderRadius: 8,
                        background: "#1FA873",
                        color: "#fff",
                      }
                    : { flex: 1, minHeight: 40, borderRadius: 8 }
                }
                onClick={() => handleModeChange("slab")}
              >
                {t("settings.commissionModeSlab")}
              </button>
            </div>
          </div>

          {mode === "flat" ? (
            <p className="text-body" style={{ margin: 0, fontSize: 14 }}>
              {t("settings.commissionFlatHelp")}
            </p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <p className="text-body" style={{ margin: 0, fontSize: 14 }}>
                {t("settings.commissionSlabHelp")}
              </p>

              {slabRows.map((row, index) => {
                const isLast = index === slabRows.length - 1;

                return (
                  <div
                    key={row.key}
                    style={{
                      display: "grid",
                      gap: 10,
                      padding: 14,
                      border: "1px solid #E0DAD0",
                      borderRadius: 16,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div>
                        <label className="field-label">
                          {t("settings.commissionMinAmount")}
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={index === 0 ? "0" : row.minAmount}
                          readOnly
                          style={{
                            borderRadius: 10,
                            borderColor: "#E0DAD0",
                            background: "#F9F8F3",
                          }}
                        />
                      </div>

                      <div>
                        <label className="field-label">
                          {t("settings.commissionMaxAmount")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          className="input-field"
                          value={row.andAbove ? "" : row.maxAmount}
                          disabled={row.andAbove}
                          onChange={(e) =>
                            updateSlabRow(index, { maxAmount: e.target.value })
                          }
                          placeholder={
                            row.andAbove
                              ? t("settings.commissionAndAbove")
                              : undefined
                          }
                          style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
                        />
                      </div>

                      <div>
                        <label className="field-label">
                          {t("settings.commissionRate")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          className="input-field"
                          value={row.rate}
                          onChange={(e) =>
                            updateSlabRow(index, { rate: e.target.value })
                          }
                          style={{ borderRadius: 10, borderColor: "#E0DAD0" }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {isLast ? (
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            color: "#1A1A1A",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={row.andAbove}
                            onChange={(e) =>
                              updateSlabRow(index, {
                                andAbove: e.target.checked,
                              })
                            }
                            style={{ width: 16, height: 16, accentColor: "#1FA873" }}
                          />
                          {t("settings.commissionAndAbove")}
                        </label>
                      ) : (
                        <span style={{ fontSize: 13, color: "#8A8A8A" }}>
                          {t("settings.commissionTierLabel", {
                            tier: String(index + 1),
                          })}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        disabled={slabRows.length <= 1}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          border: "none",
                          background: "transparent",
                          color: slabRows.length <= 1 ? "#C4C4C4" : "#D94F4F",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor:
                            slabRows.length <= 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        <Trash2 size={16} strokeWidth={1.5} aria-hidden />
                        {t("settings.commissionDeleteTier")}
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addTier}
                className="invoice-btn-outline"
                style={{ justifySelf: "start" }}
              >
                {t("settings.commissionAddTier")}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
            style={{ minHeight: 44, borderRadius: 10, justifySelf: "start" }}
          >
            {saving ? t("common.saving") : t("settings.saveCommission")}
          </button>
        </div>
      </section>

      <Toast
        message={toast.message}
        show={toast.show}
        variant={toast.variant}
        onDismiss={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}
