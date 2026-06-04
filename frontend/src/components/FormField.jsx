function FormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  errorMessage,
  iconLeft,
  iconRight,
  autoComplete
}) {
  const hasError = Boolean(errorMessage);

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-darkText mb-2">
        {label}
      </label>

      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-darkTextGray">
            {iconLeft}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full h-12 px-4 rounded-xl border bg-darkBg
            text-darkText placeholder-darkTextGray
            focus:outline-none focus:ring-4 focus:ring-primaryBlue/15
            focus:border-primaryBlue
            hover:border-darkTextGray/50
            transition-all duration-200
            ${iconLeft ? "pl-11" : ""}
            ${iconRight ? "pr-11" : ""}
            ${hasError
              ? "border-dangerRed focus:ring-dangerRed/20 focus:border-dangerRed"
              : "border-darkBorder"
            }`}
        />

        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-darkTextGray">
            {iconRight}
          </span>
        )}
      </div>

      {hasError && (
        <p className="mt-2 text-sm text-dangerRed">{errorMessage}</p>
      )}
    </div>
  );
}

export default FormField;
