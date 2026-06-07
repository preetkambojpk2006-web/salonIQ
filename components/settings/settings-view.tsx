"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateGoogleReviewLink } from "@/lib/settings/actions";

type SettingsViewProps = {
  salonName: string;
  initialGoogleReviewLink: string | null;
};

export function SettingsView({
  salonName,
  initialGoogleReviewLink,
}: SettingsViewProps) {
  const router = useRouter();
  const [googleReviewLink, setGoogleReviewLink] = useState(
    initialGoogleReviewLink ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGoogleReviewLink(initialGoogleReviewLink ?? "");
  }, [initialGoogleReviewLink]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateGoogleReviewLink(googleReviewLink);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="view-stack">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Salon settings</p>
            <h2>{salonName}</h2>
          </div>
        </div>

        <div style={{ maxWidth: 520 }}>
          <label
            htmlFor="google-review-link"
            className="field-label"
            style={{ color: "#1A1A1A", fontWeight: 700 }}
          >
            Google Review Link
          </label>
          <p
            style={{
              margin: "6px 0 10px",
              fontSize: 14,
              color: "#8A8A8A",
              lineHeight: 1.45,
            }}
          >
            Apna Google Business review URL paste karein — payment ke baad
            customers ko review request bhej sakte hain.
          </p>
          <input
            id="google-review-link"
            type="url"
            className="input-field"
            value={googleReviewLink}
            onChange={(event) => setGoogleReviewLink(event.target.value)}
            placeholder="https://g.page/r/..."
            style={{
              borderRadius: 10,
              borderColor: "#E0DAD0",
              color: "#1A1A1A",
            }}
          />
          {error ? (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#D94F4F" }}>
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
            style={{ marginTop: 14, minHeight: 44, borderRadius: 10 }}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
}
