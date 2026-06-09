import React from "react";

function FormInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  options,
  required
}) {
  if (type === "select") {
    return (
      <div className="form-group">
        <label className="form-label">
          {label} {required && <span className="required">*</span>}
        </label>
        <select className="select" value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <textarea
          className="input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        className="input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export default FormInput;
