type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  step?: string;
  defaultValue?: string;
  as?: "input" | "textarea";
  hint?: string;
};

export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  required,
  min,
  step,
  defaultValue,
  as = "input",
  hint,
}: FormFieldProps) {
  const controlId = name;

  return (
    <div className="form-field">
      <label htmlFor={controlId} className="field-label">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          id={controlId}
          name={name}
          rows={3}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="textarea-field"
        />
      ) : (
        <input
          id={controlId}
          name={name}
          type={type}
          required={required}
          min={min}
          step={step}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="input-field"
        />
      )}
      {hint ? <p className="text-body" style={{ marginTop: 6, fontSize: 13 }}>{hint}</p> : null}
    </div>
  );
}
