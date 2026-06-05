type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  label: string;
  name: string;
  options: SelectOption[];
  required?: boolean;
  defaultValue?: string;
};

export function SelectField({
  label,
  name,
  options,
  required,
  defaultValue,
}: SelectFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        className="select-field"
        defaultValue={defaultValue}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
