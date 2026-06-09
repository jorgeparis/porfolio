import React from "react";

function FormInput({ label, type, value, onChange, placeholder, options }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === "select" ? (
        <select className="select" value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export default FormInput;
